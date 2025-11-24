// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/reset-password - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Get request info for logging
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Create password reset (always returns success for security)
    const { data: token } = await supabase
      .rpc('create_password_reset', {
        target_email: email,
        user_ip: clientIp,
        user_user_agent: userAgent
      });

    // In demo mode, return the token for testing
    const isDemoMode = process.env.NODE_ENV !== 'production';
    
    if (isDemoMode && token && token !== 'token_sent') {
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
        demo_token: token, // Only for demo - remove in production
        reset_url: `${request.headers.get('origin')}/auth/reset-password?token=${token}`
      });
    }

    // TODO: In production, send actual password reset email
    // Example:
    // if (token && token !== 'token_sent') {
    //   await sendPasswordResetEmail(email, token);
    // }

    // Always return success message for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/auth/reset-password - Reset password with token
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Token and new password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    // Find valid reset token
    const { data: resetRecord, error: resetError } = await supabase
      .from('password_resets')
      .select('user_id, email, expires_at')
      .eq('reset_token', token)
      .eq('used', false)
      .single();

    if (resetError || !resetRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Reset token has expired' 
      }, { status: 400 });
    }

    // Update password using Supabase Auth Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update password' 
      }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from('password_resets')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('reset_token', token);

    // Clear reset token from profile
    await supabase
      .from('profiles')
      .update({
        password_reset_token: null,
        password_reset_sent_at: null,
        password_reset_expires_at: null
      })
      .eq('id', resetRecord.user_id);

    // Create notification
    await supabase.rpc('create_notification', {
      target_user_id: resetRecord.user_id,
      notification_type: 'password_changed',
      notification_title: 'Password changed',
      notification_message: 'Your password has been successfully updated.',
      notification_priority: 'normal'
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('PATCH /api/auth/reset-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}