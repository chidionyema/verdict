/**
 * Simplified Pricing System for Community/Private Model
 * 
 * This replaces the old Basic/Detailed pricing with our new 2-tier model:
 * 1. Community (Free) - Judge others to earn credits
 * 2. Private (Paid) - Skip judging, pay for privacy
 */

import { type Locale, localeCurrencies } from '@/i18n.config';
import { type CurrencyCode, formatCurrency, formatCurrencyFromCents } from './i18n-format';
import { APP_CONFIG } from './app-config';

// Exchange rates relative to USD (for legacy compatibility)
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  AED: 3.67,
  ILS: 3.70,
};

/**
 * Base configuration for the Community/Private model
 */
export const SUBMISSION_CONFIG = {
  // Community path (free with credits)
  community: {
    cost: 0,
    judgmentsRequired: APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT,
    creditsRequired: APP_CONFIG.CREDITS.CREDITS_PER_SUBMISSION,
    feedbackReports: APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION,
    visibility: 'public' as const,
    timeRequired: APP_CONFIG.CREDITS.ESTIMATED_TOTAL_TIME,
  },
  
  // Private path (paid)
  private: {
    // Cost comes from pricing-config.ts (configurable)
    feedbackReports: APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION,
    visibility: 'private' as const,
    timeRequired: 'None (instant)',
    deliveryTime: `Within ${APP_CONFIG.DELIVERY.PRIVATE_MAX_HOURS} hours`,
  }
};

/**
 * Judge payout for private submissions only
 * (Community submissions use the credit system)
 */
export const JUDGE_PAYOUTS = {
  privateSubmission: APP_CONFIG.PRICING.JUDGE_PAYOUT_USD_CENTS, // $0.75 per judge for private submissions
};

/**
 * Convert amount from USD to target currency
 */
export function convertCurrency(
  amountInUsdCents: number,
  targetCurrency: CurrencyCode
): number {
  const rate = EXCHANGE_RATES[targetCurrency];

  // For zero-decimal currencies like JPY, round to whole number
  if (['JPY'].includes(targetCurrency)) {
    return Math.round(amountInUsdCents * rate / 100);
  }

  return Math.round(amountInUsdCents * rate);
}

/**
 * Get price in user's local currency
 */
export function getLocalizedPrice(
  basePriceUsdCents: number,
  locale: Locale,
  currency?: CurrencyCode
): { amount: number; formatted: string; currency: CurrencyCode } {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;
  const convertedAmount = convertCurrency(basePriceUsdCents, targetCurrency);

  return {
    amount: convertedAmount,
    formatted: formatCurrencyFromCents(convertedAmount, locale, targetCurrency),
    currency: targetCurrency,
  };
}

/**
 * Get judge payout for private submissions
 */
export function getJudgePayoutForPrivate(locale: Locale, currency?: CurrencyCode) {
  return getLocalizedPrice(JUDGE_PAYOUTS.privateSubmission, locale, currency);
}

/**
 * Format a comparison price (e.g., "Therapist: $200/hour")
 */
export function formatComparisonPrice(
  priceUsd: number,
  locale: Locale,
  currency?: CurrencyCode
): string {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;
  const convertedAmount = (priceUsd * EXCHANGE_RATES[targetCurrency]);

  return formatCurrency(convertedAmount, locale, targetCurrency);
}

/**
 * Get Stripe-compatible currency code
 */
export function getStripeCurrency(locale: Locale, currency?: CurrencyCode): string {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;
  return targetCurrency.toLowerCase();
}

/**
 * Supported currencies for checkout
 */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'ILS'];

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currency: string): currency is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(currency as CurrencyCode);
}