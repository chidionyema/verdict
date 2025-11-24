import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge, judge_tier, judge_rating, judge_total_verdicts')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge privileges required.' }, { status: 403 });
    }

    // Get judge tier information
    const { data: tierInfo } = await supabase
      .from('judge_tiers')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    // Get recent performance metrics (last 4 weeks)
    const { data: recentMetrics } = await supabase
      .from('judge_performance_metrics')
      .select('*')
      .eq('judge_id', user.id)
      .order('period_start', { ascending: false })
      .limit(4);

    // Get recent verdict quality ratings
    const { data: recentRatings } = await supabase
      .from('verdict_quality_ratings')
      .select(`
        *,
        verdict_response:verdict_responses(created_at, request_id),
        request:verdict_responses!verdict_response_id(
          request:verdict_requests!request_id(category, context)
        )
      `)
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate current period stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: currentWeekVerdicts } = await supabase
      .from('verdict_responses')
      .select('id, created_at, rating')
      .eq('judge_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    const { data: currentWeekRatings } = await supabase
      .from('verdict_quality_ratings')
      .select('overall_rating, helpfulness_rating, accuracy_rating, constructiveness_rating')
      .eq('judge_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    // Calculate summary stats
    const currentWeekStats = {
      verdicts_submitted: currentWeekVerdicts?.length || 0,
      average_user_rating: currentWeekRatings?.length 
        ? currentWeekRatings.reduce((sum, r) => sum + r.overall_rating, 0) / currentWeekRatings.length
        : 0,
      helpfulness_score: currentWeekRatings?.length
        ? currentWeekRatings.reduce((sum, r) => sum + r.helpfulness_rating, 0) / currentWeekRatings.length
        : 0,
    };

    // Get judge ranking
    const { data: rankingData } = await supabase
      .rpc('get_judge_leaderboard', { limit_count: 100 });

    const currentJudgeRank = rankingData?.findIndex(j => j.judge_id === user.id) + 1 || null;

    return NextResponse.json({
      profile: {
        judge_tier: profile.judge_tier,
        judge_rating: profile.judge_rating,
        total_verdicts: profile.judge_total_verdicts,
        rank: currentJudgeRank,
      },
      tier_info: tierInfo,
      current_week_stats: currentWeekStats,
      recent_metrics: recentMetrics || [],
      recent_ratings: recentRatings || [],
      leaderboard_position: currentJudgeRank,
    });

  } catch (error) {
    console.error('GET /api/judge/performance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}