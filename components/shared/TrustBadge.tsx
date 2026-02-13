import React from 'react';
import { Shield, Users, Clock, Lock, RefreshCw, CreditCard, CheckCircle, Star } from 'lucide-react';

type TrustBadgeVariant = 'anonymous' | 'human' | 'speed' | 'secure' | 'refund' | 'verified' | 'quality' | 'confidential';

interface TrustBadgeProps {
  variant: TrustBadgeVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig = {
  anonymous: {
    icon: Shield,
    text: 'Your situation stays 100% anonymous',
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  human: {
    icon: Users,
    text: 'Real humans, not AI',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  speed: {
    icon: Clock,
    text: 'Average response time: 3 minutes',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  secure: {
    icon: Lock,
    text: 'SSL encrypted & secure',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  refund: {
    icon: RefreshCw,
    text: '3 verdicts guaranteed or full refund',
    color: 'text-teal-700 bg-teal-50 border-teal-200',
  },
  verified: {
    icon: CheckCircle,
    text: 'Verified human reviewers',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  quality: {
    icon: Star,
    text: 'Quality-checked feedback',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  confidential: {
    icon: Shield,
    text: 'Private submissions never shared',
    color: 'text-violet-700 bg-violet-50 border-violet-200',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs gap-1.5',
  md: 'px-3 py-2 text-sm gap-2',
  lg: 'px-4 py-3 text-base gap-2.5',
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TrustBadge({ variant, className = '', size = 'md' }: TrustBadgeProps) {
  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center rounded-lg border ${sizeConfig[size]} ${config.color} ${className}`}
    >
      <Icon className={`${iconSizeConfig[size]} flex-shrink-0`} />
      <span className="font-medium">{config.text}</span>
    </div>
  );
}

export function TrustBadgeGroup({
  className = '',
  variants = ['anonymous', 'human', 'speed'],
  size = 'md'
}: {
  className?: string;
  variants?: TrustBadgeVariant[];
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {variants.map((variant) => (
        <TrustBadge key={variant} variant={variant} size={size} />
      ))}
    </div>
  );
}

// Compact inline trust indicators for use near buttons
export function TrustIndicatorStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 py-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <Lock className="w-3.5 h-3.5 text-green-600" />
        Secure Payment
      </span>
      <span className="text-gray-300">|</span>
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <Shield className="w-3.5 h-3.5 text-green-600" />
        Anonymous
      </span>
      <span className="text-gray-300">|</span>
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <RefreshCw className="w-3.5 h-3.5 text-green-600" />
        Refund Guarantee
      </span>
    </div>
  );
}
