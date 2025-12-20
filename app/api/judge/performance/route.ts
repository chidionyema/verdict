import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const url = new URL(request.url);
    const judgeId = url.searchParams.get('judgeId');
    const timeframe = url.searchParams.get('timeframe') || 'month';

    // Users can only view their own performance data
    if (!judgeId || judgeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get judge reputation data
    const { data: reputation } = await supabase
      .from('judge_reputation')
      .select('*')
      .eq('user_id', judgeId)
      .single();

    if (!reputation) {
      return NextResponse.json({
        judgeId,
        judgeName: 'New Judge',
        totalJudgments: 0,
        totalRatings: 0,
        averageRating: 0,
        currentStreak: 0,
        tier: 'Novice',
        qualityPercentage: 0,
        recentRatings: 0,
        recentAvgRating: 0,
        ratingDistribution: {
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStar: 0
        },
        recentFeedback: []
      });
    }

    // Get rating distribution
    const { data: ratings } = await supabase
      .from('judge_ratings')
      .select('rating, created_at')
      .eq('judge_id', judgeId);

    // Filter ratings by timeframe
    const now = new Date();
    const filteredRatings = ratings?.filter((rating: any) => {
      if (timeframe === 'all') return true;
      const ratingDate = new Date(rating.created_at);
      const cutoffDate = timeframe === 'week' ? 7 : 30;
      return ratingDate >= new Date(now.getTime() - cutoffDate * 24 * 60 * 60 * 1000);
    }) || [];

    // Calculate distribution
    const ratingDistribution = {
      fiveStars: filteredRatings.filter((r: any) => r.rating === 5).length,
      fourStars: filteredRatings.filter((r: any) => r.rating === 4).length,
      threeStars: filteredRatings.filter((r: any) => r.rating === 3).length,
      twoStars: filteredRatings.filter((r: any) => r.rating === 2).length,
      oneStar: filteredRatings.filter((r: any) => r.rating === 1).length
    };

    // Calculate recent metrics
    const recentRatings = filteredRatings.length;
    const recentAvgRating = recentRatings > 0 
      ? filteredRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / recentRatings 
      : 0;

    const qualityPercentage = recentRatings > 0 
      ? Math.round((filteredRatings.filter((r: any) => r.rating >= 4).length / recentRatings) * 100)
      : 0;

    // Get recent feedback with comments
    const { data: recentFeedback } = await supabase
      .from('judge_ratings')
      .select(`
        id,
        rating,
        comment,
        created_at
      `)
      .eq('judge_id', judgeId)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get judge name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', judgeId)
      .single();

    const performanceData = {
      judgeId,
      judgeName: (profile as any)?.display_name || 'Judge',
      totalJudgments: (reputation as any)?.total_judgments || 0,
      totalRatings: (reputation as any)?.total_ratings || 0,
      averageRating: parseFloat((reputation as any)?.average_rating || '0'),
      currentStreak: (reputation as any)?.current_streak || 0,
      tier: (reputation as any)?.tier || 'Novice',
      qualityPercentage,
      recentRatings,
      recentAvgRating: Math.round(recentAvgRating * 10) / 10,
      ratingDistribution,
      recentFeedback: (recentFeedback || []).map((feedback: any) => ({
        id: feedback.id,
        rating: feedback.rating,
        comment: feedback.comment,
        requestTitle: `Feedback Request`,
        timestamp: feedback.created_at
      }))
    };

    return NextResponse.json(performanceData);

  } catch (error) {
    console.error('Judge performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}