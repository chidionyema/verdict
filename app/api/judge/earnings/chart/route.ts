import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

interface DailyEarning {
  date: string;
  amount: number;
  count: number;
}

interface ChartSummary {
  total: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  bestDay: { date: string; amount: number } | null;
  totalVerdicts: number;
}

function getDateRange(timeframe: string): { startDate: Date; days: number } {
  const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, days };
}

function aggregateByDay(
  earnings: Array<{ amount: number; created_at: string }>,
  startDate: Date,
  days: number
): DailyEarning[] {
  // Create a map of all days in the range with zero values
  const dailyMap = new Map<string, { amount: number; count: number }>();

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyMap.set(dateKey, { amount: 0, count: 0 });
  }

  // Aggregate earnings into daily buckets
  for (const earning of earnings) {
    const dateKey = new Date(earning.created_at).toISOString().split('T')[0];
    if (dailyMap.has(dateKey)) {
      const current = dailyMap.get(dateKey)!;
      current.amount += Number(earning.amount) || 0;
      current.count += 1;
    }
  }

  // Convert to array sorted by date
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      amount: Math.round(data.amount * 100) / 100, // Round to 2 decimal places
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateSummary(
  data: DailyEarning[],
  previousPeriodTotal: number
): ChartSummary {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const totalVerdicts = data.reduce((sum, d) => sum + d.count, 0);
  const daysWithEarnings = data.filter(d => d.amount > 0).length;
  const average = daysWithEarnings > 0 ? total / daysWithEarnings : 0;

  // Find best day
  let bestDay: { date: string; amount: number } | null = null;
  for (const day of data) {
    if (day.amount > 0 && (!bestDay || day.amount > bestDay.amount)) {
      bestDay = { date: day.date, amount: day.amount };
    }
  }

  // Calculate trend compared to previous period
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercent = 0;

  if (previousPeriodTotal > 0) {
    const change = ((total - previousPeriodTotal) / previousPeriodTotal) * 100;
    trendPercent = Math.round(change);
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';
  } else if (total > 0) {
    trend = 'up';
    trendPercent = 100;
  }

  return {
    total: Math.round(total * 100) / 100,
    average: Math.round(average * 100) / 100,
    trend,
    trendPercent,
    bestDay,
    totalVerdicts,
  };
}

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    // Validate timeframe
    if (!['7d', '30d', '90d'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Use 7d, 30d, or 90d' },
        { status: 400 }
      );
    }

    const { startDate, days } = getDateRange(timeframe);

    // Fetch earnings for the current period
    const { data: earnings, error: earningsError } = await (supabase as any)
      .from('judge_earnings')
      .select('amount, created_at')
      .eq('judge_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (earningsError) {
      log.error('Error fetching earnings for chart', earningsError);
      return NextResponse.json(
        { error: 'Failed to fetch earnings data' },
        { status: 500 }
      );
    }

    // Fetch previous period earnings for trend calculation
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const { data: previousEarnings } = await (supabase as any)
      .from('judge_earnings')
      .select('amount')
      .eq('judge_id', user.id)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousPeriodTotal = (previousEarnings || []).reduce(
      (sum: number, e: { amount: number }) => sum + (Number(e.amount) || 0),
      0
    );

    // Aggregate data by day
    const chartData = aggregateByDay(earnings || [], startDate, days);

    // Calculate summary statistics
    const summary = calculateSummary(chartData, previousPeriodTotal);

    return NextResponse.json({
      data: chartData,
      summary,
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    log.error('Judge earnings chart error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
