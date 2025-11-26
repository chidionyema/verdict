import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// GET /api/judge/stats - Get judge statistics
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

    // Get total earnings
    const { data: earningsData, error: earningsError } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id);

    if (earningsError) {
      log.error('Error fetching earnings', earningsError, { userId: user.id });
    }

    const totalEarnings =
      earningsData?.reduce(
        (sum: number, e: any) => sum + parseFloat(e.amount || '0'),
        0
      ) || 0;

    // Get available for payout (pending earnings)
    const { data: pendingEarnings, error: pendingError } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .eq('payout_status', 'pending');

    if (pendingError) {
      log.error('Error fetching pending earnings', pendingError, { userId: user.id });
    }

    const availableForPayout =
      pendingEarnings?.reduce(
        (sum: number, e: any) => sum + parseFloat(e.amount || '0'),
        0
      ) || 0;

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
      qualityData?.map((v: any) => parseFloat(v.quality_score || '0')).filter((s: number) => s > 0) ||
      [];
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
      available_for_payout: availableForPayout,
      average_quality_score: averageQuality,
      recent_verdicts: recentVerdicts || 0,
    }, { status: 200 });
  } catch (error) {
    log.error('GET /api/judge/stats error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

