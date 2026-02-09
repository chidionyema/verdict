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

    // Get earnings summary using RPC for consistent values across all pages
    // This ensures we use the same calculation (including 7-day maturation) everywhere
    const { data: earningsSummaryData, error: summaryError } = await (supabase.rpc as any)(
      'get_judge_earnings_summary',
      { target_judge_id: user.id }
    );

    if (summaryError) {
      log.error('Error fetching earnings summary', summaryError, { userId: user.id });
    }

    // RPC returns amounts in cents, convert to dollars
    const summaryRow = earningsSummaryData?.[0] || {
      total_earned_cents: 0,
      pending_cents: 0,
      available_for_payout_cents: 0,
      paid_cents: 0,
      earnings_count: 0,
    };

    return NextResponse.json({
      earnings,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      summary: {
        // These amounts are in dollars (converted from cents)
        total_earned: (summaryRow.total_earned_cents || 0) / 100,
        pending: (summaryRow.pending_cents || 0) / 100,
        available_for_payout: (summaryRow.available_for_payout_cents || 0) / 100,
        paid: (summaryRow.paid_cents || 0) / 100,
        earnings_count: summaryRow.earnings_count || 0,
      },
    });

  } catch (error) {
    log.error('Judge earnings error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to earnings endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);