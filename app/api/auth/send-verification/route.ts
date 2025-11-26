import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationEmail } from '@/lib/email';
import { log } from '@/lib/logger';

// POST /api/auth/send-verification - Send email verification
export async function POST(request: NextRequest) {
  try {
    const supabase: any = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if email is already verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_verified, email')
      .eq('id', user.id)
      .single();

    if (profile?.email_verified) {
      return NextResponse.json({
        error: 'Email is already verified'
      }, { status: 400 });
    }

    // Create verification token
    const { data: token, error: tokenError } = await supabase
      .rpc('create_email_verification', {
        target_user_id: user.id,
        target_email: profile?.email || user.email
      });

    if (tokenError) {
      log.error('Error creating verification token', tokenError, { userId: user.id });
      return NextResponse.json({
        error: 'Failed to create verification token'
      }, { status: 500 });
    }

    // Send verification email
    const targetEmail = profile?.email || user.email;
    if (token && targetEmail) {
      const emailResult = await sendVerificationEmail(targetEmail, token);

      if (!emailResult.success) {
        log.error('Failed to send verification email', new Error(emailResult.error), { email: targetEmail });
      } else {
        log.info('Verification email sent', { email: targetEmail, emailId: emailResult.id });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    log.error('POST /api/auth/send-verification error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}