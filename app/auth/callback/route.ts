import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const errorRedirect = (requestUrl: URL, message = 'auth') =>
  NextResponse.redirect(new URL(`/auth/login?error=${message}`, requestUrl.origin));

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return errorRedirect(requestUrl, 'missing_code');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth exchange error:', error);
    return errorRedirect(requestUrl, 'exchange_failed');
  }

  if (!data?.user) {
    return errorRedirect(requestUrl, 'no_user');
  }

  try {
    // Check if this is a new user by looking at their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', data.user.id)
      .single();
    
    // If it's a new user (no profile or onboarding not completed), redirect to welcome
    if (!profile || !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/welcome', requestUrl.origin));
    }

    // For existing users, check if there's a stored redirect in session storage
    // Since we can't access sessionStorage on server side, we'll redirect to dashboard
    // and let the client handle the stored redirect
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    
  } catch (error) {
    console.error('Profile check error:', error);
    // Continue anyway - user is authenticated
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }
}
