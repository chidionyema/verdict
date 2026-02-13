'use client';

import { Shield, Star, Award, TrendingUp, CheckCircle, Zap } from 'lucide-react';

export type JudgeTier = 'rookie' | 'trusted' | 'expert' | 'elite';

interface JudgeTierBadgeProps {
  tier: JudgeTier;
  consensusRate?: number; // 0-100
  isVerified?: boolean;
  verdictCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const TIER_CONFIG: Record<JudgeTier, {
  label: string;
  icon: typeof Star;
  gradient: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  minVerdicts: number;
}> = {
  rookie: {
    label: 'Rookie',
    icon: Star,
    gradient: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    description: 'New to judging',
    minVerdicts: 0,
  },
  trusted: {
    label: 'Trusted',
    icon: CheckCircle,
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: '10+ verdicts with good ratings',
    minVerdicts: 10,
  },
  expert: {
    label: 'Expert',
    icon: Award,
    gradient: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: '50+ verdicts with high consensus',
    minVerdicts: 50,
  },
  elite: {
    label: 'Elite',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'Top 5% of all judges',
    minVerdicts: 200,
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
    iconContainer: 'w-4 h-4',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
    iconContainer: 'w-5 h-5',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
    iconContainer: 'w-6 h-6',
  },
};

export function JudgeTierBadge({
  tier,
  consensusRate,
  isVerified = false,
  verdictCount,
  size = 'md',
  showDetails = false,
  className = '',
}: JudgeTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const TierIcon = config.icon;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      {/* Main Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full font-medium border ${sizeConfig.badge} ${config.bgColor} ${config.borderColor} ${config.textColor}`}
        >
          <span className={`rounded-full bg-gradient-to-r ${config.gradient} ${sizeConfig.iconContainer} flex items-center justify-center`}>
            <TierIcon className={`${sizeConfig.icon} text-white`} />
          </span>
          <span>{config.label}</span>
        </span>

        {/* Verified Badge */}
        {isVerified && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
            <Shield className="h-3 w-3" />
            Verified
          </span>
        )}

        {/* High Consensus Badge */}
        {consensusRate !== undefined && consensusRate >= 80 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            {consensusRate}% consensus
          </span>
        )}
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          {verdictCount !== undefined && (
            <span>{verdictCount} verdicts</span>
          )}
          <span>{config.description}</span>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function JudgeTierBadgeCompact({
  tier,
  isVerified = false,
  className = '',
}: {
  tier: JudgeTier;
  isVerified?: boolean;
  className?: string;
}) {
  const config = TIER_CONFIG[tier];
  const TierIcon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center`}>
        <TierIcon className="h-2.5 w-2.5 text-white" />
      </span>
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      {isVerified && <Shield className="h-3 w-3 text-green-600" />}
    </div>
  );
}

// Helper function to determine tier from performance metrics
export function calculateJudgeTier(metrics: {
  verdictCount: number;
  averageRating: number;
  consensusRate: number;
}): JudgeTier {
  const { verdictCount, averageRating, consensusRate } = metrics;

  // Elite: Top performers with extensive experience
  if (verdictCount >= 200 && averageRating >= 4.5 && consensusRate >= 85) {
    return 'elite';
  }

  // Expert: High-quality judges with good track record
  if (verdictCount >= 50 && averageRating >= 4.0 && consensusRate >= 75) {
    return 'expert';
  }

  // Trusted: Established judges with consistent quality
  if (verdictCount >= 10 && averageRating >= 3.5) {
    return 'trusted';
  }

  // Rookie: New judges building their reputation
  return 'rookie';
}
