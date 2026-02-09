import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/judge/stats - Get judge statistics
async function GET_Handler(request: NextRequest) {
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
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json(
        { error: 'Must be a judge to view stats' },
        { status: 403 }
      );
    }

    // Get total verdicts given
    const { count: verdictsCount, error: verdictsError } = await (supabase as any)
      .from('verdict_responses')
      .select('id', { count: 'exact', head: true })
      .eq('judge_id', user.id);

    if (verdictsError) {
      log.error('Error counting verdicts', verdictsError, { userId: user.id });
    }

    // Get earnings summary using RPC for consistent values across all pages
    // This ensures we use the same calculation (including 7-day maturation) everywhere
    const { data: earningsSummary, error: earningsError } = await (supabase.rpc as any)(
      'get_judge_earnings_summary',
      { target_judge_id: user.id }
    );

    if (earningsError) {
      log.error('Error fetching earnings summary', earningsError, { userId: user.id });
    }

    // RPC returns amounts in cents, convert to dollars
    const summaryData = earningsSummary?.[0] || {
      total_earned_cents: 0,
      pending_cents: 0,
      available_for_payout_cents: 0,
      paid_cents: 0,
    };

    const totalEarnings = (summaryData.total_earned_cents || 0) / 100;
    const pendingEarnings = (summaryData.pending_cents || 0) / 100;
    const availableForPayout = (summaryData.available_for_payout_cents || 0) / 100;
    const paidEarnings = (summaryData.paid_cents || 0) / 100;

    // Get average quality score
    const { data: qualityData, error: qualityError } = await (supabase as any)
      .from('verdict_responses')
      .select('quality_score')
      .eq('judge_id', user.id)
      .not('quality_score', 'is', null);

    if (qualityError) {
      log.error('Error fetching quality scores', qualityError, { userId: user.id });
    }

    const qualityScores =
      qualityData?.map((v: any) => {
        const score = parseFloat(v.quality_score || '0');
        return Number.isNaN(score) ? 0 : score;
      }).filter((s: number) => s > 0) || [];
    const averageQuality =
      qualityScores.length > 0
        ? qualityScores.reduce(
            (sum: number, score: number) => sum + score,
            0
          ) / qualityScores.length
        : null;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentVerdicts, error: recentError } = await (supabase as any)
      .from('verdict_responses')
      .select('id', { count: 'exact', head: true })
      .eq('judge_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      log.error('Error counting recent verdicts', recentError, { userId: user.id });
    }

    return NextResponse.json({
      verdicts_given: verdictsCount || 0,
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      available_for_payout: availableForPayout,
      paid_earnings: paidEarnings,
      average_quality_score: averageQuality,
      recent_verdicts: recentVerdicts || 0,
    }, { status: 200 });
  } catch (error) {
    log.error('GET /api/judge/stats error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to stats endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
