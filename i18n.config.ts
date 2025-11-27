export const locales = ['en', 'es', 'de', 'fr', 'ja', 'zh', 'ar', 'he'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// RTL languages
export const rtlLocales: Locale[] = ['ar', 'he'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Language names for display
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
  he: 'עברית',
};

// Currency defaults by locale
export const localeCurrencies: Record<Locale, string> = {
  en: 'USD',
  es: 'EUR',
  de: 'EUR',
  fr: 'EUR',
  ja: 'JPY',
  zh: 'CNY',
  ar: 'AED',
  he: 'ILS',
};
