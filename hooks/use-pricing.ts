/**
 * React hook for dynamic pricing
 */

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { getPrivateSubmissionPriceForLocale, type PriceConfig } from '@/lib/pricing-config';

interface UsePricingReturn {
  privatePrice: PriceConfig | null;
  loading: boolean;
  error: Error | null;
}

export function usePricing(): UsePricingReturn {
  const locale = useLocale();
  const [privatePrice, setPrivatePrice] = useState<PriceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // In a real app, this might fetch from an API
      // For now, we use the config directly
      const price = getPrivateSubmissionPriceForLocale(locale);
      setPrivatePrice(price);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load pricing'));
      setLoading(false);
    }
  }, [locale]);

  return { privatePrice, loading, error };
}

/**
 * Get formatted private submission price
 */
export function usePrivatePrice(): string {
  const { privatePrice, loading } = usePricing();
  
  if (loading || !privatePrice) {
    return '...'; // Show placeholder while loading
  }
  
  return privatePrice.formatted;
}