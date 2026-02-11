import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/auth/send-verification - Send email verification
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

    // Check if email is already verified via Supabase Auth
    if (user.email_confirmed_at) {
      return NextResponse.json({
        error: 'Email is already verified'
      }, { status: 400 });
    }

    // Use Supabase's built-in email verification resend
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (resendError) {
      log.error('Error sending verification email', resendError, { userId: user.id });

      // Handle specific errors
      if (resendError.message?.includes('rate limit')) {
        return NextResponse.json({
          error: 'Please wait before requesting another verification email'
        }, { status: 429 });
      }

      return NextResponse.json({
        error: 'Failed to send verification email. Please try again.'
      }, { status: 500 });
    }

    log.info('Verification email sent via Supabase Auth', { email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    log.error('POST /api/auth/send-verification error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply strict rate limiting to prevent email spam
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);