'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Mail,
  User,
  Linkedin,
  Award,
  Crown,
  Lock,
  Sparkles,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

interface JudgeJourneyProgressProps {
  currentTier: number;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  isLinkedInConnected: boolean;
  isLinkedInVerified: boolean;
  isExpertVerified: boolean;
  totalVerdicts: number;
  weeklyEarnings?: number;
  compact?: boolean;
}

const JOURNEY_STEPS = [
  {
    tier: 0,
    id: 'qualified',
    title: 'Qualified Judge',
    description: 'Completed onboarding quiz',
    icon: Check,
    multiplier: '1.0x',
    color: 'green',
    alwaysComplete: true,
  },
  {
    tier: 1,
    id: 'email',
    title: 'Email Verified',
    description: 'Confirm your email address',
    icon: Mail,
    multiplier: '1.0x',
    color: 'blue',
    action: { label: 'Verify Email', href: '/settings' },
  },
  {
    tier: 2,
    id: 'profile',
    title: 'Profile Complete',
    description: 'Add demographics & bio',
    icon: User,
    multiplier: '1.0x',
    color: 'purple',
    action: { label: 'Complete Profile', href: '/judge/demographics' },
  },
  {
    tier: 3,
    id: 'linkedin_connected',
    title: 'LinkedIn Connected',
    description: 'Connect your LinkedIn account',
    icon: Linkedin,
    multiplier: '1.15x',
    bonusPercent: 15,
    color: 'indigo',
    action: { label: 'Connect LinkedIn', href: '/judge/verify' },
  },
  {
    tier: 4,
    id: 'linkedin_verified',
    title: 'LinkedIn Verified',
    description: '500+ connections, 2+ years',
    icon: Award,
    multiplier: '1.25x',
    bonusPercent: 25,
    color: 'amber',
    action: { label: 'Verify Status', href: '/judge/verify' },
  },
  {
    tier: 5,
    id: 'expert',
    title: 'Expert Judge',
    description: 'Domain expertise verified',
    icon: Crown,
    multiplier: '1.5x',
    bonusPercent: 50,
    color: 'rose',
    action: { label: 'Apply for Expert', href: '/judge/verify' },
    requiresPrevious: true,
  },
];

export function JudgeJourneyProgress({
  currentTier: _currentTier,
  isEmailVerified,
  isProfileComplete,
  isLinkedInConnected,
  isLinkedInVerified,
  isExpertVerified,
  totalVerdicts,
  weeklyEarnings = 0,
  compact = false,
}: JudgeJourneyProgressProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const getStepStatus = (step: typeof JOURNEY_STEPS[0]) => {
    if (step.alwaysComplete) return 'complete';

    switch (step.id) {
      case 'email':
        return isEmailVerified ? 'complete' : 'available';
      case 'profile':
        return isProfileComplete ? 'complete' : isEmailVerified ? 'available' : 'locked';
      case 'linkedin_connected':
        return isLinkedInConnected ? 'complete' : isProfileComplete ? 'available' : 'locked';
      case 'linkedin_verified':
        return isLinkedInVerified ? 'complete' : isLinkedInConnected ? 'available' : 'locked';
      case 'expert':
        return isExpertVerified ? 'complete' : isLinkedInVerified ? 'available' : 'locked';
      default:
        return 'locked';
    }
  };

  const completedSteps = JOURNEY_STEPS.filter(s => getStepStatus(s) === 'complete').length;
  const nextStep = JOURNEY_STEPS.find(s => getStepStatus(s) === 'available');
  const progressPercent = (completedSteps / JOURNEY_STEPS.length) * 100;

  // Calculate potential earnings increase
  const currentMultiplier = isExpertVerified ? 1.5 : isLinkedInVerified ? 1.25 : isLinkedInConnected ? 1.15 : 1.0;
  const nextMultiplier = nextStep?.bonusPercent ? 1 + (nextStep.bonusPercent / 100) : currentMultiplier;
  const potentialWeeklyIncrease = weeklyEarnings > 0 ? weeklyEarnings * (nextMultiplier - currentMultiplier) : 0;

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl hover:border-indigo-200 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {completedSteps}/{JOURNEY_STEPS.length} steps complete
              </div>
              {nextStep && (
                <div className="text-sm text-indigo-600">
                  Next: {nextStep.title} (+{nextStep.bonusPercent || 0}%)
                </div>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Your Judge Journey</h3>
              <p className="text-sm text-gray-600">
                {completedSteps}/{JOURNEY_STEPS.length} steps • {currentMultiplier}x earnings
              </p>
            </div>
          </div>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-5 w-5 rotate-90" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3">
        {JOURNEY_STEPS.map((step) => {
          const status = getStepStatus(step);
          const Icon = step.icon;
          const isComplete = status === 'complete';
          const isAvailable = status === 'available';
          const isLocked = status === 'locked';

          return (
            <div
              key={step.id}
              className={`relative flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isComplete
                  ? 'bg-green-50'
                  : isAvailable
                  ? 'bg-indigo-50 border-2 border-indigo-200'
                  : 'bg-gray-50 opacity-60'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete
                    ? 'bg-green-500'
                    : isAvailable
                    ? 'bg-indigo-500'
                    : 'bg-gray-300'
                }`}
              >
                {isComplete ? (
                  <Check className="h-5 w-5 text-white" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4 text-gray-500" />
                ) : (
                  <Icon className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isComplete
                        ? 'text-green-900'
                        : isAvailable
                        ? 'text-indigo-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.bonusPercent && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isComplete
                          ? 'bg-green-200 text-green-700'
                          : 'bg-indigo-200 text-indigo-700'
                      }`}
                    >
                      +{step.bonusPercent}%
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    isComplete
                      ? 'text-green-700'
                      : isAvailable
                      ? 'text-indigo-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </p>

                {/* Action button for available step */}
                {isAvailable && step.action && (
                  <Link
                    href={step.action.href}
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {step.action.label}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Multiplier badge */}
              <div
                className={`text-sm font-semibold ${
                  isComplete ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.multiplier}
              </div>
            </div>
          );
        })}
      </div>

      {/* Earnings Impact */}
      {nextStep && nextStep.bonusPercent && weeklyEarnings > 0 && (
        <div className="px-4 pb-4">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">
                  Complete &ldquo;{nextStep.title}&rdquo; to earn
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +${potentialWeeklyIncrease.toFixed(2)}/week
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="px-4 pb-4 flex items-center justify-between text-sm text-gray-500">
        <span>{totalVerdicts} verdicts completed</span>
        <span>Current rate: {currentMultiplier}x</span>
      </div>
    </div>
  );
}
