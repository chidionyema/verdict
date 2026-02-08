import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// PATCH /api/notifications/[id] - Mark specific notification as read
async function PATCH_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid notification ID format' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: success, error: markError } = await supabase
      .rpc('mark_notification_read', { notification_id: id } as any) as any;

    if (markError) {
      log.error('Failed to mark notification as read', markError, { notificationId: id });
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Notification not found or already read' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    log.error('Notification PATCH endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete specific notification
async function DELETE_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid notification ID format' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Security check

    if (deleteError) {
      log.error('Failed to delete notification', deleteError, { notificationId: id });
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    log.error('Notification DELETE endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to notification endpoints
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);
export const DELETE = withRateLimit(DELETE_Handler, rateLimitPresets.default);