'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, MessageSquare, X, Sparkles, ArrowRight, Users, Star } from 'lucide-react';

interface CrossRolePromptProps {
  currentRole: 'seeker' | 'judge';
  userId: string;
  className?: string;
  dismissible?: boolean;
  variant?: 'card' | 'banner' | 'inline';
}

export function CrossRolePrompt({
  currentRole,
  userId,
  className = '',
  dismissible = true,
  variant = 'card'
}: CrossRolePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hasTriedOtherRole, setHasTriedOtherRole] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal and role history
    if (typeof window !== 'undefined') {
      const dismissKey = `cross_role_${currentRole}_dismissed_${userId}`;
      const dismissed = localStorage.getItem(dismissKey);
      if (dismissed) {
        const dismissedAt = new Date(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          setDismissed(true);
        }
      }

      // Check if user has tried the other role
      const roleHistory = localStorage.getItem(`role_history_${userId}`);
      if (roleHistory) {
        const history = JSON.parse(roleHistory);
        setHasTriedOtherRole(
          currentRole === 'seeker' ? history.hasJudged : history.hasSubmitted
        );
      }
    }
  }, [currentRole, userId]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      const dismissKey = `cross_role_${currentRole}_dismissed_${userId}`;
      localStorage.setItem(dismissKey, new Date().toISOString());
    }
  };

  if (dismissed || hasTriedOtherRole) return null;

  const content = {
    seeker: {
      title: 'Earn Credits by Helping Others',
      description: 'Give feedback to other users and earn free credits. Most users complete 3 reviews in under 10 minutes.',
      cta: 'Start Earning',
      href: '/feed',
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      stats: [
        { label: '3 reviews', sublabel: '= 1 credit' },
        { label: '~10 min', sublabel: 'to earn' },
      ],
    },
    judge: {
      title: 'Need Feedback Yourself?',
      description: 'Get honest opinions on your dating profile, career decisions, or style from real people.',
      cta: 'Get Feedback',
      href: '/submit',
      icon: MessageSquare,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      stats: [
        { label: '3+ reviews', sublabel: 'per credit' },
        { label: '< 2 hrs', sublabel: 'delivery' },
      ],
    },
  };

  const c = content[currentRole];
  const Icon = c.icon;

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r ${c.bgGradient} border ${c.borderColor} rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${c.gradient} flex items-center justify-center flex-shrink-0`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{c.title}</p>
              <p className="text-xs text-gray-600">{c.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={c.href}
              className={`px-4 py-2 bg-gradient-to-r ${c.gradient} text-white text-sm font-medium rounded-lg hover:shadow-md transition flex items-center gap-1 min-h-[36px]`}
            >
              {c.cta}
              <ArrowRight className="h-3 w-3" />
            </Link>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        href={c.href}
        className={`flex items-center gap-3 p-3 bg-gradient-to-r ${c.bgGradient} border ${c.borderColor} rounded-lg hover:shadow-md transition group ${className}`}
      >
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${c.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{c.title}</p>
          <p className="text-xs text-gray-600 truncate">{c.description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </Link>
    );
  }

  // Default: card variant
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className={`bg-gradient-to-r ${c.bgGradient} p-4 border-b ${c.borderColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.gradient} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.description}</p>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="flex items-center justify-around mb-4">
          {c.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-lg font-bold text-gray-900">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.sublabel}</p>
            </div>
          ))}
        </div>

        <Link
          href={c.href}
          className={`block w-full py-3 bg-gradient-to-r ${c.gradient} text-white text-center font-semibold rounded-lg hover:shadow-lg transition min-h-[48px]`}
        >
          <span className="flex items-center justify-center gap-2">
            {c.cta}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

// Compact version for sidebars
export function CrossRolePromptCompact({
  currentRole,
  className = ''
}: {
  currentRole: 'seeker' | 'judge';
  className?: string;
}) {
  const content = {
    seeker: {
      text: 'Earn free credits',
      href: '/feed',
      icon: DollarSign,
      color: 'text-green-600 hover:text-green-700',
      bg: 'bg-green-50 hover:bg-green-100',
    },
    judge: {
      text: 'Get feedback',
      href: '/submit',
      icon: MessageSquare,
      color: 'text-indigo-600 hover:text-indigo-700',
      bg: 'bg-indigo-50 hover:bg-indigo-100',
    },
  };

  const c = content[currentRole];
  const Icon = c.icon;

  return (
    <Link
      href={c.href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.bg} ${c.color} transition text-sm font-medium ${className}`}
    >
      <Icon className="h-4 w-4" />
      <span>{c.text}</span>
    </Link>
  );
}
