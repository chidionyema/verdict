import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile, getProfile } from '@/lib/profile';

/**
 * Auth Callback Handler
 *
 * Handles OAuth/magic-link callbacks from Supabase Auth.
 * Uses the profile service to ensure a profile exists for the user.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectParam = requestUrl.searchParams.get('redirect');

  // Helper to safely get redirect path - prevent open redirect attacks
  const getSafeRedirect = (path?: string | null): string => {
    if (!path) return '/dashboard';
    // Block protocol-relative URLs (//evil.com) and absolute URLs (https://evil.com)
    if (path.startsWith('//') || path.includes('://')) return '/dashboard';
    // Ensure starts with single slash (relative path only)
    if (!path.startsWith('/')) return '/dashboard';
    return path;
  };

  if (!code) {
    console.error('[Auth Callback] Missing code parameter');
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', requestUrl.origin));
  }

  try {
    const supabase = await createClient();

    // Step 1: Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] OAuth exchange failed:', error.message);
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', requestUrl.origin));
    }

    if (!data?.user) {
      console.error('[Auth Callback] No user in session data');
      return NextResponse.redirect(new URL('/auth/login?error=no_user', requestUrl.origin));
    }

    const user = data.user;
    console.log(`[Auth Callback] User authenticated: ${user.id}`);

    // Step 2: Check if profile exists before ensuring (for welcome detection)
    const existingResult = await getProfile(supabase, user.id);
    const isNewUser = existingResult.success && !existingResult.data;

    // Step 3: Ensure profile exists using profile service
    const profileResult = await ensureProfile(supabase, user);

    if (!profileResult.success) {
      console.error('[Auth Callback] Profile ensure failed:', profileResult.error);
      // Don't fail auth - continue but log the issue
    } else {
      console.log(`[Auth Callback] Profile ready: ${user.id} with ${profileResult.data.credits} credits`);
    }

    // Step 4: Redirect to destination
    const destination = getSafeRedirect(redirectParam);
    const redirectUrl = new URL(destination, requestUrl.origin);

    // Add welcome flag for new users
    if (isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true');
    }

    console.log(`[Auth Callback] Redirecting to: ${redirectUrl.pathname}`);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', requestUrl.origin));
  }
}
