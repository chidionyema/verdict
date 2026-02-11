import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INITIAL_FREE_CREDITS = 3;

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

    // Step 2: Check if profile exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = "No rows found" - that's expected for new users
      console.error('[Auth Callback] Profile check failed:', selectError.message);
    }

    // Step 3: Create profile if it doesn't exist
    if (!existingProfile) {
      console.log(`[Auth Callback] Creating profile for new user: ${user.id}`);

      const profileData = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        credits: INITIAL_FREE_CREDITS,
        is_judge: true, // Everyone can review by default
        is_admin: false,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use upsert to handle race conditions
      const { error: insertError } = await (supabase as any)
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (insertError) {
        console.error('[Auth Callback] Profile creation failed:', insertError.message, insertError.code, insertError.details);
        // Still redirect but with a warning flag so the app can show appropriate messaging
        const destination = getSafeRedirect(redirectParam);
        const redirectUrl = new URL(destination, requestUrl.origin);
        redirectUrl.searchParams.set('profile_setup', 'pending');
        console.log(`[Auth Callback] Redirecting with pending profile: ${redirectUrl.pathname}`);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log(`[Auth Callback] Profile created successfully for ${user.id} with ${INITIAL_FREE_CREDITS} credits`);
      }
    } else {
      console.log(`[Auth Callback] Existing profile found: ${(existingProfile as any).id} with ${(existingProfile as any).credits} credits`);
    }

    // Step 4: Redirect to destination with success indicator for new users
    const destination = getSafeRedirect(redirectParam);
    const redirectUrl = new URL(destination, requestUrl.origin);
    if (!existingProfile) {
      redirectUrl.searchParams.set('welcome', 'true');
    }
    console.log(`[Auth Callback] Redirecting to: ${redirectUrl.pathname}`);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', requestUrl.origin));
  }
}
