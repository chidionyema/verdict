import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/auth/verify-email - Verify email with token
async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        error: 'Verification token is required'
      }, { status: 400 });
    }

    // Verify the email
    const { data: success, error: verifyError } = await (supabase.rpc as any)('verify_email', { token });

    if (verifyError) {
      log.error('Email verification failed', verifyError);
      return NextResponse.json({
        error: 'Failed to verify email'
      }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json({
        error: 'Invalid or expired verification token'
      }, { status: 400 });
    }

    // Get updated user info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Create welcome notification
      await (supabase.rpc as any)('create_notification', {
        target_user_id: user.id,
        notification_type: 'welcome',
        notification_title: 'Email verified! 🎉',
        notification_message: 'Your email has been verified. Welcome to Verdict! You now have 3 free requests (3 verdicts each) to start.',
        action_label: 'Create Your First Request',
        action_url: '/submit',
        notification_priority: 'high'
      });
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