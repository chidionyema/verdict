import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/auth/verify-email - Handle email verification callback
// Note: Supabase Auth handles the actual verification via the link in the email.
// This endpoint is called after redirect to create welcome notification.
async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if email is verified via Supabase Auth
    if (!user.email_confirmed_at) {
      return NextResponse.json({
        error: 'Email is not yet verified'
      }, { status: 400 });
    }

    // Try to create welcome notification (non-blocking)
    try {
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'welcome',
          title: 'Email verified! 🎉',
          message: 'Your email has been verified. Welcome to Verdict!',
          metadata: {
            action_label: 'Create Your First Request',
            action_url: '/submit',
            priority: 'high'
          }
        });
    } catch (notifError) {
      // Non-critical - log but don't fail the request
      log.warn('Failed to create welcome notification', { error: notifError, userId: user.id });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!'
    });

  } catch (error) {
    log.error('Email verification endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply strict rate limiting to auth endpoints
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
