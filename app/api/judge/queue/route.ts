import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .single();

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
    let query = supabase
      .from('verdict_requests')
      .select(`
        id,
        created_at,
        category,
        subcategory,
        media_type,
        context,
        target_verdict_count,
        received_verdict_count
      `)
      .eq('status', 'open')
      .neq('user_id', user.id) // Exclude own requests
      .is('deleted_at', null)
      .is('is_flagged', false)
      .order('created_at', { ascending: true }) // Oldest first
      .limit(limit);

    // Exclude already responded requests
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Fetch queue error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('GET /api/judge/queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
