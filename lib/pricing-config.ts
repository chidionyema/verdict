/**
 * Pricing Configuration System
 * 
 * This module handles dynamic pricing for the private submission path.
 * Prices can be configured via environment variables or fetched from a database.
 */

export interface PriceConfig {
  amount: number;
  currency: string;
  formatted: string;
}

export interface PricingConfig {
  private_submission: {
    gbp: PriceConfig;
    usd: PriceConfig;
    eur: PriceConfig;
  };
}

// Default prices (fallback if env vars not set)
const DEFAULT_PRICES = {
  private_submission: {
    gbp: { amount: 3.00, currency: 'GBP', formatted: '£3' },
    usd: { amount: 3.99, currency: 'USD', formatted: '$3.99' },
    eur: { amount: 3.50, currency: 'EUR', formatted: '€3.50' },
  }
};

/**
 * Get pricing configuration from environment variables or defaults
 */
export function getPricingConfig(): PricingConfig {
  const privateGBP = process.env.NEXT_PUBLIC_PRIVATE_PRICE_GBP 
    ? parseFloat(process.env.NEXT_PUBLIC_PRIVATE_PRICE_GBP)
    : DEFAULT_PRICES.private_submission.gbp.amount;
    
  const privateUSD = process.env.NEXT_PUBLIC_PRIVATE_PRICE_USD
    ? parseFloat(process.env.NEXT_PUBLIC_PRIVATE_PRICE_USD)
    : DEFAULT_PRICES.private_submission.usd.amount;
    
  const privateEUR = process.env.NEXT_PUBLIC_PRIVATE_PRICE_EUR
    ? parseFloat(process.env.NEXT_PUBLIC_PRIVATE_PRICE_EUR)
    : DEFAULT_PRICES.private_submission.eur.amount;

  return {
    private_submission: {
      gbp: {
        amount: privateGBP,
        currency: 'GBP',
        formatted: formatPrice(privateGBP, 'GBP')
      },
      usd: {
        amount: privateUSD,
        currency: 'USD',
        formatted: formatPrice(privateUSD, 'USD')
      },
      eur: {
        amount: privateEUR,
        currency: 'EUR',
        formatted: formatPrice(privateEUR, 'EUR')
      }
    }
  };
}

/**
 * Format price with currency symbol
 */
function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€'
  };
  
  const symbol = symbols[currency] || currency;
  
  // For GBP, show whole numbers without decimals if .00
  if (currency === 'GBP' && amount % 1 === 0) {
    return `${symbol}${amount}`;
  }
  
  // Otherwise show 2 decimal places
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get price for a specific currency
 */
export function getPrivateSubmissionPrice(currency: 'gbp' | 'usd' | 'eur' = 'gbp'): PriceConfig {
  const config = getPricingConfig();
  return config.private_submission[currency];
}

/**
 * Get price based on user's locale
 */
export function getPrivateSubmissionPriceForLocale(locale: string): PriceConfig {
  // Map locales to currencies
  const localeToCurrency: Record<string, 'gbp' | 'usd' | 'eur'> = {
    'en-GB': 'gbp',
    'en-US': 'usd',
    'en': 'gbp', // Default English to GBP
    'fr': 'eur',
    'de': 'eur',
    'es': 'eur',
    // Add more locale mappings as needed
  };
  
  const currency = localeToCurrency[locale] || 'gbp';
  return getPrivateSubmissionPrice(currency);
}