'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Coins, ArrowRight, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface LowBalanceWarningProps {
  /** Current credit balance */
  credits: number;
  /** Credits needed for current action (optional) */
  requiredCredits?: number;
  /** Threshold below which to show warning (default: 2) */
  threshold?: number;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Dismissible by user */
  dismissible?: boolean;
  /** Show earn credits option */
  showEarnOption?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when user wants to buy credits */
  onBuyCredits?: () => void;
  /** Callback when user wants to earn credits */
  onEarnCredits?: () => void;
}

export function LowBalanceWarning({
  credits,
  requiredCredits,
  threshold = 2,
  compact = false,
  dismissible = true,
  showEarnOption = true,
  className = '',
  onBuyCredits,
  onEarnCredits,
}: LowBalanceWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed this warning recently (within 24 hours)
  // Use lazy initializer to read from localStorage once on mount
  const [hasDismissedBefore] = useState(() => {
    if (typeof window === 'undefined') return false;
    const lastDismissed = localStorage.getItem('lowBalanceWarningDismissed');
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      const hoursSince = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      return hoursSince < 24;
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lowBalanceWarningDismissed', Date.now().toString());
    }
  };

  // Don't show if credits are above threshold
  if (credits > threshold) return null;

  // Don't show if dismissed
  if (dismissed) return null;

  // Don't show if dismissed recently (unless balance is critically low or needed for action)
  if (hasDismissedBefore && credits > 0 && !requiredCredits) return null;

  const isZeroCredits = credits === 0;
  const cannotAfford = requiredCredits !== undefined && credits < requiredCredits;
  const creditsShort = requiredCredits ? requiredCredits - credits : 0;

  // Compact inline version
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isZeroCredits || cannotAfford
            ? 'bg-amber-100 text-amber-800 border border-amber-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        } ${className}`}
        role="alert"
        aria-live="polite"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">
          {isZeroCredits
            ? 'No credits remaining'
            : cannotAfford
            ? `Need ${creditsShort} more credit${creditsShort !== 1 ? 's' : ''}`
            : `Only ${credits} credit${credits !== 1 ? 's' : ''} left`}
        </span>
        {onBuyCredits && (
          <button
            onClick={onBuyCredits}
            className="ml-auto text-xs font-semibold underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            Get more
          </button>
        )}
      </div>
    );
  }

  // Full warning card
  return (
    <div
      className={`relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isZeroCredits || cannotAfford ? 'bg-amber-200' : 'bg-amber-100'
          }`}
        >
          {isZeroCredits ? (
            <Coins className="h-6 w-6 text-amber-700" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 mb-1">
            {isZeroCredits
              ? "You're out of credits"
              : cannotAfford
              ? `You need ${creditsShort} more credit${creditsShort !== 1 ? 's' : ''}`
              : 'Running low on credits'}
          </h3>
          <p className="text-sm text-amber-800 mb-3">
            {isZeroCredits
              ? 'Get credits to submit your request and receive feedback.'
              : cannotAfford
              ? `This action requires ${requiredCredits} credit${requiredCredits !== 1 ? 's' : ''}, but you have ${credits}.`
              : `You have ${credits} credit${credits !== 1 ? 's' : ''} remaining. Consider topping up to avoid interruptions.`}
          </p>

          <div className="flex flex-wrap gap-3">
            {showEarnOption && (
              <Link
                href="/feed?earn=true"
                onClick={onEarnCredits}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <Zap className="h-4 w-4" />
                Earn Free Credits
              </Link>
            )}
            <Link
              href="/credits"
              onClick={onBuyCredits}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                showEarnOption
                  ? 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 focus-visible:ring-amber-500'
                  : 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500'
              }`}
            >
              <Coins className="h-4 w-4" />
              Buy Credits
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check credit balance and provide warning state
 */
export function useLowBalanceCheck(threshold: number = 2) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

          setCredits((profile as { credits?: number } | null)?.credits ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();

    // Listen for credit updates
    const handleCreditUpdate = () => fetchCredits();
    window.addEventListener('credits-updated', handleCreditUpdate);
    return () => window.removeEventListener('credits-updated', handleCreditUpdate);
  }, []);

  return {
    credits,
    loading,
    isLow: credits !== null && credits <= threshold,
    isEmpty: credits === 0,
  };
}
