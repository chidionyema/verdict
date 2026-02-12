'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Award, Star, Crown, Gem, Sparkles } from 'lucide-react';

interface TierProgressIndicatorProps {
  currentTier: string;
  totalVerdicts: number;
  className?: string;
  variant?: 'compact' | 'full';
}

const TIERS = [
  { name: 'Novice', threshold: 0, icon: Sparkles, color: 'gray', bonus: '0%' },
  { name: 'Bronze', threshold: 10, icon: Star, color: 'amber', bonus: '+5%' },
  { name: 'Silver', threshold: 25, icon: Award, color: 'slate', bonus: '+10%' },
  { name: 'Gold', threshold: 50, icon: Crown, color: 'yellow', bonus: '+15%' },
  { name: 'Platinum', threshold: 100, icon: Gem, color: 'cyan', bonus: '+20%' },
  { name: 'Master', threshold: 250, icon: TrendingUp, color: 'purple', bonus: '+25%' },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    gradient: 'from-gray-400 to-gray-500',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    gradient: 'from-slate-400 to-slate-500',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    gradient: 'from-yellow-400 to-amber-500',
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-300',
    gradient: 'from-cyan-400 to-blue-500',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    gradient: 'from-purple-500 to-pink-500',
  },
};

export function TierProgressIndicator({
  currentTier,
  totalVerdicts,
  className = '',
  variant = 'compact',
}: TierProgressIndicatorProps) {
  // Find current and next tier
  const currentTierIndex = TIERS.findIndex(t => t.name.toLowerCase() === currentTier.toLowerCase());
  const currentTierData = TIERS[currentTierIndex] || TIERS[0];
  const nextTierData = TIERS[currentTierIndex + 1];

  const colors = colorClasses[currentTierData.color];
  const Icon = currentTierData.icon;

  // Calculate progress to next tier
  const progressToNext = nextTierData
    ? ((totalVerdicts - currentTierData.threshold) / (nextTierData.threshold - currentTierData.threshold)) * 100
    : 100;

  const verdictsToNext = nextTierData ? nextTierData.threshold - totalVerdicts : 0;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Current tier badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg} ${colors.border} border rounded-full`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{currentTierData.name}</span>
        </div>

        {/* Progress to next */}
        {nextTierData && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${colorClasses[nextTierData.color].gradient} rounded-full`}
              />
            </div>
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {verdictsToNext} to {nextTierData.name}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Your Progress</h3>
        <span className={`text-sm font-medium ${colors.text}`}>{currentTierData.bonus} bonus</span>
      </div>

      {/* Current tier display */}
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 mb-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Tier</p>
            <p className={`text-xl font-bold ${colors.text}`}>{currentTierData.name} Judge</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {nextTierData && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to {nextTierData.name}</span>
            <span className="font-medium text-gray-900">{totalVerdicts}/{nextTierData.threshold}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressToNext, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${colorClasses[nextTierData.color].gradient} rounded-full`}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            <span className="font-semibold text-indigo-600">{verdictsToNext} more verdicts</span> to unlock {nextTierData.bonus} bonus
          </p>
        </div>
      )}

      {/* Tier roadmap */}
      <div className="flex items-center justify-between">
        {TIERS.slice(0, 5).map((tier, index) => {
          const achieved = totalVerdicts >= tier.threshold;
          const TierIcon = tier.icon;
          const tierColors = colorClasses[tier.color];

          return (
            <div key={tier.name} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  achieved
                    ? `bg-gradient-to-br ${tierColors.gradient}`
                    : 'bg-gray-100'
                }`}
              >
                <TierIcon className={`h-4 w-4 ${achieved ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-1 ${achieved ? tierColors.text : 'text-gray-400'}`}>
                {tier.threshold}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
