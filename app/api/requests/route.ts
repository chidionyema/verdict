import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import {
  validateContext,
  validateCategory,
  validateMediaType,
  VERDICT_TIERS,
  VERDICT_TIER_PRICING,
} from '@/lib/validations';
import { createVerdictRequest } from '@/lib/verdicts';
import { requestRateLimiter, generalApiRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { sendRequestLifecycleEmail } from '@/lib/notifications';
import { moderateRequest } from '@/lib/moderation-free';
import { moderateContentWithAI } from '@/lib/moderation/ai-moderation';
import { ExpertRoutingService } from '@/lib/expert-routing';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/requests - List current user's requests (unified: verdict, comparison, split test)
const GET_Handler = async (request: NextRequest) => {
  const startTime = performance.now();
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitCheck = await checkRateLimit(generalApiRateLimiter, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
      // Fetch all types of requests in parallel
      const [verdictRequests, comparisonRequests, splitTestRequests] = await Promise.all([
        // Standard verdict requests
        fetchVerdictRequests(supabase, user.id, searchParams),
        // Comparison requests  
        fetchComparisonRequestsForUser(supabase, user.id),
        // Split test requests
        fetchSplitTestRequestsForUser(supabase, user.id)
      ]);

      // Combine and normalize all requests with type indicators
      const allRequests = [
        ...verdictRequests.map((req: any) => ({ 
          ...req, 
          request_type: 'verdict',
          view_url: `/requests/${req.id}`
        })),
        ...comparisonRequests.map((req: any) => ({ 
          ...req, 
          request_type: 'comparison',
          view_url: `/comparisons/${req.id}`
        })),
        ...splitTestRequests.map((req: any) => ({ 
          ...req, 
          request_type: 'split_test',
          view_url: `/split-tests/${req.id}`
        }))
      ];

      // Sort by creation date and apply pagination
      const sortedRequests = allRequests
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit);

      const response = NextResponse.json({ 
        requests: sortedRequests,
        total: allRequests.length,
        hasMore: offset + limit < allRequests.length
      });
      response.headers.set('X-Response-Time', `${Math.round(performance.now() - startTime)}ms`);
      return response;

    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
      log.error('Failed to fetch unified requests', { error: errorMessage, stack: errorStack });
      console.error('Fetch error details:', fetchError);
      return NextResponse.json({
        error: `Database error: ${errorMessage}`,
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    log.error('Requests GET endpoint error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fetch standard verdict requests for user
async function fetchVerdictRequests(supabase: any, userId: string, searchParams: URLSearchParams) {
  const { data: requests, error } = await supabase
    .from('verdict_requests')
    .select(`
      id,
      category,
      subcategory,
      media_type,
      media_url,
      text_content,
      context,
      status,
      target_verdict_count,
      received_verdict_count,
      created_at,
      request_tier
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Verdict requests query error:', JSON.stringify(error, null, 2));
    throw new Error(`Database query failed: ${error.message || error.code || 'Unknown error'}`);
  }

  // Fetch verdict responses for all requests to calculate average ratings
  const requestIds = (requests || []).map((r: any) => r.id);
  let verdictsByRequest: Record<string, any[]> = {};

  if (requestIds.length > 0) {
    const { data: verdicts } = await supabase
      .from('verdict_responses')
      .select('request_id, rating')
      .in('request_id', requestIds);

    if (verdicts) {
      verdicts.forEach((v: any) => {
        if (!verdictsByRequest[v.request_id]) {
          verdictsByRequest[v.request_id] = [];
        }
        verdictsByRequest[v.request_id].push(v);
      });
    }
  }

  // Return requests with calculated average rating
  return (requests || []).map((request: any) => {
    const reqVerdicts = verdictsByRequest[request.id] || [];
    const validRatings = reqVerdicts.filter((v: any) => v.rating != null);
    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum: number, v: any) => sum + v.rating, 0) / validRatings.length
      : null;

    return {
      ...request,
      verdict_count: request.received_verdict_count || 0,
      avg_rating: avgRating,
      folder_id: null // Add for compatibility with UI
    };
  });
}

// Fetch comparison requests for user with average ratings
async function fetchComparisonRequestsForUser(supabase: any, userId: string) {
  try {
    const { data: requests, error } = await supabase
      .from('comparison_requests')
      .select(`
        id,
        created_at,
        decision_context,
        option_a_title,
        option_b_title,
        option_a_image_url,
        option_b_image_url,
        status,
        request_tier,
        target_verdict_count,
        received_verdict_count,
        winning_option
      `)
      .eq('user_id', userId);

    if (error) {
      console.log('Comparison requests table not found, returning empty array');
      return [];
    }

    // Fetch verdicts for all comparison requests to calculate average confidence
    const requestIds = (requests || []).map((r: any) => r.id);
    let verdictsByRequest: Record<string, any[]> = {};

    if (requestIds.length > 0) {
      const { data: verdicts } = await supabase
        .from('comparison_verdicts')
        .select('comparison_request_id, confidence_score')
        .in('comparison_request_id', requestIds);

      if (verdicts) {
        verdicts.forEach((v: any) => {
          if (!verdictsByRequest[v.comparison_request_id]) {
            verdictsByRequest[v.comparison_request_id] = [];
          }
          verdictsByRequest[v.comparison_request_id].push(v);
        });
      }
    }

    // Normalize comparison request format to match verdict requests
    return (requests || []).map((req: any) => {
      const reqVerdicts = verdictsByRequest[req.id] || [];
      const avgRating = reqVerdicts.length > 0
        ? reqVerdicts.reduce((sum: number, v: any) => sum + (v.confidence_score || 0), 0) / reqVerdicts.length
        : null;

      return {
        id: req.id,
        created_at: req.created_at,
        category: 'comparison',
        subcategory: 'decision',
        media_type: 'comparison',
        media_url: req.option_a_image_url,
        text_content: req.decision_context,
        context: `Compare: ${req.option_a_title} vs ${req.option_b_title}`,
        target_verdict_count: req.target_verdict_count,
        received_verdict_count: req.received_verdict_count,
        status: req.status,
        request_tier: req.request_tier,
        folder_id: null,
        verdict_count: req.received_verdict_count,
        avg_rating: avgRating,
        comparison_data: {
          option_a_title: req.option_a_title,
          option_b_title: req.option_b_title,
          option_a_image_url: req.option_a_image_url,
          option_b_image_url: req.option_b_image_url,
          winning_option: req.winning_option
        }
      };
    });
  } catch (error) {
    console.log('Error fetching comparison requests:', error);
    return [];
  }
}

// Fetch split test requests for user with consensus strength as rating
async function fetchSplitTestRequestsForUser(supabase: any, userId: string) {
  try {
    const { data: requests, error } = await supabase
      .from('split_test_requests')
      .select(`
        id,
        created_at,
        context,
        photo_a_url,
        photo_b_url,
        status,
        target_verdict_count,
        received_verdict_count,
        winning_photo,
        consensus_strength
      `)
      .eq('user_id', userId);

    if (error) {
      console.log('Split test requests table not found, returning empty array');
      return [];
    }

    // Normalize split test request format to match verdict requests
    // Use consensus_strength as the "rating" since it indicates how decisive the result was
    return (requests || []).map((req: any) => ({
      id: req.id,
      created_at: req.created_at,
      category: 'split_test',
      subcategory: 'photo_comparison',
      media_type: 'split_test',
      media_url: req.photo_a_url,
      text_content: req.context,
      context: `Photo A vs Photo B: ${req.context}`,
      target_verdict_count: req.target_verdict_count,
      received_verdict_count: req.received_verdict_count,
      status: req.status,
      request_tier: 'basic',
      folder_id: null,
      verdict_count: req.received_verdict_count,
      // Use consensus_strength (0-100) scaled to 1-10 for consistency
      avg_rating: req.consensus_strength ? (req.consensus_strength / 10) : null,
      split_test_data: {
        photo_a_url: req.photo_a_url,
        photo_b_url: req.photo_b_url,
        winning_photo: req.winning_photo,
        consensus_strength: req.consensus_strength
      }
    }));
  } catch (error) {
    console.log('Error fetching split test requests:', error);
    return [];
  }
}

export const GET = withRateLimit(GET_Handler, rateLimitPresets.standard);

// POST /api/requests - Create a new verdict request
const POST_Handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - strict for request creation
    const rateLimitCheck = await checkRateLimit(requestRateLimiter, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
        }
      );
    }

    const body = await request.json();
    const {
      category,
      subcategory,
      media_type,
      media_url,
      text_content,
      context,
      tier,
      request_tier,
      requested_tone,
      roast_mode,
      visibility,
    } = body;

    // Validate category
    if (!validateCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Handle both old tier system and new request_tier system
    let tierConfig;
    if (request_tier) {
      // New pricing tier system
      const { data: pricingTier } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('tier', request_tier)
        .eq('active', true)
        .single();
      
      if (!pricingTier) {
        return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 });
      }
      
      tierConfig = {
        credits: (pricingTier as any).credits_required,
        verdicts: (pricingTier as any).verdict_count
      };
    } else {
      // Legacy tier system (fallback)
      const normalizedTier =
        tier && VERDICT_TIER_PRICING[tier as keyof typeof VERDICT_TIER_PRICING]
          ? (tier as keyof typeof VERDICT_TIER_PRICING)
          : 'basic';
      
      tierConfig = VERDICT_TIER_PRICING[normalizedTier];
    }

    // Validate media_type
    if (!validateMediaType(media_type)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Validate context
    const contextValidation = validateContext(context);
    if (!contextValidation.valid) {
      return NextResponse.json(
        { error: contextValidation.error },
        { status: 400 }
      );
    }

    // Validate media based on type
    if (media_type === 'photo' && !media_url) {
      return NextResponse.json(
        { error: 'Photo URL is required for photo requests' },
        { status: 400 }
      );
    }
    if (media_type === 'text' && !text_content) {
      return NextResponse.json(
        { error: 'Text content is required for text requests' },
        { status: 400 }
      );
    }

    // AI-powered content moderation with fallback
    let moderationResult;
    try {
      moderationResult = await moderateContentWithAI(
        context,
        media_type === 'photo' ? media_url : undefined,
        media_type === 'photo' ? media_url?.split('/').pop() : undefined
      );
    } catch (aiError) {
      log.warn('AI moderation failed, falling back to rule-based', { error: aiError });
      moderationResult = moderateRequest(
        context,
        media_type,
        media_type === 'photo' ? media_url?.split('/').pop() : undefined,
        undefined
      );
    }

    if (!moderationResult.approved) {
      log.info('Content moderation rejected request', { 
        reason: moderationResult.reason,
        confidence: moderationResult.confidence,
      });
      return NextResponse.json(
        {
          error: 'Content does not meet community guidelines',
          reason: moderationResult.reason,
          details: 'Please review our community guidelines and modify your request.'
        },
        { status: 400 }
      );
    }

    // Delegate to domain logic for credits + request creation
    try {
      // Validate and normalize requested tone
      const validTones = ['encouraging', 'honest', 'brutally_honest'];
      const normalizedTone = requested_tone && validTones.includes(requested_tone) 
        ? requested_tone as 'encouraging' | 'honest' | 'brutally_honest'
        : 'honest';

      const { request: createdRequest } = await createVerdictRequest(
        supabase as any,
        {
          userId: user.id,
          email: (user.email ?? null) as string | null,
          category,
          subcategory,
          media_type,
          media_url,
          text_content,
          context,
          requestedTone: normalizedTone,
          roastMode: roast_mode || false,
          visibility: visibility || 'private',
          // Use tier config
          creditsToCharge: tierConfig.credits,
          targetVerdictCount: tierConfig.verdicts,
          requestTier: request_tier || 'community',
        }
      );

      // Best-effort email notification
      if (user.email) {
        void sendRequestLifecycleEmail('request_created', {
          to: user.email,
          requestId: createdRequest.id,
          title: context?.slice(0, 80),
          category,
        });
      }

      // Trigger expert routing for appropriate tiers (async, don't block response)
      if (request_tier === 'pro' || request_tier === 'standard') {
        const expertRouting = new ExpertRoutingService(supabase as any);
        
        // Route asynchronously to avoid blocking the response
        expertRouting.routeRequest(createdRequest.id).catch(error => {
          log.error('Expert routing failed (non-blocking)', { 
            requestId: createdRequest.id, 
            tier: request_tier, 
            error 
          });
        });

        log.info('Expert routing initiated', { 
          requestId: createdRequest.id, 
          tier: request_tier 
        });
      }

      return NextResponse.json({ request: createdRequest }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          { error: 'Insufficient credits. Please purchase more.' },
          { status: 402 }
        );
      }

      log.error('Failed to create verdict request', err);
      return NextResponse.json(
        { error: 'Failed to create request', details: err?.message },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('Requests POST endpoint error', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
