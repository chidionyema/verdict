import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const userType = searchParams.get('user_type') || 'requester'; // requester, judge

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (userType === 'judge') {
      // Verify user is a judge
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_judge')
        .eq('id', user.id)
        .single();

      if (!profile?.is_judge) {
        return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
      }

      return getJudgeAnalytics(user.id, startDate, supabase);
    } else {
      return getRequesterAnalytics(user.id, startDate, supabase);
    }

  } catch (error) {
    log.error('Analytics overview error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getRequesterAnalytics(userId: string, startDate: Date, supabase: any) {
  try {
    // Get user requests in timeframe
    const { data: requests, count: totalRequests } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    // Get responses received
    const { data: responses } = await supabase
      .from('verdict_responses')
      .select(`
        *,
        verdict_requests!inner(user_id)
      `)
      .eq('verdict_requests.user_id', userId)
      .gte('created_at', startDate.toISOString());

    // Get spending data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['credit_purchase', 'verdict_request', 'subscription'])
      .gte('created_at', startDate.toISOString());

    // Calculate metrics
    const totalSpent =
      transactions
        ?.filter((t: any) =>
          ['credit_purchase', 'subscription'].includes(t.type)
        )
        .reduce((sum: number, t: any) => sum + (t.amount_cents || 0), 0) || 0;

    const creditsSpent =
      transactions
        ?.filter((t: any) => t.type === 'verdict_request')
        .reduce(
          (sum: number, t: any) =>
            sum + Math.abs(t.credits_delta || 0),
          0
        ) || 0;

    const averageRating =
      responses && responses.length > 0
        ? responses.reduce(
            (sum: number, r: any) => sum + (r.rating || 0),
            0
          ) / responses.length
        : 0;

    // Category breakdown
    const categoryBreakdown =
      requests?.reduce((acc: Record<string, number>, req: any) => {
        acc[req.category] = (acc[req.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    // Daily activity for chart
    const dailyActivity = await getDailyActivity(userId, startDate, supabase, 'requester');

    return NextResponse.json({
      overview: {
        total_requests: totalRequests || 0,
        responses_received: responses?.length || 0,
        average_rating: Math.round(averageRating * 10) / 10,
        total_spent_cents: totalSpent,
        credits_spent: creditsSpent,
        completion_rate: requests && requests.length > 0 
          ? Math.round(
              (requests.filter((r: any) => r.status === 'completed').length /
                requests.length) *
                100
            )
          : 0,
      },
      category_breakdown: categoryBreakdown,
      daily_activity: dailyActivity,
      recent_requests: requests?.slice(0, 5).map((r: any) => ({
        id: r.id,
        category: r.category,
        status: r.status,
        created_at: r.created_at,
        response_count:
          responses?.filter((res: any) => res.request_id === r.id).length ||
          0,
      })) || [],
    });

  } catch (error) {
    log.error('Requester analytics error', error);
    throw error;
  }
}

async function getJudgeAnalytics(judgeId: string, startDate: Date, supabase: any) {
  try {
    // Get responses given
    const { data: responses, count: totalResponses } = await supabase
      .from('verdict_responses')
      .select('*', { count: 'exact' })
      .eq('judge_id', judgeId)
      .gte('created_at', startDate.toISOString());

    // Get earnings
    const { data: earnings } = await supabase
      .from('judge_earnings')
      .select('*')
      .eq('judge_id', judgeId)
      .gte('created_at', startDate.toISOString());

    // Get rating data
    const averageRating =
      responses && responses.length > 0
        ? responses.reduce(
            (sum: number, r: any) => sum + (r.rating || 0),
            0
          ) / responses.length
        : 0;

    const totalEarnings =
      earnings?.reduce(
        (sum: number, e: any) => sum + e.net_amount_cents,
        0
      ) || 0;
    const availableEarnings =
      earnings
        ?.filter((e: any) => e.payout_status === 'available')
        .reduce((sum: number, e: any) => sum + e.net_amount_cents, 0) ||
      0;

    // Category breakdown
    const { data: categoryData } = await (supabase as any)
      .from('verdict_responses')
      .select(`
        verdict_requests!inner(category)
      `)
      .eq('judge_id', judgeId)
      .gte('created_at', startDate.toISOString());

    const categoryBreakdown =
      categoryData?.reduce((acc: Record<string, number>, item: any) => {
        const category = item.verdict_requests.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    // Daily activity
    const dailyActivity = await getDailyActivity(judgeId, startDate, supabase, 'judge');

    // Performance metrics
    const responseTime = await getAverageResponseTime(judgeId, startDate, supabase);

    return NextResponse.json({
      overview: {
        total_responses: totalResponses || 0,
        average_rating: Math.round(averageRating * 10) / 10,
        total_earnings_cents: totalEarnings,
        available_earnings_cents: availableEarnings,
        average_response_time_hours: responseTime,
        response_rate: 100, // Could calculate based on assignments vs completions
      },
      category_breakdown: categoryBreakdown,
      daily_activity: dailyActivity,
      recent_responses: responses?.slice(0, 5).map((r: any) => ({
        id: r.id,
        request_id: r.request_id,
        rating: r.rating,
        created_at: r.created_at,
        helpfulness: r.helpfulness,
      })) || [],
      earnings_breakdown: {
        total: totalEarnings,
        available: availableEarnings,
        pending:
          earnings
            ?.filter((e: any) => e.payout_status === 'pending')
            .reduce(
              (sum: number, e: any) => sum + e.net_amount_cents,
              0
            ) || 0,
        paid:
          earnings
            ?.filter((e: any) => e.payout_status === 'paid')
            .reduce(
              (sum: number, e: any) => sum + e.net_amount_cents,
              0
            ) || 0,
      },
    });

  } catch (error) {
    log.error('Judge analytics error', error);
    throw error;
  }
}

async function getDailyActivity(userId: string, startDate: Date, supabase: any, userType: 'requester' | 'judge') {
  const days = [];
  const now = new Date();
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // BULLETPROOF: Use single aggregated query instead of N+1 pattern (was creating 365 queries!)
  let aggregatedData;
  
  if (userType === 'requester') {
    const { data } = await supabase
      .from('verdict_requests')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());
      
    aggregatedData = data || [];
  } else {
    const { data } = await supabase
      .from('verdict_responses')
      .select('created_at')
      .eq('judge_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());
      
    aggregatedData = data || [];
  }
  
  // Count by day in JavaScript (single query + aggregation)
  const dateCountMap = new Map<string, number>();
  
  // Initialize all days with 0
  for (const day of days) {
    const dateStr = day.toISOString().split('T')[0];
    dateCountMap.set(dateStr, 0);
  }
  
  // Count actual data
  for (const item of aggregatedData) {
    const dateStr = (item as any).created_at.split('T')[0];
    const currentCount = dateCountMap.get(dateStr) || 0;
    dateCountMap.set(dateStr, currentCount + 1);
  }
  
  // Convert to desired format
  const dailyData = days.map(day => ({
    date: day.toISOString().split('T')[0],
    count: dateCountMap.get(day.toISOString().split('T')[0]) || 0
  }));

  return dailyData;
}

async function getAverageResponseTime(judgeId: string, startDate: Date, supabase: any) {
  const { data: responses } = await supabase
    .from('verdict_responses')
    .select(`
      created_at,
      verdict_requests!inner(created_at)
    `)
    .eq('judge_id', judgeId)
    .gte('created_at', startDate.toISOString());

  if (!responses || responses.length === 0) return 0;

  const totalTime = responses.reduce((sum: number, response: any) => {
    const requestTime = new Date(response.verdict_requests.created_at);
    const responseTime = new Date(response.created_at);
    const diffHours = (responseTime.getTime() - requestTime.getTime()) / (1000 * 60 * 60);
    return sum + diffHours;
  }, 0);

  return Math.round((totalTime / responses.length) * 10) / 10;
}