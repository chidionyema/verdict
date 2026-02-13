'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  CheckCircle,
  Gift,
  X,
  ArrowRight,
} from 'lucide-react';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reward?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementUnlockProps {
  achievement: Achievement | null;
  onClose: () => void;
  onViewAll?: () => void;
}

const RARITY_CONFIG = {
  common: {
    gradient: 'from-gray-500 to-slate-600',
    glow: 'shadow-gray-500/20',
    confetti: 60,
    label: 'Common',
  },
  rare: {
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'shadow-blue-500/30',
    confetti: 80,
    label: 'Rare',
  },
  epic: {
    gradient: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/40',
    confetti: 100,
    label: 'Epic',
  },
  legendary: {
    gradient: 'from-yellow-400 to-amber-600',
    glow: 'shadow-yellow-500/50',
    confetti: 150,
    label: 'Legendary',
  },
};

/**
 * Achievement unlock celebration animation
 * Shows when a judge unlocks a new achievement
 */
export function AchievementUnlock({ achievement, onClose, onViewAll }: AchievementUnlockProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Use a microtask to avoid synchronous state update in effect
      Promise.resolve().then(() => {
        setShowConfetti(true);
      });
      playSuccessSound();
      triggerHaptic('success');
    }
  }, [achievement]);

  if (!achievement) return null;

  const rarity = achievement.rarity || 'common';
  const config = RARITY_CONFIG[rarity];

  return (
    <>
      <Confetti active={showConfetti} duration={4000} pieces={config.confetti} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, rotateY: -30 }}
            animate={{ scale: 1, y: 0, rotateY: 0 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full"
          >
            {/* Card */}
            <div className={`bg-gradient-to-br ${config.gradient} rounded-3xl p-1 shadow-2xl ${config.glow}`}>
              <div className="bg-gray-900/90 backdrop-blur-xl rounded-[22px] overflow-hidden">
                {/* Header */}
                <div className="relative px-6 pt-8 pb-4 text-center">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Rarity label */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/80 mb-4"
                  >
                    <Sparkles className="h-3 w-3" />
                    {config.label} Achievement
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
                    className="relative mx-auto w-24 h-24 mb-4"
                  >
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-xl opacity-60 animate-pulse`} />

                    {/* Icon container */}
                    <div className={`relative w-full h-full bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                      <div className="text-white transform scale-110">
                        {achievement.icon}
                      </div>
                    </div>

                    {/* Shine effect */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                    />
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-amber-400 text-sm font-medium mb-1">Achievement Unlocked!</p>
                    <h2 className="text-2xl font-bold text-white">{achievement.title}</h2>
                  </motion.div>
                </div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-6 pb-4"
                >
                  <p className="text-center text-gray-400 text-sm">
                    {achievement.description}
                  </p>
                </motion.div>

                {/* Reward */}
                {achievement.reward && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mx-6 mb-4"
                  >
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                      <Gift className="h-5 w-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-amber-300/80">Reward unlocked</p>
                        <p className="text-sm font-semibold text-amber-300">{achievement.reward}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="px-6 pb-6 space-y-3"
                >
                  <button
                    onClick={onClose}
                    className={`w-full py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    <CheckCircle className="h-5 w-5" />
                    Awesome!
                  </button>

                  {onViewAll && (
                    <button
                      onClick={onViewAll}
                      className="w-full py-2.5 bg-white/5 text-white/80 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      View All Achievements
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/**
 * Mini achievement badge that appears briefly
 * Used for less significant achievements
 */
interface MiniAchievementBadgeProps {
  title: string;
  icon?: React.ReactNode;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function MiniAchievementBadge({
  title,
  icon,
  onDismiss,
  autoDismissMs = 5000,
}: MiniAchievementBadgeProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3 max-w-xs">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
          {icon || <Trophy className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-600 font-medium">Achievement Unlocked</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
