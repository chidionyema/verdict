import { type Locale, localeCurrencies } from '@/i18n.config';
import { type CurrencyCode, formatCurrency, formatCurrencyFromCents } from './i18n-format';

/**
 * Multi-currency pricing system
 * Supports different currencies with automatic conversion
 */

// Exchange rates relative to USD (updated periodically)
// In production, you'd fetch these from an API
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  AED: 3.67,
  ILS: 3.70,
};

// Base prices in USD cents
export const BASE_PRICES_USD = {
  verdict: {
    basic: 300,      // £3.00 - 3 concise reviews for simple decisions
    detailed: 499,   // $4.99 - Full written feedback for complex decisions
  },
  credits: {
    starter: { amount: 5, price: 1745 },     // $17.45
    popular: { amount: 10, price: 3490 },    // $34.90
    value: { amount: 25, price: 8725 },      // $87.25
    pro: { amount: 50, price: 17450 },       // $174.50
  },
  judgePayout: {
    basic: 25,       // $0.25 per reviewer for basic feedback
    detailed: 75,    // $0.75 per reviewer for detailed feedback
  },
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
 * Get verdict tier pricing for a locale
 */
export function getVerdictTierPricing(locale: Locale, currency?: CurrencyCode) {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;

  return {
    basic: {
      price: getLocalizedPrice(BASE_PRICES_USD.verdict.basic, locale, targetCurrency),
      judgePayout: getLocalizedPrice(BASE_PRICES_USD.judgePayout.basic, locale, targetCurrency),
      verdicts: 3,
    },
    detailed: {
      price: getLocalizedPrice(BASE_PRICES_USD.verdict.detailed, locale, targetCurrency),
      judgePayout: getLocalizedPrice(BASE_PRICES_USD.judgePayout.detailed, locale, targetCurrency),
      verdicts: 3,
    },
  };
}

/**
 * Get credit package pricing for a locale
 */
export function getCreditPackagePricing(locale: Locale, currency?: CurrencyCode) {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;

  return {
    starter: {
      credits: BASE_PRICES_USD.credits.starter.amount,
      price: getLocalizedPrice(BASE_PRICES_USD.credits.starter.price, locale, targetCurrency),
    },
    popular: {
      credits: BASE_PRICES_USD.credits.popular.amount,
      price: getLocalizedPrice(BASE_PRICES_USD.credits.popular.price, locale, targetCurrency),
      badge: 'mostPopular' as const,
    },
    value: {
      credits: BASE_PRICES_USD.credits.value.amount,
      price: getLocalizedPrice(BASE_PRICES_USD.credits.value.price, locale, targetCurrency),
      badge: 'bestValue' as const,
    },
    pro: {
      credits: BASE_PRICES_USD.credits.pro.amount,
      price: getLocalizedPrice(BASE_PRICES_USD.credits.pro.price, locale, targetCurrency),
    },
  };
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
 * Stripe uses lowercase 3-letter codes
 */
export function getStripeCurrency(locale: Locale, currency?: CurrencyCode): string {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;
  return targetCurrency.toLowerCase();
}

/**
 * Get price in smallest currency unit for Stripe
 */
export function getStripePriceAmount(
  basePriceUsdCents: number,
  locale: Locale,
  currency?: CurrencyCode
): number {
  const targetCurrency = currency || localeCurrencies[locale] as CurrencyCode;
  const converted = convertCurrency(basePriceUsdCents, targetCurrency);

  // For zero-decimal currencies, amount is already in the correct unit
  if (['JPY'].includes(targetCurrency)) {
    return converted;
  }

  // For most currencies, Stripe expects amount in cents
  return converted;
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
