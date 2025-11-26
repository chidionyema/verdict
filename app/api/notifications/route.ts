import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
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
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unread_only = url.searchParams.get('unread_only') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only) {
      query = query.eq('is_read', false);
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

    return NextResponse.json({ 
      notifications: notifications || [],
      unread_count: unreadCountData || 0,
      has_more: notifications?.length === limit
    });

  } catch (error) {
    log.error('GET /api/notifications error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(request: NextRequest) {
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