'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Star,
  Award,
  Crown,
  Gem,
  TrendingUp,
  Shield,
  CheckCircle,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';

interface UnifiedJudgeLevelProps {
  totalVerdicts: number;
  verificationTierIndex: number; // 0-5
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showExplanation?: boolean;
}

// Activity-based levels (what you've done)
const ACTIVITY_LEVELS = [
  { name: 'Novice', threshold: 0, icon: Sparkles, color: 'gray' },
  { name: 'Bronze', threshold: 10, icon: Star, color: 'amber' },
  { name: 'Silver', threshold: 25, icon: Award, color: 'slate' },
  { name: 'Gold', threshold: 50, icon: Crown, color: 'yellow' },
  { name: 'Platinum', threshold: 100, icon: Gem, color: 'cyan' },
  { name: 'Diamond', threshold: 250, icon: TrendingUp, color: 'purple' },
];

// Verification-based trust badges (who you are)
const VERIFICATION_BADGES = [
  { name: 'Unverified', multiplier: 1.0, color: 'gray' },
  { name: 'Email Verified', multiplier: 1.0, color: 'blue' },
  { name: 'Profile Complete', multiplier: 1.0, color: 'emerald' },
  { name: 'Verified', multiplier: 1.15, color: 'sky' },
  { name: 'Trusted', multiplier: 1.25, color: 'indigo' },
  { name: 'Expert', multiplier: 1.5, color: 'purple' },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-400 to-gray-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', gradient: 'from-slate-400 to-slate-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', gradient: 'from-yellow-400 to-amber-500' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', gradient: 'from-cyan-400 to-blue-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', gradient: 'from-purple-500 to-pink-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-400 to-blue-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-400 to-emerald-500' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', gradient: 'from-sky-400 to-sky-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', gradient: 'from-indigo-400 to-indigo-500' },
};

function getActivityLevel(verdicts: number) {
  for (let i = ACTIVITY_LEVELS.length - 1; i >= 0; i--) {
    if (verdicts >= ACTIVITY_LEVELS[i].threshold) {
      return { ...ACTIVITY_LEVELS[i], index: i };
    }
  }
  return { ...ACTIVITY_LEVELS[0], index: 0 };
}

function getNextActivityLevel(verdicts: number) {
  for (const level of ACTIVITY_LEVELS) {
    if (verdicts < level.threshold) {
      return level;
    }
  }
  return null;
}

/**
 * UnifiedJudgeLevel - Single, clear judge progression display
 *
 * Combines:
 * - Activity Level (Novice → Diamond) based on verdicts
 * - Verification Badge (Verified/Trusted/Expert) based on identity
 *
 * This replaces the confusing two-tier system with one clear view
 */
export function UnifiedJudgeLevel({
  totalVerdicts,
  verificationTierIndex,
  className = '',
  variant = 'full',
  showExplanation = false,
}: UnifiedJudgeLevelProps) {
  const [showInfo, setShowInfo] = useState(false);

  const activityLevel = getActivityLevel(totalVerdicts);
  const nextLevel = getNextActivityLevel(totalVerdicts);
  const verificationBadge = VERIFICATION_BADGES[Math.min(verificationTierIndex, 5)];

  const activityColors = COLOR_CLASSES[activityLevel.color];
  const verificationColors = COLOR_CLASSES[verificationBadge.color];
  const ActivityIcon = activityLevel.icon;

  const progressToNext = nextLevel
    ? ((totalVerdicts - activityLevel.threshold) / (nextLevel.threshold - activityLevel.threshold)) * 100
    : 100;
  const verdictsToNext = nextLevel ? nextLevel.threshold - totalVerdicts : 0;

  // Minimal variant - just shows level name with optional verification badge
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`font-semibold ${activityColors.text}`}>
          {activityLevel.name}
        </span>
        {verificationTierIndex >= 3 && (
          <div
            className={`w-4 h-4 rounded-full bg-gradient-to-br ${verificationColors.gradient} flex items-center justify-center`}
            title={verificationBadge.name}
          >
            <Shield className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
    );
  }

  // Compact variant - single line with progress
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Level badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 ${activityColors.bg} ${activityColors.border} border rounded-full`}>
          <ActivityIcon className={`h-4 w-4 ${activityColors.text}`} />
          <span className={`text-sm font-semibold ${activityColors.text}`}>
            {activityLevel.name}
          </span>
          {verificationTierIndex >= 3 && (
            <div
              className={`w-4 h-4 rounded-full bg-gradient-to-br ${verificationColors.gradient} flex items-center justify-center ml-1`}
              title={`${verificationBadge.name} (+${((verificationBadge.multiplier - 1) * 100).toFixed(0)}% bonus)`}
            >
              <Shield className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${COLOR_CLASSES[nextLevel.color].gradient} rounded-full`}
              />
            </div>
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {verdictsToNext} to {nextLevel.name}
            </span>
          </div>
        )}

        {/* Earnings multiplier indicator */}
        {verificationBadge.multiplier > 1 && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            +{((verificationBadge.multiplier - 1) * 100).toFixed(0)}%
          </span>
        )}
      </div>
    );
  }

  // Full variant - detailed card view
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden ${className}`}>
      {/* Header with level info */}
      <div className={`${activityColors.bg} ${activityColors.border} border-b p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${activityColors.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <ActivityIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${activityColors.text}`}>
                  {activityLevel.name} Judge
                </h3>
                {verificationTierIndex >= 3 && (
                  <div
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${verificationColors.bg} ${verificationColors.text}`}
                  >
                    <Shield className="h-3 w-3" />
                    {verificationBadge.name}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {totalVerdicts} verdicts completed
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Show level info"
          >
            {showInfo ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-b border-gray-200 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">How Levels Work</p>
                <p className="text-sm text-gray-600">
                  Your <strong>level</strong> shows your experience (verdicts given).
                  Your <strong>verification badge</strong> shows your trust status and unlocks earning bonuses.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500">Level Up By</p>
                  <p className="text-sm font-semibold text-gray-900">Giving more verdicts</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500">Earn Bonuses By</p>
                  <p className="text-sm font-semibold text-gray-900">Completing verification</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4">
        {/* Progress to next level */}
        {nextLevel && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to {nextLevel.name}</span>
              <span className="font-medium text-gray-900">{totalVerdicts}/{nextLevel.threshold}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${COLOR_CLASSES[nextLevel.color].gradient} rounded-full`}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              {verdictsToNext} more verdicts to level up
            </p>
          </div>
        )}

        {/* Earnings multiplier */}
        <div className={`p-3 rounded-xl ${verificationColors.bg} ${verificationColors.border} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${verificationColors.text}`} />
              <span className={`font-medium ${verificationColors.text}`}>
                Earnings Multiplier
              </span>
            </div>
            <span className={`text-lg font-bold ${verificationColors.text}`}>
              {verificationBadge.multiplier}x
            </span>
          </div>
          {verificationTierIndex < 4 && (
            <Link
              href="/judge/verify"
              className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Unlock up to 1.5x
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Level roadmap */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Level Roadmap</p>
          <div className="flex items-center justify-between">
            {ACTIVITY_LEVELS.map((level, index) => {
              const achieved = totalVerdicts >= level.threshold;
              const LevelIcon = level.icon;
              const levelColors = COLOR_CLASSES[level.color];

              return (
                <div key={level.name} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      achieved
                        ? `bg-gradient-to-br ${levelColors.gradient}`
                        : 'bg-gray-100'
                    }`}
                    title={`${level.name}: ${level.threshold}+ verdicts`}
                  >
                    <LevelIcon className={`h-4 w-4 ${achieved ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] mt-1 ${achieved ? levelColors.text : 'text-gray-400'}`}>
                    {level.threshold}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
