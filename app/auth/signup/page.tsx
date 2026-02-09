'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { ReferralSignupFlow } from '@/components/referrals/ReferralSignupFlow';
import { toast } from '@/components/ui/toast';
import { DollarSign, Star, Users, MessageSquare, Clock, Shield, Mail, RefreshCw } from 'lucide-react';

type SignupIntent = 'judge' | 'seeker' | 'general';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const intentParam = searchParams.get('intent') as SignupIntent | null;
  const referralCode = searchParams.get('ref') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [intent, setIntent] = useState<SignupIntent>('general');

  const supabase = createClient();

  // Detect intent from localStorage or URL params
  useEffect(() => {
    if (intentParam) {
      setIntent(intentParam);
    } else if (typeof window !== 'undefined') {
      const judgeIntent = localStorage.getItem('verdict_judge_intent');
      if (judgeIntent === 'true' || redirect.includes('/judge')) {
        setIntent('judge');
      } else if (redirect.includes('/start') || redirect.includes('/submit')) {
        setIntent('seeker');
      }
    }
  }, [intentParam, redirect]);

  // Intent-specific content
  const intentContent = {
    judge: {
      title: 'Join as a Judge',
      subtitle: 'Start earning by sharing your honest opinions',
      benefits: [
        { icon: DollarSign, text: 'Earn $0.60-$2.00 per verdict' },
        { icon: Clock, text: '100% flexible schedule' },
        { icon: Star, text: 'Build your reputation' },
      ],
      successTitle: 'Welcome, Judge!',
      successSubtitle: 'Complete your 5-minute qualification to start earning',
      successCta: 'Start Qualification',
      successCtaHref: '/judge/qualify',
      gradient: 'from-purple-600 to-indigo-600',
      bgGradient: 'from-purple-50 via-white to-indigo-50',
    },
    seeker: {
      title: 'Get Real Feedback',
      subtitle: 'Get honest opinions from real people in minutes',
      benefits: [
        { icon: Users, text: '3+ reviews per credit' },
        { icon: MessageSquare, text: 'Detailed, actionable feedback' },
        { icon: Shield, text: '100% satisfaction guarantee' },
      ],
      successTitle: 'Welcome! You\'re All Set',
      successSubtitle: 'Your account is ready. Start getting feedback now!',
      successCta: 'Get Your First Feedback',
      successCtaHref: redirect,
      gradient: 'from-indigo-600 to-purple-600',
      bgGradient: 'from-indigo-50 via-white to-purple-50',
    },
    general: {
      title: 'Create your account',
      subtitle: 'Get 3 free credits when you sign up (each gets you 3 feedback reports)',
      benefits: [],
      successTitle: 'Welcome! You\'re All Set',
      successSubtitle: 'Your account is ready to use. Start getting feedback from real people!',
      successCta: 'Get Your First Feedback',
      successCtaHref: redirect,
      gradient: 'from-indigo-600 to-purple-600',
      bgGradient: 'from-indigo-50 via-white to-purple-50',
    },
  };

  const content = intentContent[intent];

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

    // Always show success and let them start using the platform
    if (data.user) {
      setSuccess(true);
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
      <div className={`min-h-screen bg-gradient-to-br ${content.bgGradient} flex items-center justify-center px-4`}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success icon */}
            <div className={`w-16 h-16 ${intent === 'judge' ? 'bg-purple-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {intent === 'judge' ? (
                <DollarSign className="w-8 h-8 text-purple-600" />
              ) : (
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.successTitle}</h2>
            <p className="text-gray-600 mb-6">{content.successSubtitle}</p>

            {/* Intent-specific welcome content */}
            {intent === 'judge' ? (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-lg font-bold text-purple-900 mb-1">Ready to Earn</p>
                <p className="text-sm text-purple-700 mb-2">Complete a quick qualification to start judging</p>
                <div className="flex items-center justify-center gap-4 text-xs text-purple-600">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 5 min</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> $50-400/week</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-lg font-bold text-green-900 mb-1">Welcome Bonus</p>
                <p className="text-2xl font-bold text-green-800 mb-1">3 FREE Credits</p>
                <p className="text-sm text-green-700">Each credit gets you 3 feedback reports from real people</p>
              </div>
            )}

            {/* Single clear action */}
            <div className="space-y-3">
              <Link
                href={content.successCtaHref}
                className={`block w-full py-4 bg-gradient-to-r ${content.gradient} text-white rounded-lg font-bold text-lg hover:shadow-lg transition text-center min-h-[56px]`}
                onClick={() => {
                  // Clear judge intent flag after successful signup
                  if (intent === 'judge' && typeof window !== 'undefined') {
                    localStorage.removeItem('verdict_judge_intent');
                  }
                }}
              >
                {content.successCta} →
              </Link>

              <button
                onClick={() => setSuccess(false)}
                className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition cursor-pointer text-sm min-h-[44px]"
              >
                Use different email
              </button>
            </div>

            {/* Email Verification Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">
                    Verify your email
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We sent a confirmation link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Can't find it? Check your spam folder or{' '}
                    <button
                      onClick={handleResendEmail}
                      disabled={loading}
                      className="text-blue-800 underline hover:text-blue-900 font-medium inline-flex items-center gap-1"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'resend email'
                      )}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${content.bgGradient} flex items-center justify-center px-4 py-8`}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Intent indicator for judge flow */}
          {intent === 'judge' && (
            <div className="flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-3 py-1.5 text-sm font-medium w-fit mb-4">
              <DollarSign className="h-4 w-4" />
              <span>Judge Application</span>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
          <p className="text-gray-600 mb-4">{content.subtitle}</p>

          {/* Intent-specific benefits */}
          {content.benefits.length > 0 && (
            <div className="space-y-2 mb-6">
              {content.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <benefit.icon className={`h-4 w-4 ${intent === 'judge' ? 'text-purple-600' : 'text-indigo-600'}`} />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Referral Flow - only show for seeker intent */}
          {intent !== 'judge' && (
            <ReferralSignupFlow onReferralApplied={(code) => toast.success(`Referral code ${code} applied!`)} />
          )}

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
                aria-label="Email address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                minLength={6}
                required
                aria-label="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-gradient-to-r ${content.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[48px]`}
              >
                {loading ? 'Creating account...' : intent === 'judge' ? 'Create Judge Account' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* Intent switch */}
          {intent !== 'general' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              {intent === 'judge' ? (
                <>
                  Want to get feedback instead?{' '}
                  <button
                    onClick={() => setIntent('seeker')}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Sign up as a seeker
                  </button>
                </>
              ) : (
                <>
                  Want to earn money as a judge?{' '}
                  <button
                    onClick={() => setIntent('judge')}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Apply as a judge
                  </button>
                </>
              )}
            </p>
          )}
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
