'use client';

import {
  Shield,
  Star,
  Award,
  Crown,
  TrendingUp,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useState } from 'react';

interface JudgeCredibilityBadgeProps {
  tier: 'new' | 'verified' | 'expert' | 'master' | 'elite';
  score: number;
  totalVerdicts: number;
  helpfulnessRate?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  new: {
    label: 'New Judge',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: Shield,
    minVerdicts: 0,
    minScore: 0,
  },
  verified: {
    label: 'Verified',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    minVerdicts: 10,
    minScore: 60,
  },
  expert: {
    label: 'Expert',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Award,
    minVerdicts: 50,
    minScore: 75,
  },
  master: {
    label: 'Master',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: Star,
    minVerdicts: 200,
    minScore: 85,
  },
  elite: {
    label: 'Elite',
    color: 'amber',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: Crown,
    minVerdicts: 500,
    minScore: 95,
  },
};

export function JudgeCredibilityBadge({
  tier,
  score,
  totalVerdicts,
  helpfulnessRate,
  showDetails = false,
  size = 'md',
}: JudgeCredibilityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = tierConfig[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const tooltipId = `judge-badge-tooltip-${tier}-${score}`;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`inline-flex items-center rounded-full font-medium border cursor-default focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} focus:ring-${config.color}-400`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-label={`${config.label} Judge - Score ${score}/100, ${totalVerdicts} verdicts${helpfulnessRate !== undefined ? `, ${helpfulnessRate}% helpful rate` : ''}`}
      >
        <Icon className={iconSizes[size]} aria-hidden="true" />
        <span>{config.label}</span>
        {showDetails && (
          <span className="opacity-70">({score})</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="bg-gray-900 text-white rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
              <span className="font-semibold">{config.label} Judge</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Credibility Score</span>
                <span className="font-medium">{score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Verdicts</span>
                <span className="font-medium">{totalVerdicts}</span>
              </div>
              {helpfulnessRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Helpful Rate</span>
                  <span className="font-medium">{helpfulnessRate}%</span>
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}

interface JudgeCredibilityCardProps {
  tier: 'new' | 'verified' | 'expert' | 'master' | 'elite';
  score: number;
  totalVerdicts: number;
  helpfulnessRate: number;
  agreementRate: number;
  avgReasoningLength: number;
  recentTrend: 'up' | 'down' | 'stable';
}

export function JudgeCredibilityCard({
  tier,
  score,
  totalVerdicts,
  helpfulnessRate,
  agreementRate,
  avgReasoningLength,
  recentTrend,
}: JudgeCredibilityCardProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  const nextTier = getNextTier(tier);
  const nextTierConfig = nextTier ? tierConfig[nextTier] : null;

  // Calculate progress to next tier
  const progressToNextTier = nextTierConfig
    ? Math.min(
        100,
        Math.round(
          ((score - config.minScore) /
            (nextTierConfig.minScore - config.minScore)) *
            100
        )
      )
    : 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${config.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white/50`}>
              <Icon className={`h-6 w-6 ${config.textColor}`} />
            </div>
            <div>
              <div className={`font-semibold ${config.textColor}`}>
                {config.label} Judge
              </div>
              <div className={`text-sm ${config.textColor} opacity-70`}>
                Credibility Score: {score}/100
              </div>
            </div>
          </div>
          {recentTrend === 'up' && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Rising</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalVerdicts}</div>
          <div className="text-xs text-gray-500">Total Verdicts</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{helpfulnessRate}%</div>
          <div className="text-xs text-gray-500">Helpful Rate</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{agreementRate}%</div>
          <div className="text-xs text-gray-500">Agreement Rate</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{avgReasoningLength}</div>
          <div className="text-xs text-gray-500">Avg. Words</div>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTierConfig && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to {nextTierConfig.label}</span>
              <span className="font-medium text-gray-900">{progressToNextTier}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all`}
                style={{ width: `${progressToNextTier}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Info className="h-3 w-3" />
              <span>
                Need {nextTierConfig.minScore - score} more points and{' '}
                {Math.max(0, nextTierConfig.minVerdicts - totalVerdicts)} more verdicts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNextTier(
  current: 'new' | 'verified' | 'expert' | 'master' | 'elite'
): 'verified' | 'expert' | 'master' | 'elite' | null {
  const tiers: ('new' | 'verified' | 'expert' | 'master' | 'elite')[] = [
    'new',
    'verified',
    'expert',
    'master',
    'elite',
  ];
  const currentIndex = tiers.indexOf(current);
  return currentIndex < tiers.length - 1
    ? (tiers[currentIndex + 1] as 'verified' | 'expert' | 'master' | 'elite')
    : null;
}

// Utility function to calculate judge tier from stats
export function calculateJudgeTier(
  totalVerdicts: number,
  credibilityScore: number
): 'new' | 'verified' | 'expert' | 'master' | 'elite' {
  if (totalVerdicts >= 500 && credibilityScore >= 95) return 'elite';
  if (totalVerdicts >= 200 && credibilityScore >= 85) return 'master';
  if (totalVerdicts >= 50 && credibilityScore >= 75) return 'expert';
  if (totalVerdicts >= 10 && credibilityScore >= 60) return 'verified';
  return 'new';
}

// Utility function to calculate credibility score
export function calculateCredibilityScore(stats: {
  totalVerdicts: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  agreementWithMajority: number;
  avgReasoningLength: number;
  recentActivityDays: number;
}): number {
  const {
    totalVerdicts,
    helpfulVotes,
    unhelpfulVotes,
    agreementWithMajority,
    avgReasoningLength,
    recentActivityDays,
  } = stats;

  // Base score from volume (max 20 points)
  const volumeScore = Math.min(20, totalVerdicts / 25);

  // Helpfulness score (max 30 points)
  const totalVotes = helpfulVotes + unhelpfulVotes;
  const helpfulnessScore =
    totalVotes > 0 ? (helpfulVotes / totalVotes) * 30 : 15;

  // Agreement with majority (max 20 points)
  const agreementScore = agreementWithMajority * 20;

  // Reasoning quality (max 15 points)
  const reasoningScore = Math.min(15, (avgReasoningLength / 50) * 15);

  // Recency bonus (max 15 points)
  const recencyScore =
    recentActivityDays <= 7 ? 15 : recentActivityDays <= 30 ? 10 : 5;

  return Math.round(
    volumeScore + helpfulnessScore + agreementScore + reasoningScore + recencyScore
  );
}
