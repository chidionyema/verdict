'use client';

import { Shield, Lock, Eye, CreditCard, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type SecurityBadgeType = 'secure-payment' | 'data-protected' | 'anonymous' | 'refund-policy' | 'verified-humans';

interface SecurityBadgeProps {
  type: SecurityBadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  className?: string;
}

const BADGE_CONFIG: Record<SecurityBadgeType, {
  icon: typeof Shield;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  link?: string;
}> = {
  'secure-payment': {
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'SSL encrypted transactions via Stripe',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    link: undefined,
  },
  'data-protected': {
    icon: Lock,
    title: 'Data Protected',
    description: 'Your data is encrypted and never sold',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    link: '/legal/privacy',
  },
  'anonymous': {
    icon: Eye,
    title: 'Anonymous & Confidential',
    description: 'Your identity is never revealed to judges',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  'refund-policy': {
    icon: RefreshCw,
    title: 'Refund Guarantee',
    description: '3 verdicts guaranteed or full refund',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    link: '/legal/terms',
  },
  'verified-humans': {
    icon: CheckCircle,
    title: '100% Human Reviewers',
    description: 'Real people, not AI bots',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    link: '/legal/community-guidelines',
  },
};

const SIZE_CONFIG = {
  sm: {
    container: 'p-2 gap-2',
    icon: 'h-4 w-4',
    iconBg: 'w-6 h-6',
    title: 'text-xs font-medium',
    description: 'text-[10px]',
  },
  md: {
    container: 'p-3 gap-3',
    icon: 'h-5 w-5',
    iconBg: 'w-8 h-8',
    title: 'text-sm font-semibold',
    description: 'text-xs',
  },
  lg: {
    container: 'p-4 gap-4',
    icon: 'h-6 w-6',
    iconBg: 'w-10 h-10',
    title: 'text-base font-semibold',
    description: 'text-sm',
  },
};

export function SecurityBadge({
  type,
  size = 'md',
  showLink = true,
  className = '',
}: SecurityBadgeProps) {
  const config = BADGE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const content = (
    <div
      className={`flex items-center rounded-lg border ${config.bgColor} ${config.borderColor} ${sizeConfig.container} ${className} ${
        showLink && config.link ? 'hover:shadow-sm transition-shadow cursor-pointer' : ''
      }`}
    >
      <div className={`flex-shrink-0 ${sizeConfig.iconBg} rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`${sizeConfig.icon} ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${sizeConfig.title} ${config.color}`}>{config.title}</p>
        <p className={`${sizeConfig.description} text-gray-600 truncate`}>{config.description}</p>
      </div>
    </div>
  );

  if (showLink && config.link) {
    return (
      <Link href={config.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// Compact inline badge for use near buttons
export function SecurityBadgeInline({
  type,
  className = '',
}: {
  type: SecurityBadgeType;
  className?: string;
}) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${config.color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.title}</span>
    </span>
  );
}

// Group of security badges for landing pages
interface SecurityBadgeGroupProps {
  badges?: SecurityBadgeType[];
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLinks?: boolean;
  className?: string;
}

export function SecurityBadgeGroup({
  badges = ['secure-payment', 'anonymous', 'refund-policy'],
  size = 'sm',
  layout = 'horizontal',
  showLinks = true,
  className = '',
}: SecurityBadgeGroupProps) {
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 md:grid-cols-3 gap-2',
  };

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {badges.map((badge) => (
        <SecurityBadge key={badge} type={badge} size={size} showLink={showLinks} />
      ))}
    </div>
  );
}

// Trust strip for near payment buttons
export function PaymentTrustStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 py-3 ${className}`}>
      <SecurityBadgeInline type="secure-payment" />
      <span className="text-gray-300">|</span>
      <SecurityBadgeInline type="refund-policy" />
      <span className="text-gray-300">|</span>
      <SecurityBadgeInline type="data-protected" />
    </div>
  );
}

// Privacy callout for sensitive areas
export function PrivacyCallout({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-900 mb-1">Your Privacy is Protected</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
              Your identity is never revealed to judges
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
              Submissions are encrypted and auto-deleted after 30 days
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
              We never sell your data to third parties
            </li>
          </ul>
          <Link
            href="/legal/privacy"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 mt-2"
          >
            <FileText className="h-3.5 w-3.5" />
            Read our Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
