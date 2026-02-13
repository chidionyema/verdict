'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Zap, TrendingUp, Sparkles, Clock, ArrowRight, Gift, Star, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_ECONOMY_CONFIG } from '@/lib/credits';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface CreditEarningProgressProps {
  userId: string;
  judgmentsToday?: number;
  onCreditEarned?: () => void;
  showUseCreditsPrompt?: boolean;
  returnUrl?: string | null;
}

export function CreditEarningProgress({
  userId,
  judgmentsToday = 0,
  onCreditEarned,
  showUseCreditsPrompt = true,
  returnUrl
}: CreditEarningProgressProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [judgmentsCount, setJudgmentsCount] = useState(judgmentsToday);
  const avgTimePerJudgment = 2; // minutes

  const loadCredits = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && 'credits' in profile) {
        setCurrentCredits((profile as { credits: number }).credits || 0);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  }, [userId]);

  // Load credits on mount
  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  useEffect(() => {
    setJudgmentsCount(judgmentsToday);

    // Check if user just earned a credit
    if (judgmentsToday > 0 && judgmentsToday % CREDIT_ECONOMY_CONFIG.JUDGMENTS_PER_CREDIT === 0) {
      setShowCelebration(true);
      // Trigger delightful feedback
      playSuccessSound();
      triggerHaptic('success');
      // Load current credits
      loadCredits();
      if (onCreditEarned) {
        onCreditEarned();
      }
      // Don't auto-hide - let user choose action
    }
  }, [judgmentsToday, onCreditEarned, loadCredits]);

  // Calculate progress
  const judgmentsNeeded = CREDIT_ECONOMY_CONFIG.JUDGMENTS_PER_CREDIT;
  const progress = (judgmentsCount % judgmentsNeeded) / judgmentsNeeded;
  const partialCredits = (judgmentsCount % judgmentsNeeded) * CREDIT_ECONOMY_CONFIG.CREDIT_VALUE_PER_JUDGMENT;
  const judgmentsRemaining = judgmentsNeeded - (judgmentsCount % judgmentsNeeded);
  const creditsEarned = Math.floor(judgmentsCount / judgmentsNeeded);

  return (
    <>
      {/* Credit Earned Celebration Modal */}
      {showCelebration && (
        <>
          <Confetti active={showCelebration} duration={4000} pieces={80} />
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center">
                {/* Animated trophy icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full animate-ping opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="h-12 w-12 text-white animate-bounce" />
                  </div>
                  {/* Floating stars */}
                  <Star className="absolute -top-2 -left-2 h-6 w-6 text-amber-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <Star className="absolute -top-1 -right-3 h-5 w-5 text-yellow-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <Star className="absolute -bottom-1 -left-3 h-4 w-4 text-amber-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>

                <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent mb-2">
                  Credit Earned!
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Amazing! You helped 3 people and earned <strong className="text-amber-600">1 credit</strong>
                </p>

                {/* Credit counter with animation */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 mb-6 border border-amber-200">
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-8 w-8 text-amber-500" />
                    <div className="text-5xl font-bold text-amber-700 tabular-nums">
                      {currentCredits + 1}
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">credits available to use</p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Link
                    href={returnUrl || '/submit'}
                    onClick={() => triggerHaptic('medium')}
                    className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all text-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Gift className="h-5 w-5" />
                      Submit Something Now
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setShowCelebration(false);
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Keep Helping & Earning
                  </button>
                </div>

                {/* Encouragement text */}
                <p className="text-xs text-gray-500 mt-4">
                  You&apos;re making a difference! Every review helps someone.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-gray-900">Earning Credits</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-700">
              {judgmentsCount % judgmentsNeeded}/{judgmentsNeeded}
            </div>
            <div className="text-xs text-gray-600">judgments</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress * 100}%` }}
          >
            {progress > 0 && (
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>
              {partialCredits.toFixed(1)} credits earned so far
            </span>
          </div>
          {judgmentsRemaining < judgmentsNeeded && judgmentsRemaining > 0 && (
            <span className="font-medium text-amber-700">
              {judgmentsRemaining} more → +1 credit
            </span>
          )}
        </div>

        {/* ETA Display */}
        {judgmentsRemaining > 0 && judgmentsRemaining < judgmentsNeeded && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Clock className="h-3 w-3" />
            <span>~{judgmentsRemaining * avgTimePerJudgment} min to earn your next credit</span>
          </div>
        )}

        {/* Use Credit Prompt */}
        {showUseCreditsPrompt && currentCredits > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <Link
              href={returnUrl || '/submit'}
              className="flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded-lg transition group"
            >
              <div className="flex items-center gap-2 text-green-700">
                <Gift className="h-4 w-4" />
                <span className="font-medium">You have {currentCredits} credit{currentCredits !== 1 ? 's' : ''} to use!</span>
              </div>
              <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Total Credits Earned Today */}
        {creditsEarned > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credits earned today:</span>
              <span className="font-bold text-indigo-700">{creditsEarned}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

