import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'pending', 'available', 'paid', etc.
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('judge_earnings')
      .select(`
        *,
        verdict_responses!inner(
          id,
          verdict_requests!inner(
            id,
            category,
            context,
            created_at
          )
        )
      `)
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('payout_status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: earnings, error, count } = await query;

    if (error) {
      console.error('Error fetching earnings:', error);
      return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
    }

    // Get total earnings summary
    const { data: totalEarnings } = await supabase.rpc('get_available_payout_amount', {
      target_judge_id: user.id,
    });

    // Get earnings by status
    const { data: earningsSummary } = await supabase
      .from('judge_earnings')
      .select('payout_status, net_amount_cents')
      .eq('judge_id', user.id);

    const summary = earningsSummary?.reduce((acc, earning) => {
      if (!acc[earning.payout_status]) {
        acc[earning.payout_status] = 0;
      }
      acc[earning.payout_status] += earning.net_amount_cents;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      earnings,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      summary: {
        available_for_payout: totalEarnings || 0,
        pending: summary.pending || 0,
        paid: summary.paid || 0,
        total_earned: Object.values(summary).reduce((sum, amount) => sum + amount, 0),
      },
    });

  } catch (error) {
    console.error('Judge earnings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}