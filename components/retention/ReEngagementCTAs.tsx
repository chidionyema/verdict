'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Sparkles,
  MessageSquare,
  Coins,
  Trophy,
  TrendingUp,
  Clock,
  Star,
  Gift,
  X,
  Plus,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { TouchButton } from '@/components/ui/touch-button';

// After viewing results CTA
interface AfterResultsCTAProps {
  requestId: string;
  averageRating?: number;
  feedbackCount: number;
  onDismiss?: () => void;
}

export function AfterResultsCTA({ requestId, averageRating, feedbackCount, onDismiss }: AfterResultsCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Got your verdict! What's next?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {averageRating && averageRating >= 4
              ? "Great feedback! Want to get more perspectives on something else?"
              : "Every decision deserves honest feedback. Submit another request!"
            }
          </p>
          <div className="flex items-center gap-3">
            <Link href="/submit">
              <TouchButton className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Submit Another Request
              </TouchButton>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// After judging CTA - Momentum keeper
interface AfterJudgingCTAProps {
  verdictsToday: number;
  currentStreak: number;
  creditsEarnedToday: number;
  remainingForBonus?: number;
  onJudgeMore?: () => void;
  onDismiss?: () => void;
}

export function AfterJudgingCTA({
  verdictsToday,
  currentStreak,
  creditsEarnedToday,
  remainingForBonus = 2,
  onJudgeMore,
  onDismiss,
}: AfterJudgingCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Different messages based on progress
  const getMessage = () => {
    if (verdictsToday === 1) {
      return {
        title: "Great start!",
        message: "You've completed your first verdict today. Keep going to earn bonus credits!",
        urgent: false,
      };
    }
    if (remainingForBonus <= 2) {
      return {
        title: "Almost there!",
        message: `Just ${remainingForBonus} more verdict${remainingForBonus !== 1 ? 's' : ''} to earn your daily bonus!`,
        urgent: true,
      };
    }
    if (currentStreak > 0 && currentStreak % 7 === 6) {
      return {
        title: "Streak milestone incoming!",
        message: "One more day and you'll hit your weekly streak bonus!",
        urgent: true,
      };
    }
    return {
      title: "Keep the momentum!",
      message: `You've earned ${creditsEarnedToday.toFixed(1)} credits today. The queue has more waiting!`,
      urgent: false,
    };
  };

  const { title, message, urgent } = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl p-5 ${
        urgent
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          urgent ? 'bg-amber-100' : 'bg-green-100'
        }`}>
          {urgent ? (
            <Zap className="h-6 w-6 text-amber-600" />
          ) : (
            <TrendingUp className="h-6 w-6 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{message}</p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{verdictsToday} today</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              <span>{creditsEarnedToday.toFixed(1)} credits</span>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{currentStreak}d streak</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/judge">
              <TouchButton
                onClick={onJudgeMore}
                className={urgent
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Judge More
              </TouchButton>
            </Link>
            <button
              onClick={() => {
                setDismissed(true);
                onDismiss?.();
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Take a break
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Low credits CTA
interface LowCreditsCTAProps {
  currentCredits: number;
  onEarnCredits?: () => void;
  onBuyCredits?: () => void;
  onDismiss?: () => void;
}

export function LowCreditsCTA({ currentCredits, onEarnCredits, onBuyCredits, onDismiss }: LowCreditsCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show if credits are low (less than 1)
  if (currentCredits >= 1 || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Coins className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Running low on credits</h3>
          <p className="text-purple-100 text-sm mb-3">
            You have {currentCredits.toFixed(1)} credits left. Earn more by helping others with their decisions!
          </p>
          <div className="flex items-center gap-3">
            <Link href="/judge">
              <TouchButton
                onClick={onEarnCredits}
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                <Star className="h-4 w-4 mr-2" />
                Earn Credits Free
              </TouchButton>
            </Link>
            <Link href="/credits">
              <TouchButton
                onClick={onBuyCredits}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Buy Credits
              </TouchButton>
            </Link>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Inactivity reminder CTA
interface InactivityCTAProps {
  lastRequestDate: string | null;
  lastFeedbackHighlight?: string;
  onSubmitRequest?: () => void;
  onDismiss?: () => void;
}

export function InactivityCTA({ lastRequestDate, lastFeedbackHighlight, onSubmitRequest, onDismiss }: InactivityCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!lastRequestDate || dismissed) return null;

  const daysSince = Math.floor(
    (Date.now() - new Date(lastRequestDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show after 3+ days of inactivity
  if (daysSince < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Time for another decision?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            It's been {daysSince} days since your last request.
            {lastFeedbackHighlight && (
              <span className="block mt-1 text-purple-600">
                Remember: "{lastFeedbackHighlight}"
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/submit">
              <TouchButton
                onClick={onSubmitRequest}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit a Request
              </TouchButton>
            </Link>
            <button
              onClick={() => {
                setDismissed(true);
                onDismiss?.();
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Achievement unlock prompt
interface AchievementPromptProps {
  achievementName: string;
  progress: number;
  total: number;
  reward: string;
  actionLabel: string;
  actionHref: string;
  onDismiss?: () => void;
}

export function AchievementPrompt({
  achievementName,
  progress,
  total,
  reward,
  actionLabel,
  actionHref,
  onDismiss,
}: AchievementPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const percentage = (progress / total) * 100;

  // Only show when close to completion (80%+)
  if (percentage < 80 || percentage >= 100 || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{achievementName}</span>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {total - progress} to go!
            </span>
          </div>
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-amber-700 mt-1">Reward: {reward}</p>
        </div>
        <Link href={actionHref}>
          <TouchButton size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">
            {actionLabel}
          </TouchButton>
        </Link>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-amber-400 hover:text-amber-600 ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Welcome back bonus CTA
interface WelcomeBackBonusProps {
  daysSinceLastVisit: number;
  bonusCredits: number;
  onClaim?: () => void;
  onDismiss?: () => void;
}

export function WelcomeBackBonus({ daysSinceLastVisit, bonusCredits, onClaim, onDismiss }: WelcomeBackBonusProps) {
  const [claimed, setClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (daysSinceLastVisit < 7 || dismissed || claimed) return null;

  const handleClaim = () => {
    setClaimed(true);
    onClaim?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 opacity-20 text-8xl">🎁</div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-6 w-6" />
          <h3 className="text-xl font-bold">Welcome Back Bonus!</h3>
        </div>

        <p className="text-purple-100 mb-4">
          It's been {daysSinceLastVisit} days! Here's a special gift just for you:
        </p>

        <div className="bg-white/20 rounded-xl p-4 mb-4 text-center">
          <div className="text-4xl font-bold mb-1">+{bonusCredits}</div>
          <div className="text-purple-100">Free Credits</div>
        </div>

        <div className="flex items-center gap-3">
          <TouchButton
            onClick={handleClaim}
            className="flex-1 bg-white text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Claim Your Bonus
          </TouchButton>
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="text-white/60 hover:text-white p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
