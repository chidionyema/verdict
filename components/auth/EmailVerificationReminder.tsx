'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  DollarSign,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmailVerificationReminderProps {
  variant?: 'banner' | 'card' | 'inline' | 'blocking';
  featureBlocked?: string; // e.g., "earn money judging", "submit requests"
  onDismiss?: () => void;
  className?: string;
}

export function EmailVerificationReminder({
  variant = 'banner',
  featureBlocked = 'all features',
  onDismiss,
  className = '',
}: EmailVerificationReminderProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const checkVerificationStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email || null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single() as { data: { email_verified: boolean } | null };

      setIsVerified(Boolean(profile?.email_verified));
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  const sendVerificationEmail = async () => {
    if (cooldown > 0) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setCooldown(30); // 30 second cooldown
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if verified, dismissed, or still loading
  if (isVerified === true || isVerified === null || isDismissed) return null;

  // Blocking variant - full screen overlay
  if (variant === 'blocking') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="text-amber-100">
              One quick step to unlock {featureBlocked}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {email && (
              <p className="text-center text-gray-600 mb-6">
                We sent a verification link to:<br />
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
            )}

            {/* What you'll unlock */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">After verifying, you can:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Earn money by judging requests
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Submit feedback requests
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Access all platform features
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {emailSent ? (
              <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-800">Email sent!</p>
                <p className="text-sm text-green-700 mt-1">
                  Check your inbox and click the verification link.
                </p>
              </div>
            ) : null}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={sendVerificationEmail}
                disabled={isSending || cooldown > 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  <>Resend in {cooldown}s</>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    {emailSent ? 'Resend Email' : 'Send Verification Email'}
                  </>
                )}
              </button>

              <button
                onClick={() => checkVerificationStatus()}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                I have verified, check again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-amber-900">Verify your email to {featureBlocked}</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {email && <>We will send a link to {email}</>}
                </p>
              </div>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="text-amber-400 hover:text-amber-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}

            {emailSent && (
              <div className="flex items-center gap-2 text-green-600 mt-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Check your inbox!</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={sendVerificationEmail}
                disabled={isSending || cooldown > 0}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {isSending ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3" />
                )}
                {cooldown > 0 ? `Wait ${cooldown}s` : emailSent ? 'Resend' : 'Send Email'}
              </button>
              <button
                onClick={checkVerificationStatus}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition text-sm"
              >
                I have verified
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg ${className}`}
      >
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          Verify your email to {featureBlocked}
        </p>
        <button
          onClick={sendVerificationEmail}
          disabled={isSending || cooldown > 0}
          className="text-sm font-medium text-amber-600 hover:text-amber-800 underline disabled:no-underline disabled:text-amber-400"
        >
          {cooldown > 0 ? `${cooldown}s` : 'Send link'}
        </button>
      </motion.div>
    );
  }

  // Banner variant (default)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gradient-to-r from-amber-400 to-orange-400 text-white ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <p className="font-medium">
                Verify your email to unlock {featureBlocked}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {emailSent && (
                <span className="text-sm flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Check inbox
                </span>
              )}
              <button
                onClick={sendVerificationEmail}
                disabled={isSending || cooldown > 0}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : null}
                {cooldown > 0 ? `${cooldown}s` : 'Send verification'}
              </button>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if email verification is needed for a feature
export function useEmailVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsVerified(false);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('email_verified')
          .eq('id', user.id)
          .single() as { data: { email_verified: boolean } | null };

        setIsVerified(Boolean(profile?.email_verified));
      } catch (err) {
        console.error('Error checking verification:', err);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { isVerified, isLoading };
}

export default EmailVerificationReminder;
