'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailVerificationGuardProps {
  children: ReactNode;
  redirectTo?: string;
  featureName?: string;
}

interface VerificationState {
  loading: boolean;
  isVerified: boolean;
  email: string | null;
  userId: string | null;
}

export function EmailVerificationGuard({
  children,
  redirectTo,
  featureName = 'this feature',
}: EmailVerificationGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<VerificationState>({
    loading: true,
    isVerified: false,
    email: null,
    userId: null,
  });
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (redirectTo) {
          router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
        }
        setState({ loading: false, isVerified: false, email: null, userId: null });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single();

      setState({
        loading: false,
        isVerified: Boolean((profile as any)?.email_verified),
        email: user.email || null,
        userId: user.id,
      });
    } catch (err) {
      console.error('Error checking verification:', err);
      setState({ loading: false, isVerified: false, email: null, userId: null });
    }
  };

  const sendVerificationEmail = async () => {
    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send verification email');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Show loading state
  if (state.loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // User not logged in
  if (!state.userId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access {featureName}.
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Email not verified - show verification required screen
  if (!state.isVerified) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-2">
            To access {featureName}, please verify your email address.
          </p>

          {state.email && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              We&apos;ll send a verification link to: <strong>{state.email}</strong>
            </p>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verification Email Sent!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Check your inbox and click the verification link. Then refresh this page.
              </p>
            </div>
          ) : (
            <Button
              onClick={sendVerificationEmail}
              disabled={isSending}
              className="mb-4"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 w-4 h-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => checkVerification()}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              I&apos;ve verified, refresh
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:underline"
            >
              Go back home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email verified - render children
  return <>{children}</>;
}

export default EmailVerificationGuard;
