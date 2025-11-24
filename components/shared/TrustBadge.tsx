import React from 'react';
import { Shield, Users, Clock } from 'lucide-react';

type TrustBadgeVariant = 'anonymous' | 'human' | 'speed';

interface TrustBadgeProps {
  variant: TrustBadgeVariant;
  className?: string;
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
};

export function TrustBadge({ variant, className = '' }: TrustBadgeProps) {
  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color} ${className}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

export function TrustBadgeGroup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <TrustBadge variant="anonymous" />
      <TrustBadge variant="human" />
      <TrustBadge variant="speed" />
    </div>
  );
}
