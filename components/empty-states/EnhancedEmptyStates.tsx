'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Gavel,
  DollarSign,
  Clock,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Bell,
  RefreshCw,
  Share2,
  Heart,
  Zap,
  MessageSquare,
  Target,
  Gift,
  Trophy,
  PartyPopper,
} from 'lucide-react';

// Animated illustration components
function FloatingIllustration({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Base empty state wrapper
interface EmptyStateWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function EmptyStateWrapper({ children, className = '' }: EmptyStateWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// NO REQUESTS TO JUDGE - Empty Judge Queue
// ============================================

interface NoRequestsToJudgeProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function NoRequestsToJudge({ onRefresh, isRefreshing }: NoRequestsToJudgeProps) {
  const router = useRouter();
  const [currentHour] = useState(new Date().getHours());

  const isPeakHour = currentHour >= 18 && currentHour <= 22;
  const isQuietHour = currentHour >= 23 || currentHour < 6;

  const getTimeMessage = () => {
    if (isPeakHour) {
      return {
        text: 'Peak time! New requests usually appear within minutes.',
        color: 'text-green-600',
        bg: 'bg-green-50',
      };
    }
    if (isQuietHour) {
      return {
        text: 'Quiet hours. Best time to judge is 6-10 PM.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      };
    }
    return {
      text: 'Requests come in throughout the day. Check back soon!',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    };
  };

  const timeMessage = getTimeMessage();

  return (
    <EmptyStateWrapper>
      <div className="p-8 md:p-12 text-center">
        {/* Animated illustration */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <FloatingIllustration>
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Inbox className="h-16 w-16 text-indigo-500" />
            </div>
          </FloatingIllustration>
          {/* Decorative sparkles */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-6 w-6 text-amber-400" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          All caught up!
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You have reviewed everything in your queue. Great work! New requests come in constantly.
        </p>

        {/* Time-based hint */}
        <div className={`${timeMessage.bg} rounded-xl p-4 mb-6 inline-flex items-center gap-2`}>
          <Clock className={`h-5 w-5 ${timeMessage.color}`} />
          <span className={`text-sm font-medium ${timeMessage.color}`}>
            {timeMessage.text}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check for New Requests'}
          </button>
          <button
            onClick={() => router.push('/submit')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            Submit Your Own
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Enable notifications CTA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Want to be notified when new requests arrive?
            </span>
            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission();
                }
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Enable notifications
            </button>
          </div>
        </div>
      </div>

      {/* Invite friends section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invite friends who need feedback</p>
              <p className="text-sm text-gray-600">More seekers = more judging opportunities</p>
            </div>
          </div>
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}?ref=judge`;
              if (navigator.share) {
                navigator.share({
                  title: 'Get honest feedback on Verdict',
                  text: 'I use this to get anonymous feedback from real people. Check it out!',
                  url: shareUrl,
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Verdict
          </button>
        </div>
      </div>
    </EmptyStateWrapper>
  );
}

// ============================================
// NO VERDICTS RECEIVED YET - Waiting for Feedback
// ============================================

interface WaitingForVerdictsProps {
  requestId?: string;
  targetVerdicts?: number;
  currentVerdicts?: number;
  submittedAt?: Date;
  estimatedTimeHours?: number;
}

export function WaitingForVerdicts({
  targetVerdicts = 3,
  currentVerdicts = 0,
  submittedAt,
  estimatedTimeHours = 2,
}: WaitingForVerdictsProps) {
  const router = useRouter();
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!submittedAt) return;

    const updateTime = () => {
      const diff = Date.now() - submittedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeAgo(`${hours}h ${minutes % 60}m`);
      } else {
        setTimeAgo(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [submittedAt]);

  const progress = (currentVerdicts / targetVerdicts) * 100;

  return (
    <EmptyStateWrapper>
      <div className="p-8 md:p-12 text-center">
        {/* Animated waiting illustration */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <motion.div
            className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Clock className="h-16 w-16 text-blue-500" />
            </motion.div>
          </motion.div>
          {/* Pulse effect */}
          <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your request is being reviewed
        </h2>
        <p className="text-gray-600 mb-6">
          Judges are writing detailed feedback. You will be notified as each verdict arrives.
        </p>

        {/* Progress indicator */}
        <div className="max-w-xs mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Verdicts received</span>
            <span className="font-semibold">{currentVerdicts} of {targetVerdicts}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* ETA and time elapsed */}
        <div className="flex justify-center gap-6 mb-8 text-sm">
          {timeAgo && (
            <div className="text-gray-500">
              Submitted <span className="font-medium text-gray-700">{timeAgo} ago</span>
            </div>
          )}
          <div className="text-gray-500">
            Avg. response: <span className="font-medium text-gray-700">{estimatedTimeHours}h</span>
          </div>
        </div>

        {/* Judge while waiting CTA */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 max-w-md mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gavel className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-1">Judge while you wait</h3>
              <p className="text-sm text-gray-600 mb-3">
                Earn money helping others. Each verdict takes 1-2 minutes.
              </p>
              <button
                onClick={() => router.push('/judge')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm flex items-center gap-2"
              >
                <Gavel className="h-4 w-4" />
                Start Judging
              </button>
            </div>
          </div>
        </div>
      </div>
    </EmptyStateWrapper>
  );
}

// ============================================
// NO SUBMISSIONS YET - First-time submitter
// ============================================

interface NoSubmissionsYetProps {
  credits?: number;
  userName?: string;
}

export function NoSubmissionsYet({ credits = 0, userName }: NoSubmissionsYetProps) {
  const router = useRouter();

  const inspiringExamples = [
    { emoji: '📸', text: 'Dating profile photos' },
    { emoji: '👔', text: 'Outfit choices' },
    { emoji: '📝', text: 'Resume or cover letter' },
    { emoji: '🤔', text: 'Career decisions' },
    { emoji: '🏠', text: 'Room decor' },
    { emoji: '💼', text: 'Business ideas' },
  ];

  return (
    <EmptyStateWrapper>
      <div className="p-8 md:p-12 text-center">
        {/* Animated welcome illustration */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <FloatingIllustration>
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <PartyPopper className="h-16 w-16 text-purple-500" />
            </div>
          </FloatingIllustration>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {userName ? `Welcome, ${userName}!` : 'Ready for honest feedback?'}
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get anonymous opinions from real people on anything you are unsure about. No AI, just authentic human perspectives.
        </p>

        {/* Credits badge */}
        {credits > 0 && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <Gift className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">
              You have {credits} free credit{credits > 1 ? 's' : ''} to start!
            </span>
          </div>
        )}

        {/* Examples grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md mx-auto mb-8">
          {inspiringExamples.map((example, index) => (
            <motion.div
              key={example.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition cursor-pointer"
              onClick={() => router.push('/submit')}
            >
              <span className="text-2xl mb-1 block">{example.emoji}</span>
              <span className="text-xs text-gray-600">{example.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/submit')}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Sparkles className="h-5 w-5" />
          Submit Your First Request
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Social proof */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Trusted by thousands for honest feedback</p>
          <div className="flex justify-center items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">50K+</p>
              <p className="text-xs text-gray-500">Verdicts given</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">4.8</p>
              <p className="text-xs text-gray-500">Avg rating</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">2h</p>
              <p className="text-xs text-gray-500">Avg response</p>
            </div>
          </div>
        </div>
      </div>
    </EmptyStateWrapper>
  );
}

// ============================================
// NO EARNINGS YET - Judge hasn't earned
// ============================================

interface NoEarningsYetProps {
  verdictsGiven?: number;
  minimumPayout?: number;
}

export function NoEarningsYet({ verdictsGiven = 0, minimumPayout = 2000 }: NoEarningsYetProps) {
  const router = useRouter();

  // Earnings rates by tier
  const earningsInfo = [
    { tier: 'Community', rate: '$0.60', color: 'bg-gray-100 text-gray-700' },
    { tier: 'Standard', rate: '$1.00', color: 'bg-blue-100 text-blue-700' },
    { tier: 'Expert', rate: '$2.00+', color: 'bg-purple-100 text-purple-700' },
  ];

  // Calculate potential earnings
  const potentialEarnings = verdictsGiven * 0.8; // Average between community and standard

  return (
    <EmptyStateWrapper>
      <div className="p-8 md:p-12 text-center">
        {/* Animated earnings illustration */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <FloatingIllustration>
            <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-16 w-16 text-green-500" />
            </div>
          </FloatingIllustration>
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <TrendingUp className="h-8 w-8 text-green-400" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {verdictsGiven > 0 ? 'Your earnings are building!' : 'Start earning today'}
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {verdictsGiven > 0
            ? `You've given ${verdictsGiven} verdict${verdictsGiven > 1 ? 's' : ''}. Keep going to reach the payout threshold!`
            : 'Help others make decisions and earn real money. Each verdict takes just 1-2 minutes.'}
        </p>

        {/* Earnings rates */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {earningsInfo.map((info) => (
            <div
              key={info.tier}
              className={`${info.color} px-4 py-2 rounded-lg text-sm font-medium`}
            >
              {info.tier}: {info.rate}/verdict
            </div>
          ))}
        </div>

        {/* Progress to payout */}
        <div className="bg-gray-50 rounded-xl p-5 max-w-sm mx-auto mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Progress to payout</span>
            <span className="text-sm font-medium text-gray-900">
              ${potentialEarnings.toFixed(2)} / ${(minimumPayout / 100).toFixed(2)}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((potentialEarnings / (minimumPayout / 100)) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {potentialEarnings >= minimumPayout / 100
              ? 'You can request a payout!'
              : `${Math.ceil(((minimumPayout / 100) - potentialEarnings) / 0.8)} more verdicts to reach minimum`}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/judge')}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Gavel className="h-5 w-5" />
          Start Earning Now
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Earnings example */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Example earnings</p>
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-gray-900">10 verdicts/day</p>
              <p className="text-gray-500">= ~$8/day</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">1 hour/day</p>
              <p className="text-gray-500">= ~$50/week</p>
            </div>
          </div>
        </div>
      </div>
    </EmptyStateWrapper>
  );
}

// ============================================
// Export all empty states
// ============================================

export {
  EmptyStateWrapper,
  FloatingIllustration,
};
