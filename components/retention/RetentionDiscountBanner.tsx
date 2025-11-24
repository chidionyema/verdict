'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Clock, Tag } from 'lucide-react';

interface RetentionDiscountBannerProps {
  userId: string;
  hasCompletedRequest?: boolean;
  className?: string;
}

export function RetentionDiscountBanner({
  userId,
  hasCompletedRequest = false,
  className = '',
}: RetentionDiscountBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(7);

  useEffect(() => {
    // Only show if user has completed at least one request
    if (!hasCompletedRequest) {
      return;
    }

    // Check if user has already seen/dismissed the banner
    const dismissedKey = `discount_dismissed_${userId}`;
    const dismissed = localStorage.getItem(dismissedKey);

    if (dismissed) {
      return;
    }

    // Check when the first request was completed
    const firstRequestDateKey = `first_request_date_${userId}`;
    let firstRequestDate = localStorage.getItem(firstRequestDateKey);

    if (!firstRequestDate) {
      // Set first request date to now
      firstRequestDate = new Date().toISOString();
      localStorage.setItem(firstRequestDateKey, firstRequestDate);
    }

    // Calculate days since first request
    const daysSince = Math.floor(
      (Date.now() - new Date(firstRequestDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show banner after 3 days for 7 days total (expires after 10 days)
    if (daysSince >= 3 && daysSince <= 10) {
      setIsVisible(true);
      setDaysUntilExpiry(10 - daysSince);
    }
  }, [userId, hasCompletedRequest]);

  const handleDismiss = () => {
    localStorage.setItem(`discount_dismissed_${userId}`, 'true');
    setIsVisible(false);
  };

  const handleClaim = () => {
    // Navigate to start page with discount code
    router.push('/start?promo=NEXTVOTE20');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Icon */}
          <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full flex-shrink-0">
            <Tag className="w-6 h-6" />
          </div>

          {/* Message */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm sm:text-base">
                  Exclusive Offer: 20% OFF Your Next Decision
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-pink-100">
                <Clock className="w-4 h-4" />
                <span>Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}</span>
              </div>
            </div>
            <p className="text-sm text-pink-100 mt-1">
              We loved helping with your first decision. Here's 20% off your next one!
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClaim}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-pink-50 transition-colors text-sm whitespace-nowrap shadow-lg"
            >
              Claim Offer
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
