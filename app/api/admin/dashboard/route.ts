// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/dashboard - Get admin dashboard statistics
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null; error: any };

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    // Calculate date ranges
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeTodayUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', todayStart.toISOString());

    const { count: newThisWeekUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get request statistics
    const { count: totalRequests } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingRequests } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);

    const { count: completedRequests } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: todayRequests } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Get response statistics
    const { count: totalResponses } = await supabase
      .from('verdict_responses')
      .select('*', { count: 'exact', head: true });

    const { count: todayResponses } = await supabase
      .from('verdict_responses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Get average rating
    const { data: ratingData } = await supabase
      .from('verdict_responses')
      .select('rating')
      .not('rating', 'is', null) as { data: Array<{ rating: number }> | null };

    const averageRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingData.length
      : 0;

    // Get moderation statistics
    const { count: pendingReports } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: flaggedContent } = await supabase
      .from('content_flags')
      .select('*', { count: 'exact', head: true })
      .eq('reviewed', false);

    const { count: suspendedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', true);

    // Get revenue statistics (sum of completed transactions)
    const { data: revenueData } = await supabase
      .from('transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .eq('type', 'purchase') as { data: Array<{ amount_cents: number | null }> | null };

    const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount_cents || 0), 0) || 0;

    const { data: monthlyRevenueData } = await supabase
      .from('transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .eq('type', 'purchase')
      .gte('created_at', monthStart.toISOString()) as { data: Array<{ amount_cents: number | null }> | null };

    const monthlyRevenue = monthlyRevenueData?.reduce((sum, t) => sum + (t.amount_cents || 0), 0) || 0;

    const { count: todayTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('type', 'purchase')
      .gte('created_at', todayStart.toISOString());

    // Compile statistics
    const stats = {
      users: {
        total: totalUsers || 0,
        active_today: activeTodayUsers || 0,
        new_this_week: newThisWeekUsers || 0,
      },
      requests: {
        total: totalRequests || 0,
        pending: pendingRequests || 0,
        completed: completedRequests || 0,
        today: todayRequests || 0,
      },
      responses: {
        total: totalResponses || 0,
        today: todayResponses || 0,
        average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      },
      moderation: {
        pending_reports: pendingReports || 0,
        flagged_content: flaggedContent || 0,
        suspended_users: suspendedUsers || 0,
      },
      revenue: {
        total: totalRevenue,
        this_month: monthlyRevenue,
        transactions_today: todayTransactions || 0,
      },
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}