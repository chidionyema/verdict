'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ChevronRight,
  X,
  Linkedin,
  Award,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface EarningsUnlockBannerProps {
  currentMultiplier: number;
  nextMultiplier: number;
  nextStepLabel: string;
  nextStepUrl: string;
  weeklyVerdicts?: number;
  baseRate?: number;
  variant?: 'prominent' | 'subtle' | 'inline';
  onDismiss?: () => void;
  dismissible?: boolean;
}

/**
 * EarningsUnlockBanner - Shows concrete dollar impact of verification
 *
 * Design principles:
 * 1. Show MONEY not percentages ("+$4.50/week" not "+15%")
 * 2. Use actual user data (their weekly verdict count)
 * 3. Make the action clear and one-click
 * 4. Positive framing ("Unlock" not "You're missing out")
 */
export function EarningsUnlockBanner({
  currentMultiplier,
  nextMultiplier,
  nextStepLabel,
  nextStepUrl,
  weeklyVerdicts = 20,
  baseRate = 0.60,
  variant = 'prominent',
  onDismiss,
  dismissible = true,
}: EarningsUnlockBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Calculate concrete dollar amounts
  const currentWeeklyEarnings = weeklyVerdicts * baseRate * currentMultiplier;
  const nextWeeklyEarnings = weeklyVerdicts * baseRate * nextMultiplier;
  const weeklyIncrease = nextWeeklyEarnings - currentWeeklyEarnings;
  const monthlyIncrease = weeklyIncrease * 4;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || weeklyIncrease <= 0) {
    return null;
  }

  // Inline variant - minimal, for embedding in other components
  if (variant === 'inline') {
    return (
      <Link
        href={nextStepUrl}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <TrendingUp className="h-4 w-4" />
        <span>Unlock +£{weeklyIncrease.toFixed(2)}/week</span>
        <ChevronRight className="h-3 w-3" />
      </Link>
    );
  }

  // Subtle variant - smaller, less intrusive
  if (variant === 'subtle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {nextStepLabel} to earn +£{weeklyIncrease.toFixed(2)}/week
          </p>
        </div>
        <Link
          href={nextStepUrl}
          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition shrink-0"
        >
          Unlock
        </Link>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }

  // Prominent variant - full featured, eye-catching
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Unlock Higher Earnings</h3>
              <p className="text-indigo-200 text-sm">One step away from earning more</p>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1 text-white/60 hover:text-white transition"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Earnings comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-indigo-200 text-xs mb-1">Current (weekly)</p>
            <p className="text-2xl font-bold">£{currentWeeklyEarnings.toFixed(2)}</p>
            <p className="text-indigo-200 text-xs mt-1">{currentMultiplier}x rate</p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 ring-2 ring-white/30">
            <p className="text-indigo-100 text-xs mb-1">After {nextStepLabel}</p>
            <p className="text-2xl font-bold">£{nextWeeklyEarnings.toFixed(2)}</p>
            <p className="text-green-300 text-xs mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +£{weeklyIncrease.toFixed(2)}/week
            </p>
          </div>
        </div>

        {/* Monthly projection */}
        <div className="flex items-center gap-2 mb-4 text-indigo-200 text-sm">
          <DollarSign className="h-4 w-4" />
          <span>That's <strong className="text-white">+£{monthlyIncrease.toFixed(2)}/month</strong> extra earnings</span>
        </div>

        {/* CTA */}
        <Link
          href={nextStepUrl}
          className="flex items-center justify-center gap-2 w-full py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition"
        >
          {nextStepLabel.toLowerCase().includes('linkedin') ? (
            <Linkedin className="h-5 w-5" />
          ) : (
            <Award className="h-5 w-5" />
          )}
          {nextStepLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * QuickEarningsCalculator - Shows users exactly what verification is worth
 */
export function QuickEarningsCalculator({
  weeklyVerdicts = 20,
  baseRate = 0.60,
  tiers,
}: {
  weeklyVerdicts?: number;
  baseRate?: number;
  tiers: Array<{
    name: string;
    multiplier: number;
    unlocked: boolean;
  }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Your Earnings Potential
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Based on ~{weeklyVerdicts} verdicts/week at £{baseRate.toFixed(2)} base rate
      </p>

      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const weeklyEarnings = weeklyVerdicts * baseRate * tier.multiplier;
          const isNext = !tier.unlocked && (index === 0 || tiers[index - 1].unlocked);

          return (
            <div
              key={tier.name}
              className={`flex items-center justify-between p-3 rounded-xl ${
                tier.unlocked
                  ? 'bg-green-50 border border-green-200'
                  : isNext
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {tier.unlocked ? (
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    isNext ? 'border-indigo-400' : 'border-gray-300'
                  }`} />
                )}
                <span className={`text-sm font-medium ${
                  tier.unlocked ? 'text-green-900' : isNext ? 'text-indigo-900' : 'text-gray-600'
                }`}>
                  {tier.name}
                </span>
              </div>
              <div className="text-right">
                <p className={`font-bold ${
                  tier.unlocked ? 'text-green-700' : isNext ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                  £{weeklyEarnings.toFixed(2)}/wk
                </p>
                <p className="text-xs text-gray-500">{tier.multiplier}x</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
