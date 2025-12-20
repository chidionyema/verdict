import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Locale configuration
const locales = ['en', 'es', 'de', 'fr', 'ja', 'zh', 'ar', 'he'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

async function getLocaleFromRequest(): Promise<Locale> {
  try {
    // Try to get locale from cookie first
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

    if (localeCookie && (locales as readonly string[]).includes(localeCookie)) {
      return localeCookie as Locale;
    }

    // Then try Accept-Language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
      const browserLocale = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().substring(0, 2))
        .find(lang => (locales as readonly string[]).includes(lang));

      if (browserLocale) {
        return browserLocale as Locale;
      }
    }
  } catch {
    // During static generation, cookies() and headers() are not available
    // Fall through to default locale
  }

  return defaultLocale;
}

async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'es':
      return (await import('../messages/es.json')).default;
    case 'de':
      return (await import('../messages/de.json')).default;
    case 'fr':
      return (await import('../messages/fr.json')).default;
    case 'ja':
      return (await import('../messages/ja.json')).default;
    case 'zh':
      return (await import('../messages/zh.json')).default;
    case 'ar':
      return (await import('../messages/ar.json')).default;
    case 'he':
      return (await import('../messages/he.json')).default;
    default:
      return (await import('../messages/en.json')).default;
  }
}

export default getRequestConfig(async () => {
  try {
    const locale = await getLocaleFromRequest();
    const messages = await loadMessages(locale);

    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error('Error loading locale configuration:', error);
    // Fallback to default configuration
    const messages = await loadMessages(defaultLocale);
    return {
      locale: defaultLocale,
      messages,
    };
  }
});
