'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, DollarSign, Eye, ChevronUp } from 'lucide-react';

interface MobileStickySubmitProps {
  canSubmit: boolean;
  isSubmitting: boolean;
  earnings: string;
  onSubmit: () => void;
  onPreview?: () => void;
  submitLabel?: string;
  verdictType?: 'standard' | 'comparison' | 'split_test';
}

/**
 * Mobile-optimized sticky submit button that appears at the bottom of the screen
 * Shows earnings and provides quick access to submit/preview
 */
export function MobileStickySubmit({
  canSubmit,
  isSubmitting,
  earnings,
  onSubmit,
  onPreview,
  submitLabel = 'Submit Verdict',
  verdictType = 'standard',
}: MobileStickySubmitProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up (mobile-friendly UX)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only apply hide/show logic when scrolling significantly
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & past threshold - hide
          setIsVisible(false);
          setShowQuickActions(false);
        } else {
          // Scrolling up - show
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Always show when can submit and at bottom of page
  useEffect(() => {
    const handleScrollEnd = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      if (isAtBottom || canSubmit) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScrollEnd, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollEnd);
  }, [canSubmit]);

  const getGradientColor = () => {
    switch (verdictType) {
      case 'comparison':
        return 'from-purple-600 to-indigo-600';
      case 'split_test':
        return 'from-emerald-600 to-teal-600';
      default:
        return 'from-green-500 to-emerald-600';
    }
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the sticky bar */}
      <div className="h-24 md:hidden" />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          >
            {/* Gradient fade effect */}
            <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />

            {/* Quick actions panel */}
            <AnimatePresence>
              {showQuickActions && onPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white border-t border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setShowQuickActions(false);
                      onPreview();
                    }}
                    className="w-full py-3 px-4 flex items-center justify-center gap-2 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Before Submitting
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main sticky bar */}
            <div className="bg-white border-t border-gray-200 shadow-lg px-4 py-3 safe-area-inset-bottom">
              <div className="flex items-center gap-3">
                {/* Earnings display */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-700">{earnings}</span>
                </div>

                {/* Submit button */}
                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    !canSubmit || isSubmitting
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${getGradientColor()} text-white shadow-lg active:scale-[0.98]`
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{submitLabel}</span>
                    </>
                  )}
                </button>

                {/* Quick actions toggle */}
                {onPreview && canSubmit && !isSubmitting && (
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      showQuickActions ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ChevronUp
                      className={`h-5 w-5 transition-transform ${showQuickActions ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {/* Progress hint when can't submit */}
              {!canSubmit && !isSubmitting && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Complete all required fields to submit
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Simple floating action button for mobile submit
 * Alternative to the full sticky bar for simpler forms
 */
export function MobileFloatingSubmit({
  canSubmit,
  isSubmitting,
  earnings,
  onSubmit,
  verdictType = 'standard',
}: Omit<MobileStickySubmitProps, 'onPreview' | 'submitLabel'>) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getGradientColor = () => {
    switch (verdictType) {
      case 'comparison':
        return 'from-purple-600 to-indigo-600';
      case 'split_test':
        return 'from-emerald-600 to-teal-600';
      default:
        return 'from-green-500 to-emerald-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && canSubmit && !isSubmitting && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSubmit}
          className={`fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-2 px-5 py-4 rounded-full shadow-2xl bg-gradient-to-r ${getGradientColor()} text-white font-bold cursor-pointer`}
        >
          <Send className="h-5 w-5" />
          <span>${earnings}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
