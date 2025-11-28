'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ArrowRight } from 'lucide-react';

const EXAMPLES = [
  'Job offer vs startup?',
  'Is this dating profile working?',
  'Does this outfit fit the interview?',
  'Is this pricing page clear?',
];

export function FeatureDiscoveryBanner() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('feature_banner_dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }

    // Rotate examples
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % EXAMPLES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('feature_banner_dismissed', 'true');
    setIsVisible(false);
  };

  const handleCTA = () => {
    router.push('/start-simple');
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Icon */}
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Message */}
            <div className="flex-1">
              {/* Reserve vertical space so rotating text doesn't change banner height */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-h-[2.5rem]">
                <span className="font-semibold text-sm sm:text-base">
                  New: Get help with any life decision
                </span>
                <span className="text-sm text-purple-100">
                  {EXAMPLES[currentExample]} We can help
                </span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCTA}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap"
          >
            Start a request
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Animated gradient effect */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
