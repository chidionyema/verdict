import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FloatingActionButton from "@/components/FloatingActionButton";
import { ToastContainer } from "@/components/ui/toast";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { AnalyticsProvider } from "@/components/analytics-provider";

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
    default: "Verdict - Get Wisdom from Real People in Minutes",
    template: "%s | Verdict",
  },
  description: "Life's tough decisions made clearer. Get honest feedback from 10 real people in just minutes. Career choices, relationships, life decisions - ask anything.",
  keywords: ["decision help", "life advice", "honest feedback", "crowd wisdom", "career advice", "relationship advice", "life decisions", "anonymous feedback"],
  authors: [{ name: "Verdict" }],
  creator: "Verdict",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Verdict - Get Wisdom from Real People in Minutes",
    description: "Life's tough decisions made clearer. Get honest feedback from 10 real people in just minutes.",
    siteName: "Verdict",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdict - Get Wisdom from Real People in Minutes",
    description: "Life's tough decisions made clearer. Get honest feedback from 10 real people in just minutes.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Performance: preconnect to API/Stripe origins and fonts */}
        <link rel="preconnect" href="https://api.verdict.app" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main>{children}</main>

        {/* Global footer with legal links */}
        <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-8">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Verdict. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/legal/terms"
                className="hover:text-gray-900 underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/legal/privacy"
                className="hover:text-gray-900 underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/cookies"
                className="hover:text-gray-900 underline-offset-4 hover:underline"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </footer>

        <FloatingActionButton />
        <ToastContainer />
        <CookieConsentBanner />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
