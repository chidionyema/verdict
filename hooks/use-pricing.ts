/**
 * React hook for dynamic pricing with proper SSR/hydration handling
 */

import { useState, useEffect } from 'react';
import { getPricingTexts, detectUserCurrency, CURRENCY_CONFIG } from '@/lib/localization';

interface UsePricingReturn {
  privatePrice: string;
  freePath: string;
  paidPath: string;
  currencyCode: string;
  loading: boolean;
}

/**
 * Hook that returns localized pricing texts with proper SSR handling
 * On server: returns USD as fallback
 * On client: detects locale and returns correct currency
 */
export function useLocalizedPricing(): UsePricingReturn {
  const [pricing, setPricing] = useState<ReturnType<typeof getPricingTexts> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client after hydration
    const texts = getPricingTexts();
    setPricing(texts);
    setLoading(false);
  }, []);

  // SSR fallback - show loading indicator
  if (loading || !pricing) {
    return {
      privatePrice: '...',
      freePath: 'Judge 3 → Earn 1 credit',
      paidPath: 'Pay ... → Skip judging',
      currencyCode: 'USD',
      loading: true,
    };
  }

  return {
    privatePrice: pricing.privateSubmissionPrice,
    freePath: pricing.freePath,
    paidPath: pricing.paidPath,
    currencyCode: pricing.currencyCode,
    loading: false,
  };
}

/**
 * Get formatted private submission price with proper hydration
 */
export function usePrivatePrice(): string {
  const { privatePrice } = useLocalizedPricing();
  return privatePrice;
}

/**
 * Legacy hook for compatibility
 */
export function usePricing() {
  const pricing = useLocalizedPricing();
  return {
    privatePrice: pricing.loading ? null : { formatted: pricing.privatePrice },
    loading: pricing.loading,
    error: null,
  };
}