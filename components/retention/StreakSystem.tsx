'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Calendar,
  Shield,
  Trophy,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  Star,
  Gift
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  judgmentsToday: number;
  totalJudgments: number;
  streakProtectionAvailable: boolean;
  streakProtectionUsedThisWeek: boolean;
  activityHistory: { [date: string]: number };
}

interface StreakMilestone {
  days: number;
  title: string;
  reward: string;
  icon: string;
  achieved: boolean;
}

const MILESTONES: Omit<StreakMilestone, 'achieved'>[] = [
  { days: 3, title: 'Getting Started', reward: '+1 credit', icon: '🌱' },
  { days: 7, title: 'Week Warrior', reward: '+3 credits', icon: '⚡' },
  { days: 14, title: 'Dedicated Judge', reward: '+5 credits', icon: '💪' },
  { days: 30, title: 'Month Master', reward: '+10 credits + badge', icon: '🔥' },
  { days: 60, title: 'Elite Judge', reward: '+20 credits + title', icon: '👑' },
  { days: 100, title: 'Legend', reward: '+50 credits + VIP', icon: '🏆' },
];

interface StreakSystemProps {
  userId: string;
  streakData?: StreakData;
  compact?: boolean;
  onCheckIn?: () => void;
}

export function StreakSystem({ userId, streakData: initialData, compact = false, onCheckIn }: StreakSystemProps) {
  const [streakData, setStreakData] = useState<StreakData>(initialData || {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    judgmentsToday: 0,
    totalJudgments: 0,
    streakProtectionAvailable: true,
    streakProtectionUsedThisWeek: false,
    activityHistory: {},
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMilestones, setShowMilestones] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);

  // Calculate if streak is at risk
  const isStreakAtRisk = () => {
    if (!streakData.lastActivityDate) return false;
    const lastActivity = new Date(streakData.lastActivityDate);
    const today = new Date();
    const diffHours = (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    return diffHours > 20 && diffHours < 24 && streakData.currentStreak > 0;
  };

  // Get milestones with achievement status
  const milestones = MILESTONES.map(m => ({
    ...m,
    achieved: streakData.longestStreak >= m.days,
  }));

  // Get next milestone
  const nextMilestone = milestones.find(m => !m.achieved);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; count: number; isToday: boolean; isFuture: boolean }[] = [];

    // Add padding for first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, count: 0, isToday: false, isFuture: false });
    }

    // Add days of month
    const today = new Date();
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const count = streakData.activityHistory[dateStr] || 0;
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;
      days.push({ date, count, isToday, isFuture });
    }

    return days;
  };

  // Use streak protection
  const useStreakProtection = () => {
    if (!streakData.streakProtectionAvailable || streakData.streakProtectionUsedThisWeek) {
      return;
    }
    // In real app, this would call an API
    setStreakData(prev => ({
      ...prev,
      streakProtectionUsedThisWeek: true,
    }));
    setShowProtectionModal(false);
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={streakData.currentStreak >= 3 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Flame className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="font-bold text-lg">{streakData.currentStreak} Day Streak</div>
              <div className="text-orange-100 text-sm">
                {nextMilestone
                  ? `${nextMilestone.days - streakData.currentStreak} days to ${nextMilestone.title}`
                  : 'Maximum streak achieved!'
                }
              </div>
            </div>
          </div>

          {isStreakAtRisk() && (
            <Badge className="bg-white/20 text-white animate-pulse">
              At Risk!
            </Badge>
          )}
        </div>

        {/* Mini progress bar */}
        {nextMilestone && (
          <div className="mt-3">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(streakData.currentStreak / nextMilestone.days) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Streak Card */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white rounded-3xl p-6 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-6xl">🔥</div>
          <div className="absolute bottom-4 left-4 text-4xl">⚡</div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={streakData.currentStreak >= 3 ? {
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"
                >
                  <Flame className="h-8 w-8" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-bold">{streakData.currentStreak}</h2>
                  <p className="text-orange-100">Day Streak</p>
                </div>
              </div>

              <div className="text-sm text-orange-100">
                Personal best: {streakData.longestStreak} days
              </div>
            </div>

            {/* Streak Protection Badge */}
            {streakData.streakProtectionAvailable && !streakData.streakProtectionUsedThisWeek && (
              <div
                onClick={() => setShowProtectionModal(true)}
                className="bg-white/20 rounded-xl p-3 cursor-pointer hover:bg-white/30 transition"
              >
                <Shield className="h-6 w-6 mb-1" />
                <span className="text-xs">Protected</span>
              </div>
            )}
          </div>

          {/* At Risk Warning */}
          {isStreakAtRisk() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/20 rounded-xl p-4 mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Your streak is at risk!</p>
                  <p className="text-sm text-orange-100">Complete a judgment today to keep it going</p>
                </div>
                <TouchButton
                  onClick={onCheckIn}
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  Judge Now
                </TouchButton>
              </div>
            </motion.div>
          )}

          {/* Today's Progress */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-100">Today's judgments</span>
              <span className="font-bold">{streakData.judgmentsToday}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(streakData.judgmentsToday * 10, 100)}%` }}
              />
            </div>
            <p className="text-xs text-orange-100 mt-2">
              {streakData.judgmentsToday === 0
                ? 'Complete 1 judgment to maintain your streak'
                : streakData.judgmentsToday < 10
                  ? `${10 - streakData.judgmentsToday} more for bonus credits`
                  : 'Daily bonus earned!'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Activity Calendar</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((day, idx) => {
            const intensity = Math.min(day.count / 5, 1);
            return (
              <div
                key={idx}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs relative
                  ${day.isToday ? 'ring-2 ring-indigo-500' : ''}
                  ${day.isFuture ? 'text-gray-300' : 'text-gray-700'}
                  ${day.count > 0 ? 'bg-orange-500 text-white' : 'bg-gray-50'}
                `}
                style={{
                  backgroundColor: day.count > 0 ? `rgba(249, 115, 22, ${0.3 + intensity * 0.7})` : undefined,
                }}
              >
                {day.date.getDate()}
                {day.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 text-white text-[8px] rounded-full flex items-center justify-center">
                    {day.count}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-50 rounded border" />
            <span>No activity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-300 rounded" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Streak Milestones
          </h3>
          <TouchButton
            variant="ghost"
            size="sm"
            onClick={() => setShowMilestones(!showMilestones)}
          >
            {showMilestones ? 'Show less' : 'View all'}
          </TouchButton>
        </div>

        <div className="space-y-3">
          {(showMilestones ? milestones : milestones.slice(0, 3)).map((milestone, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-4 p-3 rounded-xl transition ${
                milestone.achieved
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                milestone.achieved ? 'bg-amber-100' : 'bg-gray-200'
              }`}>
                {milestone.achieved ? milestone.icon : '🔒'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${milestone.achieved ? 'text-amber-900' : 'text-gray-700'}`}>
                    {milestone.title}
                  </span>
                  <Badge className={milestone.achieved ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}>
                    {milestone.days} days
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{milestone.reward}</p>
              </div>
              {milestone.achieved && (
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              )}
            </div>
          ))}
        </div>

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-900">
                Next: {nextMilestone.title}
              </span>
              <span className="text-sm text-indigo-600">
                {streakData.currentStreak}/{nextMilestone.days} days
              </span>
            </div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(streakData.currentStreak / nextMilestone.days) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              {nextMilestone.days - streakData.currentStreak} more days to unlock {nextMilestone.reward}
            </p>
          </div>
        )}
      </div>

      {/* Streak Protection Modal */}
      <AnimatePresence>
        {showProtectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProtectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Streak Protection</h3>
                <p className="text-gray-600">
                  Life happens! Use your weekly streak protection to maintain your streak even if you miss a day.
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-indigo-900 mb-2">How it works:</h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>One free protection per week</li>
                  <li>Automatically saves your streak if you miss a day</li>
                  <li>Resets every Monday</li>
                </ul>
              </div>

              {streakData.streakProtectionUsedThisWeek ? (
                <div className="text-center text-gray-600 mb-4">
                  <p>You've already used your protection this week.</p>
                  <p className="text-sm">It will reset next Monday.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 mb-4">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Protection available!</span>
                </div>
              )}

              <div className="flex gap-3">
                <TouchButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowProtectionModal(false)}
                >
                  Close
                </TouchButton>
                {!streakData.streakProtectionUsedThisWeek && (
                  <TouchButton
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={useStreakProtection}
                  >
                    Activate Now
                  </TouchButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact streak widget for dashboard/sidebar
export function StreakWidget({ userId, currentStreak, onCheckIn }: {
  userId: string;
  currentStreak: number;
  onCheckIn?: () => void;
}) {
  const isActive = currentStreak > 0;

  return (
    <div className={`rounded-xl p-4 ${
      isActive
        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
        : 'bg-gray-100 text-gray-600'
    }`}>
      <div className="flex items-center gap-3">
        <motion.div
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
        </motion.div>
        <div className="flex-1">
          <div className="font-bold">
            {isActive ? `${currentStreak} Day Streak` : 'Start a Streak'}
          </div>
          <div className={`text-sm ${isActive ? 'text-orange-100' : 'text-gray-500'}`}>
            {isActive ? 'Keep it going!' : 'Judge today to begin'}
          </div>
        </div>
        {!isActive && onCheckIn && (
          <TouchButton
            size="sm"
            onClick={onCheckIn}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Start
          </TouchButton>
        )}
      </div>
    </div>
  );
}
