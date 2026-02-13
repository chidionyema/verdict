'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface StickyCTAProps {
  /** Show after scrolling this many pixels */
  showAfter?: number;
  /** Primary CTA text */
  ctaText?: string;
  /** Primary CTA link */
  ctaLink?: string;
  /** Secondary text shown next to CTA */
  secondaryText?: string;
  /** Whether to show trust indicators */
  showTrust?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when CTA is clicked */
  onCTAClick?: () => void;
}

export function StickyCTA({
  showAfter = 300,
  ctaText = 'Get 3 Honest Opinions',
  ctaLink = '/submit',
  secondaryText = 'Free to start',
  showTrust = true,
  className,
  onCTAClick
}: StickyCTAProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isDismissed) return;

      const scrolled = window.scrollY;
      const shouldShow = scrolled > showAfter;

      // Also hide near the bottom of the page to avoid overlapping footer
      const nearBottom = window.innerHeight + scrolled >= document.body.offsetHeight - 200;

      setIsVisible(shouldShow && !nearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter, isDismissed]);

  const handleClick = () => {
    onCTAClick?.();
    router.push(ctaLink);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "md:hidden", // Only show on mobile
            className
          )}
        >
          {/* Gradient fade */}
          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />

          <div className="bg-white border-t border-gray-200 shadow-lg px-4 py-3 safe-area-bottom">
            <div className="flex items-center gap-3">
              {/* Main CTA */}
              <button
                onClick={handleClick}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {ctaText}
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trust indicators */}
            {showTrust && (
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Anonymous</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>&lt;2hr response</span>
                </div>
                <span className="text-green-600 font-medium">{secondaryText}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Desktop variant that sticks to the side
export function StickyDesktopCTA({
  showAfter = 500,
  ctaText = 'Get Feedback',
  ctaLink = '/submit',
  className,
  onCTAClick
}: StickyCTAProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const nearBottom = window.innerHeight + scrolled >= document.body.offsetHeight - 300;
      setIsVisible(scrolled > showAfter && !nearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const handleClick = () => {
    onCTAClick?.();
    router.push(ctaLink);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "fixed right-6 bottom-8 z-50",
            "hidden md:block", // Only show on desktop
            className
          )}
        >
          <button
            onClick={handleClick}
            className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StickyCTA;
