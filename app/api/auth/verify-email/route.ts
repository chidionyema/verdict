import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/verify-email - Verify email with token
export async function POST(request: NextRequest) {
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
    const { data: success, error: verifyError } = await supabase
      .rpc('verify_email', { token });

    if (verifyError) {
      console.error('Error verifying email:', verifyError);
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
      await supabase.rpc('create_notification', {
        target_user_id: user.id,
        notification_type: 'welcome',
        notification_title: 'Email verified! 🎉',
        notification_message: 'Your email has been verified. Welcome to Verdict! You have 3 free credits to start.',
        action_label: 'Get Your First Verdict',
        action_url: '/start',
        notification_priority: 'high'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!'
    });

  } catch (error) {
    console.error('POST /api/auth/verify-email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}