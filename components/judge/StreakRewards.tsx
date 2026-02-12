'use client';

import { motion } from 'framer-motion';
import { Flame, Gift, Zap, Crown, Star, Lock } from 'lucide-react';

interface StreakRewardsProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

const STREAK_MILESTONES = [
  {
    days: 3,
    reward: '+10% bonus',
    icon: Flame,
    color: 'orange',
    description: 'Keep the momentum going!',
  },
  {
    days: 7,
    reward: '+20% bonus',
    icon: Zap,
    color: 'yellow',
    description: 'One week strong!',
  },
  {
    days: 14,
    reward: '+30% bonus + badge',
    icon: Star,
    color: 'blue',
    description: 'Two weeks of dedication!',
  },
  {
    days: 30,
    reward: '+50% bonus + exclusive access',
    icon: Crown,
    color: 'purple',
    description: 'Legendary consistency!',
  },
];

export function StreakRewards({ currentStreak, longestStreak, className = '' }: StreakRewardsProps) {
  // Find current milestone and next milestone
  const currentMilestone = STREAK_MILESTONES.filter(m => currentStreak >= m.days).pop();
  const nextMilestone = STREAK_MILESTONES.find(m => currentStreak < m.days);

  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-500',
      progress: 'bg-orange-500',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      progress: 'bg-yellow-500',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      progress: 'bg-blue-500',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-500',
      progress: 'bg-purple-500',
    },
  };

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Streak Rewards</h3>
            <p className="text-xs text-gray-500">Judge daily to unlock bonuses</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
          <p className="text-xs text-gray-500">day streak</p>
        </div>
      </div>

      {/* Current reward status */}
      {currentMilestone && (
        <div className={`${colorClasses[currentMilestone.color as keyof typeof colorClasses].bg} ${colorClasses[currentMilestone.color as keyof typeof colorClasses].border} border rounded-xl p-3 mb-4`}>
          <div className="flex items-center gap-2">
            <currentMilestone.icon className={`h-5 w-5 ${colorClasses[currentMilestone.color as keyof typeof colorClasses].icon}`} />
            <span className="font-semibold text-gray-900">Active: {currentMilestone.reward}</span>
          </div>
        </div>
      )}

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Next: {nextMilestone.reward}</span>
            <span className="text-gray-900 font-medium">{nextMilestone.days - currentStreak} days to go</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStreak / nextMilestone.days) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full ${colorClasses[nextMilestone.color as keyof typeof colorClasses].progress} rounded-full`}
            />
          </div>
        </div>
      )}

      {/* Milestone timeline */}
      <div className="space-y-2">
        {STREAK_MILESTONES.map((milestone, index) => {
          const achieved = currentStreak >= milestone.days;
          const colors = colorClasses[milestone.color as keyof typeof colorClasses];
          const Icon = milestone.icon;

          return (
            <div
              key={milestone.days}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                achieved ? colors.bg : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                achieved ? colors.bg + ' ' + colors.icon : 'bg-gray-100 text-gray-400'
              }`}>
                {achieved ? <Icon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${achieved ? 'text-gray-900' : 'text-gray-500'}`}>
                  {milestone.days}-day streak
                </p>
                <p className={`text-xs ${achieved ? colors.icon : 'text-gray-400'}`}>
                  {milestone.reward}
                </p>
              </div>
              {achieved && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Longest streak */}
      {longestStreak > currentStreak && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Your best: <span className="font-semibold text-gray-700">{longestStreak} days</span>
          </p>
        </div>
      )}
    </div>
  );
}
