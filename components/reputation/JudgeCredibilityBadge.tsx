'use client';

import { Shield, Star, CheckCircle, TrendingUp, Award } from 'lucide-react';

interface JudgeCredibilityBadgeProps {
  reputationScore: number;
  isExpert?: boolean;
  expertTitle?: string;
  verdictCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function JudgeCredibilityBadge({
  reputationScore,
  isExpert = false,
  expertTitle,
  verdictCount,
  className = '',
  size = 'md'
}: JudgeCredibilityBadgeProps) {
  const getCredibilityTier = () => {
    if (isExpert) return { label: 'Verified Expert', color: 'purple', icon: Shield };
    if (reputationScore >= 4.5) return { label: 'Top Reviewer', color: 'green', icon: Award };
    if (reputationScore >= 4.0) return { label: 'Trusted Reviewer', color: 'blue', icon: CheckCircle };
    if (reputationScore >= 3.5) return { label: 'Experienced', color: 'indigo', icon: TrendingUp };
    return { label: 'Community Member', color: 'gray', icon: Star };
  };

  const tier = getCredibilityTier();
  const TierIcon = tier.icon;

  const sizeClasses = {
    sm: {
      container: 'text-xs gap-1.5',
      icon: 'h-3 w-3',
      badge: 'px-2 py-0.5',
      score: 'text-xs'
    },
    md: {
      container: 'text-sm gap-2',
      icon: 'h-4 w-4',
      badge: 'px-2.5 py-1',
      score: 'text-sm'
    },
    lg: {
      container: 'text-base gap-2',
      icon: 'h-5 w-5',
      badge: 'px-3 py-1.5',
      score: 'text-base'
    }
  };

  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className={`flex items-center flex-wrap ${sizeClasses[size].container} ${className}`}>
      {/* Tier Badge */}
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size].badge} ${colorClasses[tier.color as keyof typeof colorClasses]}`}>
        <TierIcon className={sizeClasses[size].icon} />
        <span>{tier.label}</span>
      </span>

      {/* Reputation Score */}
      <div className="flex items-center gap-1 text-gray-600">
        <Star className={`${sizeClasses[size].icon} fill-yellow-400 text-yellow-400`} />
        <span className={`font-medium ${sizeClasses[size].score}`}>
          {reputationScore.toFixed(1)}
        </span>
      </div>

      {/* Verdict Count */}
      {verdictCount !== undefined && verdictCount > 0 && (
        <span className={`text-gray-500 ${sizeClasses[size].score}`}>
          {verdictCount} verdict{verdictCount !== 1 ? 's' : ''}
        </span>
      )}

      {/* Expert Title */}
      {isExpert && expertTitle && (
        <span className={`text-purple-600 font-medium ${sizeClasses[size].score}`}>
          {expertTitle}
        </span>
      )}
    </div>
  );
}

export function JudgeCredibilityCompact({
  reputationScore,
  isExpert = false
}: {
  reputationScore: number;
  isExpert?: boolean;
}) {
  const getCredibilityColor = () => {
    if (isExpert) return 'text-purple-600';
    if (reputationScore >= 4.5) return 'text-green-600';
    if (reputationScore >= 4.0) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${getCredibilityColor()}`}>
      {isExpert ? (
        <Shield className="h-3 w-3" />
      ) : (
        <Star className="h-3 w-3 fill-current" />
      )}
      <span className="font-medium">{reputationScore.toFixed(1)}</span>
    </div>
  );
}
