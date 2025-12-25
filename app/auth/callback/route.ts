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
