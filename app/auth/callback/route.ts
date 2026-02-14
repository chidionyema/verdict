import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth Callback Handler
 *
 * Handles OAuth/magic-link callbacks from Supabase Auth.
 *
 * Profile creation is handled by database trigger `on_auth_user_created`.
 * This callback just exchanges the code for a session and redirects.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectParam = requestUrl.searchParams.get('redirect');

  const getSafeRedirect = (path?: string | null): string => {
    if (!path) return '/dashboard';
    if (path.startsWith('//') || path.includes('://')) return '/dashboard';
    if (!path.startsWith('/')) return '/dashboard';
    return path;
  };

  if (!code) {
    console.error('[Auth Callback] Missing code parameter');
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] OAuth exchange failed:', error.message);
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', requestUrl.origin));
    }

    if (!data?.user) {
      console.error('[Auth Callback] No user in session data');
      return NextResponse.redirect(new URL('/auth/login?error=no_user', requestUrl.origin));
    }

    console.log(`[Auth Callback] User authenticated: ${data.user.id}`);

    // Profile is created by database trigger - just redirect
    const destination = getSafeRedirect(redirectParam);
    return NextResponse.redirect(new URL(destination, requestUrl.origin));

  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', requestUrl.origin));
  }
}
