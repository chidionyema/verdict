'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  X,
  ChevronRight,
  Sparkles,
  Gift,
  Zap,
} from 'lucide-react';
import { UnifiedVerificationFlow } from './UnifiedVerificationFlow';

interface ContextualVerificationPromptProps {
  userId: string;
  currentTier: number; // 0-5 tier index
  weeklyVerdicts?: number;
  context?: 'dashboard' | 'earnings' | 'post-verdict' | 'first-verdict';
  onComplete?: () => void;
}

/**
 * ContextualVerificationPrompt - Smart, non-intrusive verification prompts
 *
 * Shows different messaging based on context:
 * - Dashboard: General "unlock more" message
 * - Earnings page: Specific dollar amounts they're missing
 * - Post-verdict: Celebrate completion, suggest verification
 * - First verdict: Welcome + immediate verification value
 */
export function ContextualVerificationPrompt({
  userId,
  currentTier,
  weeklyVerdicts = 15,
  context = 'dashboard',
  onComplete,
}: ContextualVerificationPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);

  // Check if user has dismissed this prompt before
  useEffect(() => {
    const dismissedKey = `verification-prompt-dismissed-${context}`;
    const dismissedAt = localStorage.getItem(dismissedKey);
    if (dismissedAt) {
      // Allow prompt to reappear after 7 days
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
    setHasSeenPrompt(true);
  }, [context]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`verification-prompt-dismissed-${context}`, new Date().toISOString());
  };

  const handleFlowComplete = () => {
    setShowFlow(false);
    onComplete?.();
  };

  // Don't show if already at max tier or dismissed
  if (currentTier >= 4 || dismissed || !hasSeenPrompt) {
    return null;
  }

  // Calculate earnings impact
  const baseRate = 0.60;
  const currentMultiplier = [1, 1, 1, 1.15, 1.25, 1.5][currentTier] || 1;
  const nextMultiplier = [1, 1, 1.15, 1.25, 1.5, 1.5][currentTier + 1] || currentMultiplier;
  const weeklyIncrease = weeklyVerdicts * baseRate * (nextMultiplier - currentMultiplier);

  // Context-specific content
  const getContent = () => {
    switch (context) {
      case 'first-verdict':
        return {
          icon: Gift,
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          title: 'Great first verdict!',
          subtitle: `Complete your profile to earn ${((nextMultiplier - 1) * 100).toFixed(0)}% more on every verdict`,
          cta: 'Unlock Bonus',
          gradient: 'from-purple-500 to-indigo-600',
        };

      case 'post-verdict':
        return {
          icon: Zap,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          title: 'Nice work!',
          subtitle: `You could've earned £${(baseRate * (nextMultiplier - currentMultiplier)).toFixed(2)} more on that verdict`,
          cta: 'Boost Earnings',
          gradient: 'from-amber-500 to-orange-600',
        };

      case 'earnings':
        return {
          icon: TrendingUp,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          title: `You're missing £${weeklyIncrease.toFixed(2)}/week`,
          subtitle: 'Complete verification to unlock higher earnings',
          cta: 'Unlock Now',
          gradient: 'from-green-500 to-emerald-600',
        };

      default: // dashboard
        return {
          icon: Sparkles,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          title: 'Earn more per verdict',
          subtitle: `Unlock +£${weeklyIncrease.toFixed(2)}/week with quick profile verification`,
          cta: 'Get Started',
          gradient: 'from-indigo-500 to-purple-600',
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <>
      <AnimatePresence>
        {!showFlow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${content.gradient}`} />

            <div className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 ${content.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${content.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{content.title}</p>
                <p className="text-gray-500 text-xs truncate">{content.subtitle}</p>
              </div>

              <button
                onClick={() => setShowFlow(true)}
                className={`px-4 py-2 bg-gradient-to-r ${content.gradient} text-white text-sm font-medium rounded-lg hover:opacity-90 transition flex items-center gap-1 shrink-0`}
              >
                {content.cta}
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification flow modal */}
      <AnimatePresence>
        {showFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFlow(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <UnifiedVerificationFlow
                userId={userId}
                mode="modal"
                onComplete={handleFlowComplete}
                onDismiss={() => setShowFlow(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * PostVerdictVerificationNudge - Appears after submitting a verdict
 *
 * Shows briefly, then auto-dismisses. Non-blocking.
 */
export function PostVerdictVerificationNudge({
  userId,
  currentTier,
  show,
  onDismiss,
}: {
  userId: string;
  currentTier: number;
  show: boolean;
  onDismiss: () => void;
}) {
  const [showFlow, setShowFlow] = useState(false);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (show && currentTier < 4) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, currentTier, onDismiss]);

  if (!show || currentTier >= 4) return null;

  const missedBonus = 0.60 * 0.15; // Amount they missed on this verdict

  return (
    <>
      <AnimatePresence>
        {!showFlow && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm z-40"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  You just missed £{missedBonus.toFixed(2)} bonus
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify your profile to earn more on every verdict
                </p>
                <button
                  onClick={() => setShowFlow(true)}
                  className="mt-2 text-indigo-600 text-xs font-medium hover:text-indigo-700"
                >
                  Unlock bonus earnings →
                </button>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-amber-400 rounded-b-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification flow modal */}
      <AnimatePresence>
        {showFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowFlow(false);
              onDismiss();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <UnifiedVerificationFlow
                userId={userId}
                mode="modal"
                onComplete={() => {
                  setShowFlow(false);
                  onDismiss();
                }}
                onDismiss={() => {
                  setShowFlow(false);
                  onDismiss();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
