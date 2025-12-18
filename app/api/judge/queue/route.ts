import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { ExpertRoutingService } from '@/lib/expert-routing';

// GET /api/judge/queue - Get open requests for judges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a judge and get expert status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single() as { data: { is_judge: boolean } | null };

    if (!profile?.is_judge) {
      return NextResponse.json(
        { error: 'Must be a judge to access queue' },
        { status: 403 }
      );
    }

    // Check if user is a verified expert
    const { data: expertVerification } = await (supabase as any)
      .from('expert_verifications')
      .select('id, industry, job_title')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .single();

    const isExpert = !!expertVerification;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Update expert activity
    const expertRouting = new ExpertRoutingService(supabase as any);
    if (isExpert) {
      await expertRouting.updateExpertAvailability(user.id);
    }

    let requests: any[] = [];

    if (isExpert) {
      // Use expert-specific queue with intelligent routing
      try {
        requests = await expertRouting.getExpertQueue(user.id, limit);
        log.info('Expert queue retrieved', { 
          expertId: user.id, 
          count: requests.length,
          industry: (expertVerification as any)?.industry 
        });
      } catch (error) {
        log.error('Failed to get expert queue, falling back to standard queue', error);
        // Fall back to standard queue if expert queue fails
        requests = await getStandardQueue(supabase, user.id, limit);
      }
    } else {
      // Standard community judge queue
      requests = await getStandardQueue(supabase, user.id, limit);
    }

    // Filter out expert-only requests for non-experts
    if (!isExpert) {
      requests = requests.filter(req => !req.expert_only && req.request_tier !== 'pro');
    }

    // Add expert context for response
    const response = {
      requests: requests || [],
      isExpert,
      expertInfo: isExpert ? {
        industry: (expertVerification as any)?.industry,
        title: (expertVerification as any)?.job_title
      } : null,
      queueType: isExpert ? 'expert' : 'community'
    };

    return NextResponse.json(response);
  } catch (error) {
    log.error('Judge queue endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function for standard community queue with unified request types
async function getStandardQueue(supabase: any, userId: string, limit: number) {
  try {
    // Get all types of requests the judge hasn't responded to yet
    const [verdictResponses, comparisonResponses, splitTestResponses] = await Promise.all([
      supabase
        .from('verdict_responses')
        .select('request_id')
        .eq('judge_id', userId),
      supabase
        .from('comparison_responses')
        .select('comparison_id')
        .eq('judge_id', userId)
        .then((res: any) => ({ data: res.data?.map((r: any) => ({ request_id: r.comparison_id })) || [] })),
      supabase
        .from('split_test_verdicts')
        .select('split_test_id')
        .eq('judge_id', userId)
        .then((res: any) => ({ data: res.data?.map((r: any) => ({ request_id: r.split_test_id })) || [] }))
    ]);

    const excludeVerdictIds = verdictResponses?.data?.map((r: any) => r.request_id) || [];
    const excludeComparisonIds = comparisonResponses?.data?.map((r: any) => r.request_id) || [];
    const excludeSplitTestIds = splitTestResponses?.data?.map((r: any) => r.request_id) || [];

    // Fetch all types of requests in parallel
    const [verdictRequests, comparisonRequests, splitTestRequests] = await Promise.all([
      // Standard verdict requests
      getVerdictRequests(supabase, userId, excludeVerdictIds, Math.ceil(limit * 0.6)),
      // Comparison requests  
      getComparisonRequests(supabase, userId, excludeComparisonIds, Math.ceil(limit * 0.2)),
      // Split test requests
      getSplitTestRequests(supabase, userId, excludeSplitTestIds, Math.ceil(limit * 0.2))
    ]);

    // Combine and normalize all requests with type indicators
    const allRequests = [
      ...verdictRequests.map((req: any) => ({ ...req, request_type: 'verdict', priority_score: req.priority_score || 0 })),
      ...comparisonRequests.map((req: any) => ({ ...req, request_type: 'comparison', priority_score: req.priority_score || 10 })),
      ...splitTestRequests.map((req: any) => ({ ...req, request_type: 'split_test', priority_score: req.priority_score || 5 }))
    ];

    // Sort by priority and creation date, then limit
    const sortedRequests = allRequests
      .sort((a, b) => {
        if (b.priority_score !== a.priority_score) {
          return b.priority_score - a.priority_score;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, limit);

    return sortedRequests;
  } catch (error) {
    log.error('Failed to fetch unified queue', error);
    throw error;
  }
}

// Fetch standard verdict requests
async function getVerdictRequests(supabase: any, userId: string, excludeIds: string[], limit: number) {
  let query = supabase
    .from('verdict_requests')
    .select(`
      id,
      created_at,
      category,
      subcategory,
      media_type,
      media_url,
      text_content,
      context,
      target_verdict_count,
      received_verdict_count,
      status,
      request_tier,
      expert_only,
      priority_score
    `)
    .in('status', ['open', 'in_progress', 'pending'])
    .neq('user_id', userId)
    .is('deleted_at', null)
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Fetch comparison requests
async function getComparisonRequests(supabase: any, userId: string, excludeIds: string[], limit: number) {
  let query = supabase
    .from('comparison_requests')
    .select(`
      id,
      created_at,
      decision_context,
      option_a_title,
      option_b_title,
      option_a_image_url,
      option_b_image_url,
      budget_consideration,
      status,
      request_tier,
      expert_required,
      priority_score,
      target_verdict_count,
      received_verdict_count
    `)
    .in('status', ['pending', 'active'])
    .neq('user_id', userId)
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Normalize comparison request format to match verdict requests
  return (data || []).map((req: any) => ({
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
    expert_only: req.expert_required,
    priority_score: req.priority_score,
    comparison_data: {
      option_a_title: req.option_a_title,
      option_b_title: req.option_b_title,
      option_a_image_url: req.option_a_image_url,
      option_b_image_url: req.option_b_image_url,
      budget_consideration: req.budget_consideration
    }
  }));
}

// Fetch split test requests
async function getSplitTestRequests(supabase: any, userId: string, excludeIds: string[], limit: number) {
  let query = supabase
    .from('split_test_requests')
    .select(`
      id,
      created_at,
      context,
      photo_a_url,
      photo_b_url,
      status,
      target_verdict_count,
      received_verdict_count
    `)
    .in('status', ['active', 'pending'])
    .neq('user_id', userId)
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Normalize split test request format to match verdict requests
  return (data || []).map((req: any) => ({
    id: req.id,
    created_at: req.created_at,
    category: 'split_test',
    subcategory: 'photo_comparison',
    media_type: 'split_test',
    media_url: req.photo_a_url,
    text_content: req.context,
    context: 'Which photo is better?',
    target_verdict_count: req.target_verdict_count,
    received_verdict_count: req.received_verdict_count,
    status: req.status,
    request_tier: 'basic',
    expert_only: false,
    priority_score: 5,
    split_test_data: {
      photo_a_url: req.photo_a_url,
      photo_b_url: req.photo_b_url
    }
  }));
}
