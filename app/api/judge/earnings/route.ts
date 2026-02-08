import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate and bound pagination params
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

    const status = searchParams.get('status'); // 'pending', 'available', 'paid', etc.
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = (supabase as any)
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
      log.error('Error fetching earnings', error);
      return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
    }

    // Get earnings by status and total amounts (in dollars)
    const { data: earningsSummary } = await (supabase as any)
      .from('judge_earnings')
      .select('payout_status, amount')
      .eq('judge_id', user.id);

    const summary =
      earningsSummary?.reduce((acc: Record<string, number>, earning: any) => {
        const amt = Number(earning.amount ?? 0);
        if (!acc[earning.payout_status]) {
          acc[earning.payout_status] = 0;
        }
        acc[earning.payout_status] += amt;
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
        // These amounts are in dollars
        available_for_payout: summary.pending || 0,
        pending: summary.pending || 0,
        paid: summary.paid || 0,
        total_earned: Object.values(summary).reduce(
          (sum: number, amount: unknown) => sum + (amount as number),
          0
        ),
      },
    });

  } catch (error) {
    log.error('Judge earnings error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to earnings endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);