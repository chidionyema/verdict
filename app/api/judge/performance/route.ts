import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { judgeQuality } from '@/lib/judge-quality';
import { log } from '@/lib/logger';

// GET /api/judge/performance - Get judge performance metrics
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
      return NextResponse.json({ error: 'Access denied. Judge privileges required.' }, { status: 403 });
    }

    // Get or create judge performance record
    let { data: performance, error: perfError } = await (supabase as any)
      .from('judge_performance')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (perfError && perfError.code === 'PGRST116') {
      // Create initial performance record
      const { data: newPerf, error: createError } = await (supabase as any)
        .from('judge_performance')
        .insert({
          judge_id: user.id,
          total_verdicts: 0,
          average_rating: 0,
          average_response_time: 0,
          quality_score: 100,
          report_count: 0,
          status: 'active',
          tier: 'new'
        })
        .select()
        .single();

      if (createError) {
        log.error('Error creating performance record', createError);
        return NextResponse.json({ error: 'Failed to initialize performance' }, { status: 500 });
      }
      
      performance = newPerf;
    } else if (perfError) {
      log.error('Error fetching judge performance', perfError);
      return NextResponse.json({ error: 'Failed to fetch performance' }, { status: 500 });
    }

    // Get recent verdict ratings
    const { data: recentRatings, error: ratingsError } = await (supabase as any)
      .from('verdict_ratings')
      .select(`
        rating,
        feedback,
        helpful,
        created_at
      `)
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ratingsError) {
      log.error('Error fetching ratings', ratingsError);
    }

    // Calculate current week stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: currentWeekVerdicts } = await (supabase as any)
      .from('verdict_responses')
      .select('id, created_at')
      .eq('judge_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    const { data: currentWeekRatings } = await (supabase as any)
      .from('verdict_ratings')
      .select('rating, helpful')
      .eq('judge_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    // Calculate insights and recommendations
    const insights = judgeQuality.generateInsights(performance);
    const earningsMultiplier = judgeQuality.getEarningsMultiplier(performance.tier);
    const assignmentPriority = judgeQuality.getAssignmentPriority(performance);
    const actionNeeded = judgeQuality.shouldTakeAction(performance);

    // Calculate current week stats
    const currentWeekStats = {
      verdicts_submitted: currentWeekVerdicts?.length || 0,
      average_rating: currentWeekRatings?.length 
        ? currentWeekRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / currentWeekRatings.length
        : 0,
      helpful_verdicts: currentWeekRatings?.filter((r: any) => r.helpful).length || 0
    };

    // Get judge ranking (simplified - count judges with higher quality scores)
    const { count: higherRankedJudges } = await (supabase as any)
      .from('judge_performance')
      .select('id', { count: 'exact', head: true })
      .gt('quality_score', performance.quality_score)
      .eq('status', 'active');

    const currentJudgeRank = (higherRankedJudges || 0) + 1;

    return NextResponse.json({
      performance,
      insights,
      earningsMultiplier,
      assignmentPriority,
      actionNeeded,
      currentWeekStats,
      recentRatings: recentRatings || [],
      rank: currentJudgeRank,
      tier: performance.tier,
      status: performance.status,
      nextTierRequirements: getNextTierRequirements(performance.tier, performance)
    });

  } catch (error) {
    log.error('GET /api/judge/performance error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNextTierRequirements(currentTier: string, performance: any) {
  switch (currentTier) {
    case 'new':
      return {
        tier: 'bronze',
        requirements: [
          `Submit ${Math.max(0, 10 - performance.total_verdicts)} more verdicts`,
          `Maintain quality score above 55 (current: ${performance.quality_score})`
        ]
      };
    case 'bronze':
      return {
        tier: 'silver',
        requirements: [
          `Submit ${Math.max(0, 50 - performance.total_verdicts)} more verdicts`,
          `Achieve quality score of 65+ (current: ${performance.quality_score})`
        ]
      };
    case 'silver':
      return {
        tier: 'gold',
        requirements: [
          `Submit ${Math.max(0, 100 - performance.total_verdicts)} more verdicts`,
          `Achieve quality score of 75+ (current: ${performance.quality_score})`
        ]
      };
    case 'gold':
      return {
        tier: 'expert',
        requirements: [
          `Submit ${Math.max(0, 200 - performance.total_verdicts)} more verdicts`,
          `Achieve quality score of 85+ (current: ${performance.quality_score})`
        ]
      };
    case 'expert':
      return {
        tier: 'expert',
        requirements: ['You have reached the highest tier! 🏆']
      };
    default:
      return { tier: 'bronze', requirements: ['Complete 10 verdicts to advance'] };
  }
}