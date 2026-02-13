'use client';

import { Shield, Award, Linkedin, User, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationTier } from '@/lib/judge/verification';

interface JudgeTierBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TIER_CONFIG: Record<VerificationTier, {
  icon: typeof Shield;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  none: {
    icon: User,
    label: 'Unverified',
    shortLabel: '',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    gradientFrom: 'from-gray-400',
    gradientTo: 'to-gray-500',
  },
  email_verified: {
    icon: Mail,
    label: 'Email Verified',
    shortLabel: 'Verified',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
  },
  profile_complete: {
    icon: User,
    label: 'Profile Complete',
    shortLabel: 'Complete',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
  },
  linkedin_connected: {
    icon: Linkedin,
    label: 'LinkedIn Connected',
    shortLabel: 'LinkedIn',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-sky-600',
  },
  linkedin_verified: {
    icon: Shield,
    label: 'Verified Professional',
    shortLabel: 'Verified',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-indigo-600',
  },
  expert_verified: {
    icon: Award,
    label: 'Expert Verified',
    shortLabel: 'Expert',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500',
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3',
    iconOnly: 'w-5 h-5',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    icon: 'h-3.5 w-3.5',
    iconOnly: 'w-6 h-6',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4',
    iconOnly: 'w-8 h-8',
  },
};

export function JudgeTierBadge({
  tier,
  size = 'md',
  showLabel = true,
  className,
}: JudgeTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  // Don't show badge for unverified users
  if (tier === 'none') {
    return null;
  }

  // Icon-only variant
  if (!showLabel) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`,
          sizeConfig.iconOnly,
          className
        )}
        title={config.label}
      >
        <Icon className={cn('text-white', sizeConfig.icon)} />
      </div>
    );
  }

  // Full badge with label
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.borderColor,
        config.color,
        sizeConfig.badge,
        className
      )}
      title={config.label}
    >
      <Icon className={sizeConfig.icon} />
      <span>{config.shortLabel || config.label}</span>
    </div>
  );
}

export function JudgeVerificationIndicator({
  tier,
  className,
}: {
  tier: VerificationTier;
  className?: string;
}) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (tier === 'none') {
    return null;
  }

  // Simple indicator for inline display (e.g., next to username)
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 rounded-full',
        `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`,
        className
      )}
      title={config.label}
    >
      <Icon className="h-2.5 w-2.5 text-white" />
    </div>
  );
}

export function ExpertBadge({
  category,
  size = 'md',
  className,
}: {
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        'bg-gradient-to-r from-purple-50 to-pink-50',
        'border-purple-200 text-purple-700',
        sizeConfig.badge,
        className
      )}
    >
      <Sparkles className={sizeConfig.icon} />
      <span>Expert{category ? ` • ${category}` : ''}</span>
    </div>
  );
}
