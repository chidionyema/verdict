'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  Circle,
  ArrowRight,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Star,
  Crown,
  Award,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

// Profile Completion Component
interface ProfileField {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

interface ProfileCompletionProps {
  userId: string;
  profile: {
    display_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    bio?: string;
    location?: string;
    occupation?: string;
  };
  compact?: boolean;
  onFieldClick?: (fieldId: string) => void;
}

export function ProfileCompletion({ userId, profile, compact = false, onFieldClick }: ProfileCompletionProps) {
  const fields: ProfileField[] = [
    {
      id: 'display_name',
      label: 'Display name',
      icon: User,
      completed: !!profile.display_name,
      priority: 'high',
    },
    {
      id: 'avatar',
      label: 'Profile photo',
      icon: Camera,
      completed: !!profile.avatar_url,
      priority: 'high',
    },
    {
      id: 'email',
      label: 'Verified email',
      icon: Mail,
      completed: !!profile.email_verified,
      priority: 'high',
    },
    {
      id: 'bio',
      label: 'Bio/About',
      icon: Briefcase,
      completed: !!profile.bio,
      priority: 'medium',
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      completed: !!profile.location,
      priority: 'low',
    },
  ];

  const completedCount = fields.filter(f => f.completed).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Find next incomplete field
  const nextIncomplete = fields.find(f => !f.completed && f.priority === 'high')
    || fields.find(f => !f.completed);

  if (percentage === 100 && compact) {
    return null; // Don't show if complete in compact mode
  }

  if (compact) {
    return (
      <Link href="/account">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-900">Profile Completion</span>
            <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
          </div>
          <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {nextIncomplete && (
            <div className="flex items-center gap-2 text-xs text-indigo-700">
              <nextIncomplete.icon className="h-3 w-3" />
              <span>Add {nextIncomplete.label.toLowerCase()} to continue</span>
              <ArrowRight className="h-3 w-3 ml-auto" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
        <Badge className={percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}>
          {percentage}% complete
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
        <motion.div
          className={`h-full rounded-full ${
            percentage === 100
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Field checklist */}
      <div className="space-y-3">
        {fields.map(field => (
          <div
            key={field.id}
            onClick={() => !field.completed && onFieldClick?.(field.id)}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              field.completed
                ? 'bg-green-50'
                : 'bg-gray-50 hover:bg-indigo-50 cursor-pointer'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              field.completed ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              {field.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <field.icon className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <span className={field.completed ? 'text-green-700' : 'text-gray-700'}>
              {field.label}
            </span>
            {!field.completed && field.priority === 'high' && (
              <Badge className="ml-auto bg-amber-100 text-amber-800 text-xs">
                Recommended
              </Badge>
            )}
            {!field.completed && (
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            )}
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-800">
            Complete your profile to build trust with the community and get better feedback.
          </p>
        </div>
      )}
    </div>
  );
}

// Judge Tier Progress Component
interface JudgeTierProgressProps {
  currentTier: 'rookie' | 'judge' | 'magistrate' | 'supreme_court';
  totalJudgments: number;
  consensusRate: number;
  compact?: boolean;
}

const TIER_CONFIG = {
  rookie: {
    name: 'Rookie',
    icon: '🥉',
    color: 'from-gray-400 to-gray-500',
    next: 'judge',
    requirements: { judgments: 25, consensus: 55 },
  },
  judge: {
    name: 'Judge',
    icon: '⚖️',
    color: 'from-blue-500 to-indigo-500',
    next: 'magistrate',
    requirements: { judgments: 100, consensus: 70 },
  },
  magistrate: {
    name: 'Magistrate',
    icon: '👨‍⚖️',
    color: 'from-purple-500 to-indigo-600',
    next: 'supreme_court',
    requirements: { judgments: 500, consensus: 85 },
  },
  supreme_court: {
    name: 'Supreme Court',
    icon: '👩‍⚖️',
    color: 'from-yellow-500 to-amber-500',
    next: null,
    requirements: { judgments: 999999, consensus: 100 },
  },
};

export function JudgeTierProgress({ currentTier, totalJudgments, consensusRate, compact = false }: JudgeTierProgressProps) {
  const tier = TIER_CONFIG[currentTier];
  const nextTierKey = tier.next as keyof typeof TIER_CONFIG | null;
  const nextTier = nextTierKey ? TIER_CONFIG[nextTierKey] : null;

  // Calculate progress
  const judgmentProgress = nextTier
    ? Math.min((totalJudgments / nextTier.requirements.judgments) * 100, 100)
    : 100;
  const consensusProgress = nextTier
    ? Math.min((consensusRate / nextTier.requirements.consensus) * 100, 100)
    : 100;

  if (compact) {
    return (
      <Link href="/judge/performance">
        <div className={`bg-gradient-to-r ${tier.color} text-white rounded-xl p-4 hover:shadow-lg transition cursor-pointer`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tier.icon}</span>
              <span className="font-bold">{tier.name}</span>
            </div>
            {nextTier && (
              <Badge className="bg-white/20 text-white">
                {Math.round(Math.min(judgmentProgress, consensusProgress))}% to next
              </Badge>
            )}
          </div>
          {nextTier && (
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(judgmentProgress, consensusProgress)}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tier.color} text-white p-6`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            {tier.icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{tier.name}</h3>
            <p className="text-white/80">Current Judge Tier</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {nextTier ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Progress to {nextTier.name}</h4>
            </div>

            {/* Judgments progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Judgments</span>
                <span className="font-medium text-gray-900">
                  {totalJudgments} / {nextTier.requirements.judgments}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${judgmentProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Consensus progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Consensus Rate</span>
                <span className="font-medium text-gray-900">
                  {consensusRate}% / {nextTier.requirements.consensus}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${consensusProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* What you need */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-800">
                <strong>To reach {nextTier.name}:</strong>
              </p>
              <ul className="text-sm text-indigo-700 mt-2 space-y-1">
                {totalJudgments < nextTier.requirements.judgments && (
                  <li>Complete {nextTier.requirements.judgments - totalJudgments} more judgments</li>
                )}
                {consensusRate < nextTier.requirements.consensus && (
                  <li>Increase consensus rate by {(nextTier.requirements.consensus - consensusRate).toFixed(1)}%</li>
                )}
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Crown className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-2">Maximum Tier Achieved!</h4>
            <p className="text-gray-600">
              You've reached the highest judge tier. Keep judging to maintain your status!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Weekly Credits Progress
interface WeeklyCreditsProgressProps {
  creditsEarned: number;
  weeklyGoal: number;
  verdictCount: number;
  compact?: boolean;
}

export function WeeklyCreditsProgress({ creditsEarned, weeklyGoal, verdictCount, compact = false }: WeeklyCreditsProgressProps) {
  const percentage = Math.min((creditsEarned / weeklyGoal) * 100, 100);
  const isGoalMet = creditsEarned >= weeklyGoal;

  if (compact) {
    return (
      <div className={`rounded-xl p-4 ${isGoalMet ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">This Week</span>
          <span className={`font-bold ${isGoalMet ? 'text-green-600' : 'text-indigo-600'}`}>
            {creditsEarned.toFixed(1)} credits
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isGoalMet ? 'bg-green-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Weekly Progress
        </h3>
        {isGoalMet && (
          <Badge className="bg-green-100 text-green-800">Goal Met!</Badge>
        )}
      </div>

      {/* Credits earned */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Credits earned this week</span>
          <span className="font-medium">{creditsEarned.toFixed(1)} / {weeklyGoal}</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isGoalMet
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{verdictCount}</div>
          <div className="text-sm text-gray-500">Verdicts given</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            ${(creditsEarned * 0.75).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Est. earnings</div>
        </div>
      </div>

      {!isGoalMet && (
        <div className="mt-4">
          <Link href="/judge">
            <TouchButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Zap className="h-4 w-4 mr-2" />
              {weeklyGoal - creditsEarned > 0
                ? `Earn ${(weeklyGoal - creditsEarned).toFixed(1)} more to hit your goal`
                : 'Keep earning!'
              }
            </TouchButton>
          </Link>
        </div>
      )}
    </div>
  );
}

// Request Completion Progress
interface RequestProgressProps {
  receivedCount: number;
  targetCount: number;
  status: 'open' | 'in_progress' | 'closed';
  compact?: boolean;
}

export function RequestProgress({ receivedCount, targetCount, status, compact = false }: RequestProgressProps) {
  const percentage = (receivedCount / targetCount) * 100;
  const isComplete = receivedCount >= targetCount;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isComplete ? 'bg-green-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">
          {receivedCount}/{targetCount}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${isComplete ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">Verdicts Progress</span>
        <Badge className={isComplete ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}>
          {isComplete ? 'Complete' : `${receivedCount}/${targetCount}`}
        </Badge>
      </div>
      <div className="h-3 bg-white rounded-full overflow-hidden border">
        <motion.div
          className={`h-full rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {!isComplete && (
        <p className="text-xs text-gray-500 mt-2">
          {targetCount - receivedCount} more verdict{targetCount - receivedCount !== 1 ? 's' : ''} to go
        </p>
      )}
    </div>
  );
}
