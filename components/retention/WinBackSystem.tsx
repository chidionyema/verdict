'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Sparkles,
  TrendingUp,
  Gift,
  Bell,
  Users,
  ArrowRight,
  X,
  Clock,
  Star,
  Flame,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface UserActivity {
  lastActivityDate: string | null;
  lastRequestDate: string | null;
  lastJudgmentDate: string | null;
  totalRequests: number;
  totalJudgments: number;
  previousStreak: number;
}

interface WinBackSystemProps {
  userId: string;
  activity: UserActivity;
  recentActivity?: {
    newFeatures: string[];
    communityGrowth: number;
    pendingFeedback: number;
  };
  onDismiss?: () => void;
}

type InactivityLevel = 'active' | 'cooling' | 'inactive' | 'dormant' | 'churned';

function getInactivityLevel(lastActivityDate: string | null): InactivityLevel {
  if (!lastActivityDate) return 'churned';

  const daysSince = Math.floor(
    (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= 2) return 'active';
  if (daysSince <= 7) return 'cooling';
  if (daysSince <= 14) return 'inactive';
  if (daysSince <= 30) return 'dormant';
  return 'churned';
}

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function WinBackSystem({ userId, activity, recentActivity, onDismiss }: WinBackSystemProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const inactivityLevel = getInactivityLevel(activity.lastActivityDate);
  const daysSinceActivity = getDaysSince(activity.lastActivityDate);

  // Don't show for active users
  if (inactivityLevel === 'active' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`winback_dismissed_${userId}`, Date.now().toString());
    onDismiss?.();
  };

  // Check if we should show based on localStorage
  useEffect(() => {
    const lastDismissed = localStorage.getItem(`winback_dismissed_${userId}`);
    if (lastDismissed) {
      const daysSinceDismissed = Math.floor(
        (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      );
      // Only show again after 3 days
      if (daysSinceDismissed < 3) {
        setDismissed(true);
      }
    }
  }, [userId]);

  return (
    <AnimatePresence>
      {inactivityLevel === 'cooling' && (
        <CoolingMessage
          userId={userId}
          daysSince={daysSinceActivity}
          activity={activity}
          onDismiss={handleDismiss}
        />
      )}

      {inactivityLevel === 'inactive' && (
        <InactiveMessage
          userId={userId}
          daysSince={daysSinceActivity}
          activity={activity}
          recentActivity={recentActivity}
          onDismiss={handleDismiss}
        />
      )}

      {inactivityLevel === 'dormant' && (
        <DormantMessage
          userId={userId}
          daysSince={daysSinceActivity}
          activity={activity}
          recentActivity={recentActivity}
          onDismiss={handleDismiss}
        />
      )}

      {inactivityLevel === 'churned' && (
        <ChurnedMessage
          userId={userId}
          activity={activity}
          recentActivity={recentActivity}
          onDismiss={handleDismiss}
        />
      )}
    </AnimatePresence>
  );
}

// 3-7 days inactive - Gentle nudge
function CoolingMessage({ userId, daysSince, activity, onDismiss }: {
  userId: string;
  daysSince: number;
  activity: UserActivity;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Welcome back!</h3>
          <p className="text-sm text-gray-600 mb-3">
            It's been {daysSince} days since your last visit. The community has been active!
          </p>
          <div className="flex items-center gap-3">
            <Link href="/judge">
              <TouchButton size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Check new requests
              </TouchButton>
            </Link>
            <button
              onClick={onDismiss}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Remind me later
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// 7-14 days inactive - More personal message
function InactiveMessage({ userId, daysSince, activity, recentActivity, onDismiss }: {
  userId: string;
  daysSince: number;
  activity: UserActivity;
  recentActivity?: { newFeatures: string[]; communityGrowth: number; pendingFeedback: number };
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Heart className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">We've missed you!</h3>
          <p className="text-gray-600 mb-4">
            It's been {daysSince} days since you last visited. Here's what's been happening:
          </p>

          {/* What they're missing */}
          <div className="space-y-2 mb-4">
            {recentActivity?.pendingFeedback ? (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span>
                  <strong>{recentActivity.pendingFeedback}</strong> people are waiting for your feedback
                </span>
              </div>
            ) : null}

            {recentActivity?.communityGrowth ? (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>{recentActivity.communityGrowth}+</strong> new users joined the community
                </span>
              </div>
            ) : null}

            {activity.previousStreak > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>
                  Your <strong>{activity.previousStreak}-day streak</strong> is waiting to be rebuilt
                </span>
              </div>
            )}

            {recentActivity?.newFeatures?.length ? (
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>
                  New feature: <strong>{recentActivity.newFeatures[0]}</strong>
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/judge">
              <TouchButton className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Jump back in
              </TouchButton>
            </Link>
            <button
              onClick={onDismiss}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}

// 14-30 days inactive - Incentive offer
function DormantMessage({ userId, daysSince, activity, recentActivity, onDismiss }: {
  userId: string;
  daysSince: number;
  activity: UserActivity;
  recentActivity?: { newFeatures: string[]; communityGrowth: number; pendingFeedback: number };
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Welcome back gift!</h3>
            <p className="text-sm text-amber-700">Expires in 48 hours</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        It's been {daysSince} days! As a thank you for being part of our community,
        here's a special comeback bonus:
      </p>

      <div className="bg-white rounded-xl p-4 mb-4 border border-amber-200">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">+1</div>
            <div className="text-sm text-gray-600">Free Credit</div>
          </div>
          <div className="w-px h-12 bg-amber-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">2x</div>
            <div className="text-sm text-gray-600">Earnings Today</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/judge" className="flex-1">
          <TouchButton className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            Claim Your Bonus
            <ArrowRight className="h-4 w-4 ml-2" />
          </TouchButton>
        </Link>
        <button
          onClick={onDismiss}
          className="text-sm text-gray-500 hover:text-gray-700 px-3"
        >
          Skip
        </button>
      </div>

      {/* Urgency indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-amber-700">
        <Clock className="h-3 w-3" />
        <span>Limited time offer - expires soon</span>
      </div>
    </motion.div>
  );
}

// 30+ days inactive - Re-engagement with value proposition
function ChurnedMessage({ userId, activity, recentActivity, onDismiss }: {
  userId: string;
  activity: UserActivity;
  recentActivity?: { newFeatures: string[]; communityGrowth: number; pendingFeedback: number };
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Hero section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">A lot has changed!</h3>
            <p className="text-indigo-100">
              We've been busy improving Verdict just for you.
            </p>
          </div>
          <button onClick={onDismiss} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* What's new */}
        <h4 className="font-semibold text-gray-900 mb-3">Since you've been away:</h4>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Star className="h-5 w-5 text-green-600" />
            <span className="text-sm">New quality scoring system for better feedback</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm">Faster payouts with improved judge tiers</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm">
              {recentActivity?.communityGrowth || '5,000'}+ new community members
            </span>
          </div>
        </div>

        {/* Stats reminder */}
        {(activity.totalRequests > 0 || activity.totalJudgments > 0) && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Your Verdict history:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {activity.totalRequests > 0 && (
                <div>
                  <span className="text-2xl font-bold text-indigo-600">{activity.totalRequests}</span>
                  <span className="text-gray-600 ml-1">requests</span>
                </div>
              )}
              {activity.totalJudgments > 0 && (
                <div>
                  <span className="text-2xl font-bold text-green-600">{activity.totalJudgments}</span>
                  <span className="text-gray-600 ml-1">verdicts given</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href={activity.totalJudgments > activity.totalRequests ? '/judge' : '/submit'}>
          <TouchButton className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-3">
            <Sparkles className="h-4 w-4 mr-2" />
            Start Fresh
          </TouchButton>
        </Link>

        <p className="text-center text-xs text-gray-500">
          Your account and history are exactly as you left them
        </p>
      </div>
    </motion.div>
  );
}

// Compact banner version for dashboard
export function WinBackBanner({ userId, daysSinceActivity, onDismiss }: {
  userId: string;
  daysSinceActivity: number;
  onDismiss?: () => void;
}) {
  if (daysSinceActivity < 7) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5" />
          <span className="font-medium">Welcome back! We've missed you.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/judge">
            <TouchButton size="sm" className="bg-white/20 hover:bg-white/30 text-white">
              See what's new
            </TouchButton>
          </Link>
          {onDismiss && (
            <button onClick={onDismiss} className="text-white/60 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
