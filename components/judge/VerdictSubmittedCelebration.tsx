'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  DollarSign,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle,
  Heart,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface VerdictSubmittedCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  earnings: number;
  verdictType: 'standard' | 'comparison' | 'split_test';
  verdictSummary?: string;
  currentStreak?: number;
  totalVerdicts?: number;
  requestCategory?: string;
}

export function VerdictSubmittedCelebration({
  isOpen,
  onClose,
  earnings,
  verdictType,
  verdictSummary,
  currentStreak = 0,
  totalVerdicts = 0,
  requestCategory,
}: VerdictSubmittedCelebrationProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      playSuccessSound();
      triggerHaptic('success');
    }
  }, [isOpen]);

  const getTypeLabel = () => {
    switch (verdictType) {
      case 'comparison':
        return 'A/B Comparison';
      case 'split_test':
        return 'Split Test';
      default:
        return 'Verdict';
    }
  };

  const handleJudgeAnother = () => {
    onClose();
    router.push('/judge');
  };

  const handleViewEarnings = () => {
    onClose();
    router.push('/judge/earnings');
  };

  if (!isOpen) return null;

  return (
    <>
      <Confetti active={showConfetti} duration={4000} pieces={120} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-indigo-900/95 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
            className="max-w-md w-full text-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
              </div>
              {/* Animated rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-4 border-green-400 rounded-full"
              />
            </motion.div>

            {/* Main message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                Awesome work!
              </h1>
              <p className="text-indigo-200 mb-6">
                Your {getTypeLabel().toLowerCase()} helps someone make a better decision
              </p>
            </motion.div>

            {/* Earnings card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-indigo-200">You earned</p>
                  <p className="text-3xl font-bold text-white">${earnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-indigo-300">
                <Clock className="h-4 w-4" />
                <span>Available for payout in 7 days</span>
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-6 mb-8"
            >
              {currentStreak > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                    <Flame className="h-5 w-5" />
                    <span className="text-2xl font-bold">{currentStreak}</span>
                  </div>
                  <p className="text-xs text-indigo-300">Day streak</p>
                </div>
              )}

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-300 mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold text-white">{totalVerdicts}</span>
                </div>
                <p className="text-xs text-indigo-300">Total verdicts</p>
              </div>

              {requestCategory && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-400 mb-1">
                    <Heart className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-indigo-300 capitalize">{requestCategory}</p>
                </div>
              )}
            </motion.div>

            {/* Verdict preview (if provided) */}
            {verdictSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white/5 rounded-xl p-4 mb-6 text-left border border-white/10"
              >
                <p className="text-xs text-indigo-300 mb-2">Your verdict:</p>
                <p className="text-sm text-white/90 line-clamp-2 italic">
                  "{verdictSummary}"
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={handleJudgeAnother}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Judge Another Request
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={handleViewEarnings}
                className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View My Earnings
              </button>
            </motion.div>

            {/* Encouragement */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-indigo-400 mt-6"
            >
              Quality feedback leads to higher ratings and better-paying requests
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
