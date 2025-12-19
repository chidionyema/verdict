/**
 * Localization and Currency Configuration
 * Handles dynamic pricing based on user location
 */

// Currency configurations
export const CURRENCY_CONFIG = {
  USD: {
    code: 'USD',
    symbol: '$',
    position: 'before', // $3.49
    privateSubmissionCents: 349, // $3.49
    region: 'US',
    countryCode: 'US',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    position: 'before', // £3.00
    privateSubmissionCents: 300, // £3.00
    region: 'UK',
    countryCode: 'GB',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    position: 'after', // 3.49€
    privateSubmissionCents: 329, // €3.29
    region: 'EU',
    countryCode: 'EU',
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;
export type CurrencyConfig = typeof CURRENCY_CONFIG[CurrencyCode];

/**
 * Detect user's currency based on various signals
 */
export function detectUserCurrency(): CurrencyCode {
  // Server-side fallback
  if (typeof window === 'undefined') {
    return 'USD';
  }

  try {
    // Check all preferred languages (more comprehensive)
    const languages = navigator.languages || [navigator.language];

    // Check for UK locale in any preferred language
    for (const lang of languages) {
      if (lang.includes('GB') || lang === 'en-GB') {
        return 'GBP';
      }
    }

    // Check timezone as fallback for UK users
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Europe/London' || timezone.startsWith('Europe/London')) {
      return 'GBP';
    }

    // Check for EU locales
    const euLocales = ['de', 'fr', 'es', 'it', 'nl', 'pt', 'pl', 'se', 'dk', 'at', 'be', 'fi', 'gr', 'ie'];
    for (const lang of languages) {
      if (euLocales.some(eu => lang.startsWith(eu))) {
        return 'EUR';
      }
    }

    // EU timezones as fallback
    const euTimezones = ['Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Dublin'];
    if (euTimezones.some(tz => timezone.startsWith(tz) || timezone === tz)) {
      return 'EUR';
    }

    // Default to USD for US and other regions
    return 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Get currency configuration for user
 */
export function getUserCurrencyConfig(): CurrencyConfig {
  const currency = detectUserCurrency();
  return CURRENCY_CONFIG[currency];
}

/**
 * Format price with proper currency symbol and positioning
 */
export function formatPrice(cents: number, currencyCode?: CurrencyCode): string {
  const currency = currencyCode ? CURRENCY_CONFIG[currencyCode] : getUserCurrencyConfig();
  const amount = (cents / 100).toFixed(2);
  
  if (currency.position === 'before') {
    return `${currency.symbol}${amount}`;
  } else {
    return `${amount}${currency.symbol}`;
  }
}

/**
 * Get localized private submission price
 */
export function getPrivateSubmissionPrice(): {
  cents: number;
  formatted: string;
  currency: CurrencyConfig;
} {
  const currency = getUserCurrencyConfig();
  
  return {
    cents: currency.privateSubmissionCents,
    formatted: formatPrice(currency.privateSubmissionCents, currency.code),
    currency,
  };
}

/**
 * Get pricing text for different paths
 */
export function getPricingTexts() {
  const { formatted, currency } = getPrivateSubmissionPrice();
  
  return {
    privateSubmissionPrice: formatted,
    freePath: `Judge 3 → Earn 1 credit`,
    paidPath: `Pay ${formatted} → Skip judging`,
    currencyCode: currency.code,
    region: currency.region,
  };
}

/**
 * Schema.org structured data price
 */
export function getSchemaPrice(): {
  price: string;
  priceCurrency: string;
} {
  const { cents, currency } = getPrivateSubmissionPrice();
  
  return {
    price: (cents / 100).toFixed(2),
    priceCurrency: currency.code,
  };
}

/**
 * Localized delivery promises
 */
export const DELIVERY_PROMISES = {
  private: {
    hours: 2,
    text: 'within 2 hours',
  },
  community: {
    hours: 4,
    text: 'within 4 hours',
  },
} as const;

/**
 * Dynamic configuration based on user location
 */
export function getLocalizedConfig() {
  const pricing = getPricingTexts();
  
  return {
    pricing,
    delivery: DELIVERY_PROMISES,
    judgments: {
      required: 3,
      creditsEarned: 1,
      estimatedTime: '15 minutes',
    },
    feedback: {
      reportsCount: 3,
      guaranteed: true,
    },
  };
}