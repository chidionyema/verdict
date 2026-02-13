'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const getRedirectUrl = () => {
  // For client-side, always use the current origin to handle preview deployments
  // This ensures OAuth redirects back to verdict-theta.vercel.app instead of askverdict.com
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  // Fallback to configured SITE_URL for server-side (shouldn't happen for OAuth)
  if (SITE_URL) {
    return `${SITE_URL}/auth/callback`;
  }
  throw new Error('APP_URL not configured - required for OAuth callback in production');
};

interface GoogleOAuthButtonProps {
  redirectTo?: string;
  mode?: 'signin' | 'signup';
  className?: string;
}

export default function GoogleOAuthButton({ 
  redirectTo, 
  mode = 'signin', 
  className = '' 
}: GoogleOAuthButtonProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const redirectUrl = getRedirectUrl();
      const callbackUrl = new URL(redirectUrl);
      
      if (redirectTo) {
        callbackUrl.searchParams.set('redirect', redirectTo);
      }
      
      // Store redirectTo in sessionStorage to retrieve after OAuth
      if (redirectTo && typeof window !== 'undefined') {
        sessionStorage.setItem('verdict_redirect_to', redirectTo);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const buttonText = isLoading 
    ? 'Redirecting to Google...' 
    : mode === 'signup' 
      ? 'Continue with Google' 
      : 'Sign in with Google';

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={`w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {!isLoading && (
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {buttonText}
      </button>
      
      {error && (
        <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-medium">Authentication failed</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">
            Make sure Google OAuth is properly configured in your Supabase project.
          </p>
        </div>
      )}
    </div>
  );
}