import { type Locale, localeCurrencies } from '@/i18n.config';

/**
 * Internationalization formatting utilities
 * All formatting functions use the Intl API for locale-aware formatting
 */

// ============================================
// DATE FORMATTING
// ============================================

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full';

/**
 * Format a date according to locale conventions
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  style: DateFormatStyle = 'medium'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  const optionsMap: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };

  return new Intl.DateTimeFormat(locale, optionsMap[style]).format(dateObj);
}

/**
 * Format a time according to locale conventions
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale,
  includeSeconds = false
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  }).format(dateObj);
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  dateStyle: DateFormatStyle = 'medium'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle: 'short',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second');
  } else if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  } else if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day');
  } else if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(diffInWeeks, 'week');
  } else if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  } else {
    return rtf.format(diffInYears, 'year');
  }
}

// ============================================
// CURRENCY FORMATTING
// ============================================

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AED' | 'ILS';

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency?: CurrencyCode
): string {
  const currencyCode = currency || localeCurrencies[locale] as CurrencyCode;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    // For JPY and other zero-decimal currencies, don't show decimals
    minimumFractionDigits: ['JPY', 'CNY'].includes(currencyCode) ? 0 : 2,
    maximumFractionDigits: ['JPY', 'CNY'].includes(currencyCode) ? 0 : 2,
  }).format(amount);
}

/**
 * Format currency from cents (for Stripe integration)
 */
export function formatCurrencyFromCents(
  amountInCents: number,
  locale: Locale,
  currency?: CurrencyCode
): string {
  const currencyCode = currency || localeCurrencies[locale] as CurrencyCode;

  // JPY and other zero-decimal currencies don't need division
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  const amount = zeroDecimalCurrencies.includes(currencyCode)
    ? amountInCents
    : amountInCents / 100;

  return formatCurrency(amount, locale, currencyCode);
}

/**
 * Get just the currency symbol for a locale
 */
export function getCurrencySymbol(locale: Locale, currency?: CurrencyCode): string {
  const currencyCode = currency || localeCurrencies[locale] as CurrencyCode;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value || currencyCode;
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(
  num: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format a number as a percentage
 */
export function formatPercent(
  num: number,
  locale: Locale,
  decimals = 0
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number in compact notation (e.g., 1K, 1M)
 */
export function formatCompactNumber(
  num: number,
  locale: Locale
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format a decimal number with specific precision
 */
export function formatDecimal(
  num: number,
  locale: Locale,
  decimals = 2
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// ============================================
// LIST FORMATTING
// ============================================

/**
 * Format a list of items according to locale conventions
 */
export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, {
    style: 'long',
    type,
  }).format(items);
}

// ============================================
// PLURALIZATION HELPERS
// ============================================

/**
 * Get plural category for a number (zero, one, two, few, many, other)
 */
export function getPluralCategory(
  num: number,
  locale: Locale
): Intl.LDMLPluralRule {
  return new Intl.PluralRules(locale).select(num);
}

// ============================================
// DISPLAY NAMES
// ============================================

/**
 * Get display name for a language code
 */
export function getLanguageDisplayName(
  languageCode: string,
  displayLocale: Locale
): string {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(languageCode) || languageCode;
  } catch {
    return languageCode;
  }
}

/**
 * Get display name for a region/country code
 */
export function getRegionDisplayName(
  regionCode: string,
  displayLocale: Locale
): string {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'region' }).of(regionCode) || regionCode;
  } catch {
    return regionCode;
  }
}

/**
 * Get display name for a currency code
 */
export function getCurrencyDisplayName(
  currencyCode: string,
  displayLocale: Locale
): string {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'currency' }).of(currencyCode) || currencyCode;
  } catch {
    return currencyCode;
  }
}
