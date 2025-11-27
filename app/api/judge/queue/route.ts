// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

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

    // Check if user is a judge
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Get requests the judge hasn't responded to yet
    const { data: respondedRequestIds } = await supabase
      .from('verdict_responses')
      .select('request_id')
      .eq('judge_id', user.id);

    const excludeIds = respondedRequestIds?.map((r) => r.request_id) || [];

    // Fetch open requests
    // Status can be: 'pending', 'in_progress', 'open', 'closed', 'cancelled'
    // We want requests that are actively looking for judges
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
        status
      `)
      .in('status', ['open', 'in_progress', 'pending']) // All active statuses
      .neq('user_id', user.id) // Exclude own requests
      .is('deleted_at', null)
      .order('created_at', { ascending: true }) // Oldest first
      .limit(limit);

    log.debug('Judge queue query starting', { excludeCount: excludeIds.length });

    // Exclude already responded requests
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: requests, error } = await query;

    if (error) {
      log.error('Failed to fetch judge queue', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    log.debug('Judge queue fetched', { count: requests?.length || 0, excludedCount: excludeIds.length });

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    log.error('Judge queue endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
