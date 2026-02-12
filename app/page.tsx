'use client';

import { useEffect, useState } from 'react';
import { useExperiment, getVariantFromURL } from '@/lib/ab-testing';
import { StreamlinedLanding } from '@/components/landing/StreamlinedLanding';
import OriginalHomePage from './page-original';

/**
 * A/B Test Landing Page
 *
 * This page runs an A/B test between:
 * - Variant A: Original landing page (current design)
 * - Variant B: Streamlined landing page (optimized, 4 sections)
 *
 * Testing URLs:
 * - ?ab_landing-page-v2=A → Force original
 * - ?ab_landing-page-v2=B → Force streamlined
 *
 * The hero within streamlined also has its own A/B test:
 * - Variant A: Emotional hook ("Your friends are too nice")
 * - Variant B: Benefit-focused ("Honest feedback in 2 hours")
 */
export default function HomePage() {
  const { variant, isLoading, trackEvent } = useExperiment('landing-page-v2');
  const [urlVariant, setUrlVariant] = useState<'A' | 'B' | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check for URL-based override on mount
  useEffect(() => {
    setIsHydrated(true);
    const override = getVariantFromURL('landing-page-v2');
    if (override) {
      setUrlVariant(override);
    }
  }, []);

  // Track page view when variant is determined
  useEffect(() => {
    if (variant && !isLoading && isHydrated) {
      trackEvent('page_view', {
        page: 'landing',
        variant: urlVariant || variant,
      });
    }
  }, [variant, isLoading, isHydrated, urlVariant, trackEvent]);

  // Prevent hydration mismatch - show nothing until client-side
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
    );
  }

  // Brief loading state to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeVariant = urlVariant || variant;

  // ========================================
  // VARIANT B: Streamlined Landing Page
  // ========================================
  if (activeVariant === 'B') {
    return (
      <StreamlinedLanding
        variant="A" // Hero copy test (A = emotional, B = benefit)
        experimentId="landing-page-v2"
      />
    );
  }

  // ========================================
  // VARIANT A: Original Landing Page
  // ========================================
  return <OriginalHomePage />;
}
