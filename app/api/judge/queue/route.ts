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

// Helper function for standard community queue
async function getStandardQueue(supabase: any, userId: string, limit: number) {
  // Get requests the judge hasn't responded to yet
  const { data: respondedRequestIds } = await supabase
    .from('verdict_responses')
    .select('request_id')
    .eq('judge_id', userId);

  const excludeIds = respondedRequestIds?.map((r: any) => r.request_id) || [];

  // Fetch open requests
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
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  // Exclude already responded requests
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data: requests, error } = await query;

  if (error) {
    log.error('Failed to fetch standard queue', error);
    throw error;
  }

  return requests || [];
}
