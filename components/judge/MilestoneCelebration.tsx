'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  Star,
  Flame,
  TrendingUp,
  DollarSign,
  Award,
  Zap,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

export type MilestoneType =
  | 'first_verdict'
  | 'verdict_10'
  | 'verdict_50'
  | 'verdict_100'
  | 'tier_up'
  | 'streak_7'
  | 'streak_30'
  | 'first_payout'
  | 'quality_star';

interface MilestoneConfig {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  gradient: string;
  confettiPieces: number;
  reward?: string;
}

const MILESTONE_CONFIGS: Record<MilestoneType, MilestoneConfig> = {
  first_verdict: {
    title: 'First Verdict Complete!',
    subtitle: "You did it!",
    description: "You just helped someone make a decision. This is the first of many!",
    icon: Sparkles,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    confettiPieces: 100,
    reward: "You've unlocked the judge dashboard",
  },
  verdict_10: {
    title: '10 Verdicts!',
    subtitle: 'Rising Star',
    description: "You've helped 10 people. You're getting the hang of this!",
    icon: Star,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    confettiPieces: 80,
    reward: '+5% bonus on all verdicts',
  },
  verdict_50: {
    title: '50 Verdicts!',
    subtitle: 'Trusted Judge',
    description: "You're now a trusted voice in the community.",
    icon: Award,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    confettiPieces: 120,
    reward: '+10% bonus + priority queue access',
  },
  verdict_100: {
    title: '100 Verdicts!',
    subtitle: 'Expert Judge',
    description: "You've reached expert status. Amazing dedication!",
    icon: Trophy,
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600',
    confettiPieces: 150,
    reward: '+15% bonus + expert-only requests',
  },
  tier_up: {
    title: 'Level Up!',
    subtitle: 'New Tier Unlocked',
    description: "You've advanced to the next judge tier!",
    icon: TrendingUp,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    confettiPieces: 100,
    reward: 'New perks unlocked',
  },
  streak_7: {
    title: '7-Day Streak!',
    subtitle: 'On Fire!',
    description: "You've judged every day for a week. Incredible consistency!",
    icon: Flame,
    color: 'red',
    gradient: 'from-red-500 to-orange-600',
    confettiPieces: 80,
    reward: '+20% bonus this week',
  },
  streak_30: {
    title: '30-Day Streak!',
    subtitle: 'Legendary!',
    description: "A whole month of daily judging. You're unstoppable!",
    icon: Zap,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    confettiPieces: 200,
    reward: '+50% bonus this month + exclusive badge',
  },
  first_payout: {
    title: 'First Payout!',
    subtitle: 'Money Earned',
    description: "Your first earnings have been paid out. Real money for real help!",
    icon: DollarSign,
    color: 'green',
    gradient: 'from-green-500 to-teal-600',
    confettiPieces: 100,
  },
  quality_star: {
    title: 'Quality Star!',
    subtitle: '5-Star Rating',
    description: "Someone loved your feedback! Keep up the great work.",
    icon: Star,
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    confettiPieces: 60,
  },
};

interface MilestoneCelebrationProps {
  type: MilestoneType;
  isOpen: boolean;
  onClose: () => void;
  extraData?: {
    newTier?: string;
    earnings?: number;
    streakDays?: number;
  };
}

export function MilestoneCelebration({
  type,
  isOpen,
  onClose,
  extraData,
}: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const config = MILESTONE_CONFIGS[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      playSuccessSound();
      triggerHaptic('success');

      // Auto-dismiss confetti after a few seconds
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <Confetti active={showConfetti} duration={4000} pieces={config.confettiPieces} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-br ${config.gradient} p-8 text-center relative overflow-hidden`}>
              {/* Animated background circles */}
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full"
                />
                <motion.div
                  animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full"
                />
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white/80 text-sm font-medium mb-1">{config.subtitle}</p>
                <h2 className="text-2xl font-bold text-white">{config.title}</h2>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">{config.description}</p>

              {/* Reward */}
              {config.reward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <PartyPopper className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">{config.reward}</span>
                  </div>
                </motion.div>
              )}

              {/* Extra data display */}
              {extraData?.newTier && (
                <p className="text-sm text-gray-500 mb-4">
                  New tier: <span className="font-semibold text-indigo-600">{extraData.newTier}</span>
                </p>
              )}
              {extraData?.earnings && (
                <p className="text-sm text-gray-500 mb-4">
                  Total earned: <span className="font-semibold text-green-600">${extraData.earnings.toFixed(2)}</span>
                </p>
              )}
              {extraData?.streakDays && (
                <p className="text-sm text-gray-500 mb-4">
                  Current streak: <span className="font-semibold text-orange-600">{extraData.streakDays} days</span>
                </p>
              )}

              {/* Continue button */}
              <button
                onClick={onClose}
                className={`w-full py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/**
 * Hook to check for milestone achievements
 */
export function useMilestoneCheck(stats: {
  verdicts_given?: number;
  streak_days?: number;
  tier?: string;
  previous_tier?: string;
}) {
  const [milestone, setMilestone] = useState<MilestoneType | null>(null);

  useEffect(() => {
    const verdicts = stats.verdicts_given || 0;
    const streak = stats.streak_days || 0;

    // Check for milestone in priority order
    if (verdicts === 1) {
      setMilestone('first_verdict');
    } else if (verdicts === 10) {
      setMilestone('verdict_10');
    } else if (verdicts === 50) {
      setMilestone('verdict_50');
    } else if (verdicts === 100) {
      setMilestone('verdict_100');
    } else if (stats.tier !== stats.previous_tier && stats.previous_tier) {
      setMilestone('tier_up');
    } else if (streak === 7) {
      setMilestone('streak_7');
    } else if (streak === 30) {
      setMilestone('streak_30');
    }
  }, [stats]);

  const clearMilestone = () => setMilestone(null);

  return { milestone, clearMilestone };
}
