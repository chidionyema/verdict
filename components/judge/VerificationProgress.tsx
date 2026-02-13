'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  Circle,
  ChevronRight,
  Award,
  Linkedin,
  User,
  Mail,
  Sparkles,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { VerificationStatus, VerificationStep, VerificationTier } from '@/lib/judge/verification';

interface VerificationProgressProps {
  userId: string;
  variant?: 'full' | 'compact' | 'card';
  showCTA?: boolean;
  onVerificationChange?: (status: VerificationStatus) => void;
}

const TIER_CONFIG: Record<VerificationTier, {
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  none: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Unverified',
  },
  email_verified: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Email Verified',
  },
  profile_complete: {
    icon: User,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Profile Complete',
  },
  linkedin_connected: {
    icon: Linkedin,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    label: 'LinkedIn Connected',
  },
  linkedin_verified: {
    icon: Shield,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'LinkedIn Verified',
  },
  expert_verified: {
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Expert Verified',
  },
};

const STEP_ICONS: Record<string, typeof Shield> = {
  email: Mail,
  profile: User,
  linkedin_connect: Linkedin,
  linkedin_verify: Shield,
  expert: Award,
};

export function VerificationProgress({
  userId,
  variant = 'full',
  showCTA = true,
  onVerificationChange,
}: VerificationProgressProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/judge/verification-status`);
      if (!res.ok) {
        throw new Error('Failed to load verification status');
      }

      const data = await res.json();
      setStatus(data);
      onVerificationChange?.(data);
    } catch (err) {
      console.error('Error loading verification status:', err);
      setError('Unable to load verification status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${variant === 'compact' ? 'h-8' : 'h-32'} bg-gray-100 rounded-xl`} />
    );
  }

  if (error || !status) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded-xl">
        {error || 'Unable to load verification status'}
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[status.currentTier];
  const TierIcon = tierConfig.icon;

  // Compact variant - just shows current tier badge
  if (variant === 'compact') {
    return (
      <Link
        href="/judge/verify"
        className={`inline-flex items-center gap-2 px-3 py-1.5 ${tierConfig.bgColor} ${tierConfig.borderColor} border rounded-full hover:brightness-95 transition`}
      >
        <TierIcon className={`h-4 w-4 ${tierConfig.color}`} />
        <span className={`text-sm font-medium ${tierConfig.color}`}>
          {tierConfig.label}
        </span>
        {status.nextStep && (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
      </Link>
    );
  }

  // Card variant - shows current tier with progress hint
  if (variant === 'card') {
    return (
      <div className={`${tierConfig.bgColor} ${tierConfig.borderColor} border rounded-xl p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${tierConfig.bgColor} border-2 ${tierConfig.borderColor} flex items-center justify-center`}>
              <TierIcon className={`h-5 w-5 ${tierConfig.color}`} />
            </div>
            <div>
              <p className={`font-semibold ${tierConfig.color}`}>{tierConfig.label}</p>
              <p className="text-xs text-gray-600">
                {status.earnMultiplier > 1
                  ? `${((status.earnMultiplier - 1) * 100).toFixed(0)}% bonus earnings`
                  : 'Base earnings rate'}
              </p>
            </div>
          </div>
          {status.nextStep && showCTA && (
            <Link
              href={status.nextStep.actionUrl || '/judge/verify'}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {status.nextStep.actionLabel || 'Level Up'}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Verification Progress</span>
            <span>{status.tierIndex}/5 tiers</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(status.tierIndex / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full variant - shows all steps
  const allSteps: VerificationStep[] = [
    {
      id: 'email',
      tier: 'email_verified',
      title: 'Verify Email',
      description: 'Confirm your email address',
      completed: status.tierIndex >= 1,
      actionUrl: '/auth/verify-email',
      actionLabel: 'Verify Email',
    },
    {
      id: 'profile',
      tier: 'profile_complete',
      title: 'Complete Profile',
      description: 'Add photo, bio, and expertise area',
      completed: status.tierIndex >= 2,
      actionUrl: '/account',
      actionLabel: 'Complete Profile',
    },
    {
      id: 'linkedin_connect',
      tier: 'linkedin_connected',
      title: 'Connect LinkedIn',
      description: 'Add your LinkedIn profile URL',
      completed: status.tierIndex >= 3,
      actionUrl: '/judge/verify',
      actionLabel: 'Connect LinkedIn',
    },
    {
      id: 'linkedin_verify',
      tier: 'linkedin_verified',
      title: 'LinkedIn Verified',
      description: 'Verified professional profile',
      completed: status.tierIndex >= 4,
      actionUrl: '/judge/verify',
      actionLabel: 'Verify Profile',
    },
    {
      id: 'expert',
      tier: 'expert_verified',
      title: 'Expert Verification',
      description: 'Prove domain expertise with credentials',
      completed: status.tierIndex >= 5,
      actionUrl: '/judge/become-expert',
      actionLabel: 'Apply for Expert',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`${tierConfig.bgColor} ${tierConfig.borderColor} border-b p-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
            <TierIcon className={`h-7 w-7 ${tierConfig.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{tierConfig.label}</h3>
            <p className="text-sm text-gray-600">
              {status.earnMultiplier > 1
                ? `${((status.earnMultiplier - 1) * 100).toFixed(0)}% bonus on all earnings`
                : 'Complete steps to unlock bonuses'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-gray-900">{status.tierIndex}/5</p>
            <p className="text-xs text-gray-500">Tiers Complete</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-6">
        <div className="space-y-4">
          {allSteps.map((step, index) => {
            const StepIcon = STEP_ICONS[step.id] || Shield;
            const isNextStep = status.nextStep?.id === step.id;
            const isLocked = index > status.tierIndex && !isNextStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  step.completed
                    ? 'bg-green-50 border border-green-200'
                    : isNextStep
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Step indicator */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.completed
                      ? 'bg-green-600 text-white'
                      : isNextStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      step.completed
                        ? 'text-green-900'
                        : isNextStep
                        ? 'text-indigo-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className={`text-sm ${
                    step.completed
                      ? 'text-green-700'
                      : isNextStep
                      ? 'text-indigo-700'
                      : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                {step.completed ? (
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Done
                  </span>
                ) : isNextStep && showCTA ? (
                  <Link
                    href={step.actionUrl || '#'}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shrink-0"
                  >
                    {step.actionLabel}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">
                    {isLocked ? 'Locked' : 'Pending'}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Benefits preview */}
        {status.tierIndex < 5 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Unlock at Expert Level
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>50% bonus earnings</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="h-4 w-4 text-purple-600" />
                <span>Expert badge</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-purple-600" />
                <span>Priority queue access</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Expert-tier requests</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
