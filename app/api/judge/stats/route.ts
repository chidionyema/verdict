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

    // Get verdicts today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: verdictsToday } = await (supabase as any)
      .from('verdict_responses')
      .select('id', { count: 'exact', head: true })
      .eq('judge_id', user.id)
      .gte('created_at', todayStart.toISOString());

    // Get daily earnings (today)
    const { data: dailyEarningsData } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .gte('created_at', todayStart.toISOString());

    const dailyEarnings = dailyEarningsData?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

    // Get weekly earnings
    const { data: weeklyEarningsData } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString());

    const weeklyEarnings = weeklyEarningsData?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

    // Get monthly earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: monthlyEarningsData } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const monthlyEarnings = monthlyEarningsData?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

    // Get previous month earnings for trend calculation
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: prevMonthData } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const prevMonthEarnings = prevMonthData?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

    // Calculate earnings trend
    let earningsTrend: 'up' | 'down' | 'stable' = 'stable';
    if (monthlyEarnings > prevMonthEarnings * 1.1) {
      earningsTrend = 'up';
    } else if (monthlyEarnings < prevMonthEarnings * 0.9) {
      earningsTrend = 'down';
    }

    // Get category counts to find best category
    const { data: categoryData } = await (supabase as any)
      .from('verdict_responses')
      .select('request_id')
      .eq('judge_id', user.id);

    // Get request categories for verdicts
    let bestCategory = 'appearance';
    if (categoryData && categoryData.length > 0) {
      const requestIds = categoryData.map((v: any) => v.request_id).filter(Boolean);
      if (requestIds.length > 0) {
        const { data: requestsData } = await (supabase as any)
          .from('verdict_requests')
          .select('category')
          .in('id', requestIds);

        if (requestsData && requestsData.length > 0) {
          const categoryCounts: Record<string, number> = {};
          requestsData.forEach((r: any) => {
            const cat = r.category || 'other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          });
          // Find category with highest count
          let maxCount = 0;
          Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > maxCount) {
              maxCount = count;
              bestCategory = cat;
            }
          });
        }
      }
    }

    // Calculate average response time (minutes from request creation to verdict)
    const { data: responseTimeData } = await (supabase as any)
      .from('verdict_responses')
      .select('created_at, request_id')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Last 50 for perf

    let responseTimeAvg = 0;
    if (responseTimeData && responseTimeData.length > 0) {
      const requestIds = responseTimeData.map((v: any) => v.request_id).filter(Boolean);
      if (requestIds.length > 0) {
        const { data: requestsData } = await (supabase as any)
          .from('verdict_requests')
          .select('id, created_at')
          .in('id', requestIds);

        if (requestsData && requestsData.length > 0) {
          const requestMap = new Map<string, string>(requestsData.map((r: any) => [r.id, r.created_at]));
          let totalMinutes = 0;
          let count = 0;
          responseTimeData.forEach((v: any) => {
            const reqCreated = requestMap.get(v.request_id);
            if (reqCreated && typeof reqCreated === 'string') {
              const diff = new Date(v.created_at).getTime() - new Date(reqCreated).getTime();
              totalMinutes += diff / (1000 * 60);
              count++;
            }
          });
          if (count > 0) {
            responseTimeAvg = totalMinutes / count;
          }
        }
      }
    }

    // Calculate streak days (consecutive days with at least 1 verdict)
    let streakDays = 0;
    const { data: streakData } = await (supabase as any)
      .from('verdict_responses')
      .select('created_at')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (streakData && streakData.length > 0) {
      const uniqueDays = new Set<string>();
      streakData.forEach((v: any) => {
        const date = new Date(v.created_at);
        uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      });

      // Check for consecutive days ending today
      const today = new Date();
      let checkDate = new Date(today);
      let foundToday = false;

      for (let i = 0; i <= 30; i++) {
        const dayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (uniqueDays.has(dayKey)) {
          if (i === 0) foundToday = true;
          if (foundToday || i === 0) {
            streakDays++;
          } else {
            break;
          }
        } else if (foundToday || i > 0) {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate completion rate (verdicts with helpful flag / total)
    let completionRate = 0;
    if (verdictsCount && verdictsCount > 0) {
      const { count: helpfulCount } = await (supabase as any)
        .from('verdict_responses')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', user.id)
        .eq('was_helpful', true);

      if (helpfulCount) {
        completionRate = Math.round((helpfulCount / verdictsCount) * 100);
      }
    }

    // Calculate level progress
    const level = Math.floor((verdictsCount || 0) / 50);
    const nextLevelTarget = (level + 1) * 50;
    const currentProgress = (verdictsCount || 0) % 50;
    const nextLevelProgress = Math.round((currentProgress / 50) * 100);

    return NextResponse.json({
      verdicts_given: verdictsCount || 0,
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      available_for_payout: availableForPayout,
      paid_earnings: paidEarnings,
      average_quality_score: averageQuality,
      recent_verdicts: recentVerdicts || 0,
      // Additional stats for dashboard
      verdicts_today: verdictsToday || 0,
      daily_earnings: dailyEarnings,
      weekly_earnings: weeklyEarnings,
      monthly_earnings: monthlyEarnings,
      earnings_trend: earningsTrend,
      best_category: bestCategory,
      response_time_avg: responseTimeAvg,
      streak_days: streakDays,
      completion_rate: completionRate,
      next_level_progress: nextLevelProgress,
    }, { status: 200 });
  } catch (error) {
    log.error('GET /api/judge/stats error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to stats endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
