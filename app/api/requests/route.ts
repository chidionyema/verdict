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
import { ExpertRoutingService } from '@/lib/expert-routing';

// GET /api/requests - List current user's requests
export async function GET(request: NextRequest) {
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with optional filters
    let query = supabase
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
        request_tier,
        folder_id,
        verdict_count:verdicts(count),
        avg_rating:verdicts(rating)
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Handle unorganized requests filter
    const unorganized = searchParams.get('unorganized');
    if (unorganized === 'true') {
      query = query.is('folder_id', null);
    }

    const { data: requests, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error('Failed to fetch requests', error);
      return NextResponse.json({
        error: 'Database error',
        details: error.message
      }, { status: 500 });
    }

    // Process the data to calculate averages
    const processedRequests = (requests || []).map(request => {
      const verdictCount = Array.isArray((request as any).verdict_count) 
        ? (request as any).verdict_count.length 
        : 0;
      
      const ratings = Array.isArray((request as any).avg_rating)
        ? (request as any).avg_rating.map((v: any) => v.rating).filter((r: any) => r !== null)
        : [];
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
        : null;

      return {
        ...(request as any),
        verdict_count: verdictCount,
        avg_rating: avgRating
      };
    });

    const response = NextResponse.json({ requests: processedRequests });
    response.headers.set('X-Response-Time', `${Math.round(performance.now() - startTime)}ms`);
    return response;

  } catch (error) {
    log.error('Requests GET endpoint error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create a new verdict request
export async function POST(request: NextRequest) {
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

    // Content moderation check
    const moderationResult = moderateRequest(
      context,
      media_type,
      media_type === 'photo' ? media_url?.split('/').pop() : undefined,
      undefined // file size not available here, but checked on upload
    );

    if (!moderationResult.approved) {
      log.info('Content moderation rejected request', { reason: moderationResult.reason });
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
