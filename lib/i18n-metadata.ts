import { Metadata } from 'next';
import { type Locale, locales, defaultLocale } from '@/i18n.config';

/**
 * Internationalized metadata utilities for SEO
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://verdict.app';

/**
 * Generate hreflang alternate links for all supported locales
 */
export function generateAlternateLinks(path: string = ''): Record<string, string> {
  const alternates: Record<string, string> = {};

  locales.forEach((locale) => {
    // For default locale, use the root path
    const localePath = locale === defaultLocale ? path : `/${locale}${path}`;
    alternates[locale] = `${APP_URL}${localePath}`;
  });

  // Add x-default pointing to default locale
  alternates['x-default'] = `${APP_URL}${path}`;

  return alternates;
}

/**
 * Generate canonical URL for a page
 */
export function generateCanonicalUrl(path: string, locale?: Locale): string {
  const localePath = locale && locale !== defaultLocale ? `/${locale}${path}` : path;
  return `${APP_URL}${localePath}`;
}

/**
 * Load localized metadata from translation files
 */
export async function getLocalizedMetadata(locale: Locale): Promise<{
  title: string;
  titleTemplate: string;
  description: string;
  keywords: string;
}> {
  try {
    const messages = await import(`@/messages/${locale}.json`);
    return {
      title: messages.Metadata?.title || 'Verdict',
      titleTemplate: messages.Metadata?.titleTemplate || '{title} | Verdict',
      description: messages.Metadata?.description || '',
      keywords: messages.Metadata?.keywords || '',
    };
  } catch {
    // Fallback to default locale
    const messages = await import(`@/messages/${defaultLocale}.json`);
    return {
      title: messages.Metadata?.title || 'Verdict',
      titleTemplate: messages.Metadata?.titleTemplate || '{title} | Verdict',
      description: messages.Metadata?.description || '',
      keywords: messages.Metadata?.keywords || '',
    };
  }
}

/**
 * Generate full page metadata with i18n support
 */
export async function generatePageMetadata(
  locale: Locale,
  page: string = '',
  overrides?: Partial<Metadata>
): Promise<Metadata> {
  const localizedMeta = await getLocalizedMetadata(locale);
  const canonicalPath = page ? `/${page}` : '';

  const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
      default: localizedMeta.title,
      template: localizedMeta.titleTemplate,
    },
    description: localizedMeta.description,
    keywords: localizedMeta.keywords.split(', '),
    authors: [{ name: 'Verdict' }],
    creator: 'Verdict',

    // Canonical and alternates
    alternates: {
      canonical: generateCanonicalUrl(canonicalPath, locale),
      languages: generateAlternateLinks(canonicalPath),
    },

    // Open Graph
    openGraph: {
      type: 'website',
      locale: getOpenGraphLocale(locale),
      url: generateCanonicalUrl(canonicalPath, locale),
      title: localizedMeta.title,
      description: localizedMeta.description,
      siteName: 'Verdict',
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: localizedMeta.title,
        },
      ],
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: localizedMeta.title,
      description: localizedMeta.description,
      creator: '@verdict',
      images: [`${APP_URL}/og-image.png`],
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Apply any overrides
    ...overrides,
  };

  return metadata;
}

/**
 * Get OpenGraph locale string
 */
function getOpenGraphLocale(locale: Locale): string {
  const ogLocales: Record<Locale, string> = {
    en: 'en_US',
    es: 'es_ES',
    de: 'de_DE',
    fr: 'fr_FR',
    ja: 'ja_JP',
    zh: 'zh_CN',
    ar: 'ar_SA',
    he: 'he_IL',
  };
  return ogLocales[locale] || 'en_US';
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Verdict',
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/verdict',
      // Add more social profiles as needed
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@verdict.com',
      contactType: 'customer service',
    },
  };
}

/**
 * Generate JSON-LD structured data for a FAQ page
 */
export function generateFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${APP_URL}${item.url}`,
    })),
  };
}

/**
 * Generate JSON-LD for a service/product
 */
export function generateServiceJsonLd(locale: Locale): object {
  const descriptions: Record<Locale, string> = {
    en: 'Get honest feedback from real people on your dating profile, life decisions, and more.',
    es: 'Obtén comentarios honestos de personas reales sobre tu perfil de citas, decisiones de vida y más.',
    de: 'Erhalte ehrliches Feedback von echten Menschen zu deinem Dating-Profil, Lebensentscheidungen und mehr.',
    fr: 'Obtenez des retours honnêtes de vraies personnes sur votre profil de rencontre, vos décisions de vie, et plus.',
    ja: 'マッチングプロフィール、人生の決断などについて、本物の人々から正直なフィードバックを得ましょう。',
    zh: '获取真人对您的约会资料、人生决定等的诚实反馈。',
    ar: 'احصل على تعليقات صادقة من أشخاص حقيقيين حول ملفك الشخصي للتعارف وقرارات الحياة والمزيد.',
    he: 'קבל משוב כנה מאנשים אמיתיים על פרופיל ההיכרויות שלך, החלטות חיים ועוד.',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Verdict',
    description: descriptions[locale] || descriptions.en,
    provider: {
      '@type': 'Organization',
      name: 'Verdict',
      url: APP_URL,
    },
    serviceType: 'Feedback Service',
    areaServed: 'Worldwide',
  };
}

/**
 * Generate JSON-LD script tag HTML string
 * Use this in your page components to add structured data
 */
export function getJsonLdScript(data: object): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}
