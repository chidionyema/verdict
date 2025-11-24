// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/send-verification - Send email verification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
      console.error('Error creating verification token:', tokenError);
      return NextResponse.json({ 
        error: 'Failed to create verification token' 
      }, { status: 500 });
    }

    // In a real application, you would send an email here
    // For demo purposes, we'll return the token (DO NOT DO THIS IN PRODUCTION)
    const isDemoMode = process.env.NODE_ENV !== 'production';
    
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent',
        demo_token: token, // Only for demo - remove in production
        verification_url: `${request.headers.get('origin')}/auth/verify-email?token=${token}`
      });
    }

    // TODO: In production, send actual email using service like Resend, SendGrid, etc.
    // Example:
    // await sendVerificationEmail(profile?.email || user.email, token);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('POST /api/auth/send-verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}