'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { ReferralSignupFlow } from '@/components/referrals/ReferralSignupFlow';
import { toast } from '@/components/ui/toast';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/welcome';
  const referralCode = searchParams.get('ref') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If user is immediately available (no email confirmation required), redirect them
    if (data.user && !data.user.email_confirmed_at) {
      // Show success message but allow them to continue
      setSuccess(true);
    } else if (data.user) {
      // User is ready, redirect immediately
      router.push(redirect);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  // Removed handleGoogleSignup - now using GoogleOAuthButton component

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setError(''); // Clear any previous error
      toast.success('Verification email resent! Check your inbox.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-6">
              You can start using the platform now. We also sent a confirmation link to <strong>{email}</strong> to secure your account.
            </p>

            {/* What to do section */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">You can now:</p>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>✅ Start submitting for feedback</li>
                <li>✅ Judge others to earn credits</li>
                <li>📧 Verify email later for full security</li>
              </ol>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                href={redirect}
                className="block w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-center"
              >
                Continue to Platform
              </Link>

              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer"
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </button>

              <button
                onClick={() => setSuccess(false)}
                className="w-full py-3 bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition cursor-pointer"
              >
                Use different email
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 mt-6">
              Didn't receive the email? Check your spam folder or try a different email address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600 mb-6">
            Get 3 free credits when you sign up (each gets you 3 feedback reports)
          </p>

          {/* Referral Flow */}
          <ReferralSignupFlow onReferralApplied={(code) => toast.success(`Referral code ${code} applied!`)} />

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <GoogleOAuthButton 
              redirectTo={redirect} 
              mode="signup" 
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                minLength={6}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
