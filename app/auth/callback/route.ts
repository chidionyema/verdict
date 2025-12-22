import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const errorRedirect = (requestUrl: URL, message = 'auth') =>
  NextResponse.redirect(new URL(`/auth/login?error=${message}`, requestUrl.origin));

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectParam = requestUrl.searchParams.get('redirect');

  if (!code) {
    return errorRedirect(requestUrl, 'missing_code');
  }

  const getSafeRedirect = (path?: string | null) => {
    if (!path) return null;
    if (!path.startsWith('/')) return null;
    return path;
  };

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth exchange error:', error);
      return errorRedirect(requestUrl, 'exchange_failed');
    }

    if (!data?.user) {
      return errorRedirect(requestUrl, 'no_user');
    }

    const safeRedirect = getSafeRedirect(redirectParam);

    // Check if this is a new user by looking at their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', data.user.id)
      .single();
    
    // If caller provided an explicit redirect (e.g. judge qualification), honor it
    if (safeRedirect) {
      return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
    }

    // If it's a new user (no profile or onboarding not completed), redirect to create
    if (!profile || !(profile as any).onboarding_completed) {
      return NextResponse.redirect(new URL('/create?welcome=true', requestUrl.origin));
    }

    // For existing users, check if there's a stored redirect in session storage
    // Since we can't access sessionStorage on server side, we'll redirect to dashboard
    // and let the client handle the stored redirect
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    
  } catch (error) {
    console.error('Auth callback handler error:', error);
    // Fallback: user likely authenticated but something went wrong server-side
    return errorRedirect(requestUrl, 'server_error');
  }
}
