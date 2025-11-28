import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FloatingActionButton from "@/components/FloatingActionButton";
import { ToastContainer } from "@/components/ui/toast";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { isRTL, type Locale, locales } from "@/i18n.config";
import { generateAlternateLinks } from "@/lib/i18n-metadata";
import { NORTH_STAR_TAGLINE } from "@/lib/copy";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Verdict - Fast, anonymous second opinions from real people",
    template: "%s | Verdict",
  },
  description: NORTH_STAR_TAGLINE,
  keywords: ["decision help", "life advice", "honest feedback", "crowd wisdom", "career advice", "relationship advice", "life decisions", "anonymous feedback"],
  authors: [{ name: "Verdict" }],
  creator: "Verdict",
  alternates: {
    languages: generateAlternateLinks('/'),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Verdict - Fast, anonymous second opinions from real people",
    description: NORTH_STAR_TAGLINE,
    siteName: "Verdict",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdict - Fast, anonymous second opinions from real people",
    description: NORTH_STAR_TAGLINE,
    creator: "@verdict",
  },
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  // Get footer translations with type safety
  const legalMessages = (messages as Record<string, unknown>).Legal as Record<string, unknown> | undefined;
  const footerMessages = {
    copyright: (legalMessages?.footer as Record<string, string>)?.copyright || `© {year} Verdict. All rights reserved.`,
    terms: (legalMessages?.footer as Record<string, string>)?.terms || 'Terms of Service',
    privacy: (legalMessages?.footer as Record<string, string>)?.privacy || 'Privacy Policy',
    cookies: (legalMessages?.footer as Record<string, string>)?.cookies || 'Cookie Policy',
  };

  return (
    <html lang={locale} dir={dir}>
      <head>
        {/* Performance: preconnect to API/Stripe origins and fonts */}
        <link rel="preconnect" href="https://api.verdict.app" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* hreflang tags for SEO */}
        {locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${process.env.NEXT_PUBLIC_APP_URL || ''}${l === 'en' ? '' : `/${l}`}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={process.env.NEXT_PUBLIC_APP_URL || ''}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <Navigation />
          <main>{children}</main>

          {/* Global footer with legal links */}
          <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-8">
            <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <p className="text-center sm:text-start">
                {footerMessages.copyright.replace('{year}', String(new Date().getFullYear()))}
              </p>
              <div className="flex items-center gap-4">
                <LocaleSwitcher />
                <Link
                  href="/legal/terms"
                  className="hover:text-gray-900 underline-offset-4 hover:underline"
                >
                  {footerMessages.terms}
                </Link>
                <Link
                  href="/legal/privacy"
                  className="hover:text-gray-900 underline-offset-4 hover:underline"
                >
                  {footerMessages.privacy}
                </Link>
                <Link
                  href="/legal/cookies"
                  className="hover:text-gray-900 underline-offset-4 hover:underline"
                >
                  {footerMessages.cookies}
                </Link>
              </div>
            </div>
          </footer>

          <FloatingActionButton />
          <ToastContainer />
          <CookieConsentBanner />
          <AnalyticsProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
