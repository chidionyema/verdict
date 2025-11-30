'use client';

import { useEffect, useState } from 'react';
import { Zap, TrendingUp, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_ECONOMY_CONFIG } from '@/lib/credits';

interface CreditEarningProgressProps {
  userId: string;
  judgmentsToday?: number;
  onCreditEarned?: () => void;
}

export function CreditEarningProgress({ userId, judgmentsToday = 0, onCreditEarned }: CreditEarningProgressProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [judgmentsCount, setJudgmentsCount] = useState(judgmentsToday);

  useEffect(() => {
    setJudgmentsCount(judgmentsToday);
    
    // Check if user just earned a credit
    if (judgmentsToday > 0 && judgmentsToday % CREDIT_ECONOMY_CONFIG.JUDGMENTS_PER_CREDIT === 0) {
      setShowCelebration(true);
      // Load current credits
      loadCredits();
      if (onCreditEarned) {
        onCreditEarned();
      }
      // Hide celebration after 5 seconds
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [judgmentsToday, onCreditEarned]);

  async function loadCredits() {
    if (typeof window === 'undefined') return;
    
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      
      if (profile && 'credits' in profile) {
        setCurrentCredits((profile as any).credits || 0);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  }

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-bounce-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">🎉 Credit Earned!</h3>
              <p className="text-lg text-gray-600 mb-6">
                You've earned <strong className="text-amber-600">1 credit</strong> by completing 5 judgments!
              </p>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-6">
                <div className="text-4xl font-bold text-amber-700 mb-1">
                  {currentCredits + 1} credits
                </div>
                <p className="text-sm text-amber-700">Total available</p>
              </div>
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Continue Judging
              </button>
            </div>
          </div>
        </div>
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
          {judgmentsRemaining < judgmentsNeeded && (
            <span className="font-medium text-amber-700">
              {judgmentsRemaining} more → +1 credit
            </span>
          )}
        </div>

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

