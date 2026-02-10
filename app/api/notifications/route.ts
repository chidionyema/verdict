import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// Get default action label based on notification type
function getDefaultActionLabel(type: string): string | null {
  const labels: Record<string, string> = {
    verdict_received: 'View Verdict',
    new_verdict: 'View Verdict',
    request_completed: 'View Results',
    new_judge_request: 'Start Judging',
    credit_purchase: 'View Balance',
    earning_credited: 'View Earnings',
    judge_qualified: 'Start Judging',
  };
  return labels[type] || null;
}

// GET /api/notifications - Get user's notifications
async function GET_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10);
    const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate and bound limit (1-100, default 20 if invalid)
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
    // Validate offset (must be non-negative, default 0 if invalid)
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    const unread_only = url.searchParams.get('unread_only') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only) {
      query = query.eq('read', false); // Database uses 'read', not 'is_read'
    }

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      log.error('Error fetching notifications', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    // @ts-ignore - RPC function types not generated
    const { data: unreadCountData } = await supabase
      .rpc('get_unread_notification_count', { target_user_id: user.id }) as { data: number | null };

    // Transform notifications to client format (map 'read' to 'is_read' and extract metadata fields)
    const transformedNotifications = (notifications || []).map((n: any) => ({
      id: n.id,
      created_at: n.created_at,
      type: n.type,
      title: n.title,
      message: n.message,
      is_read: n.read, // Map database 'read' to client 'is_read'
      priority: n.metadata?.priority || 'normal',
      action_label: n.metadata?.action_label || getDefaultActionLabel(n.type),
      action_url: n.metadata?.action_url || null,
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      unread_count: unreadCountData || 0,
      has_more: notifications?.length === limit
    });

  } catch (error) {
    log.error('GET /api/notifications error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark all notifications as read
async function PATCH_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore - RPC function types not generated
    const { data: updatedCount, error: markError } = await supabase
      .rpc('mark_all_notifications_read', { target_user_id: user.id }) as { data: number | null; error: any };

    if (markError) {
      log.error('Error marking notifications as read', markError);
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      marked_count: updatedCount || 0
    });

  } catch (error) {
    log.error('PATCH /api/notifications error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to notifications endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);