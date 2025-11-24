import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FloatingActionButton from "@/components/FloatingActionButton";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main>{children}</main>
        <FloatingActionButton />
      </body>
    </html>
  );
}
