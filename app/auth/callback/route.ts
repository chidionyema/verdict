import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INITIAL_FREE_CREDITS = 3;

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

    // Ensure profile exists with initial credits
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('id', data.user.id)
      .single();

    if (!existingProfile) {
      // Create profile with 3 free credits for new users
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          credits: INITIAL_FREE_CREDITS,
          is_judge: false,
          is_admin: false,
          onboarding_completed: false,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway - profile can be created later
      } else {
        console.log(`New user ${data.user.id} created with ${INITIAL_FREE_CREDITS} free credits`);
      }
    }

    // Simple: redirect to where they wanted to go, or dashboard
    const safeRedirect = getSafeRedirect(redirectParam);
    const destination = safeRedirect || '/dashboard';

    return NextResponse.redirect(new URL(destination, requestUrl.origin));

  } catch (error) {
    console.error('Auth callback handler error:', error);
    // Fallback: user likely authenticated but something went wrong server-side
    return errorRedirect(requestUrl, 'server_error');
  }
}
