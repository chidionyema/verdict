'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Shirt, Sparkles, Clock, Shield, CheckCircle, Star, ArrowRight, Camera } from 'lucide-react';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { SampleVerdictCard } from '@/components/landing/sample-verdict-card';
import Link from 'next/link';

export default function StyleLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* SEO Schema */}
      <Script
        id="style-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'AskVerdict – Outfit & Style Feedback',
            description:
              'Get honest feedback on your outfits from real people. Perfect for outfit checks, style advice, and fashion decisions.',
            serviceType: 'Style and fashion advice',
            areaServed: 'Worldwide',
            offers: {
              '@type': 'Offer',
              price: '1.99',
              priceCurrency: 'USD',
            },
          }),
        }}
      />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 mb-6">
            Get honest feedback on your outfits
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stop second-guessing your outfit choices. Get quick, honest feedback from real people in under an hour. Perfect for important events, dates, or just daily style decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => router.push('/start-simple?category=appearance&subcategory=fashion')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px] inline-flex items-center gap-2"
            >
              Get Outfit Feedback
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 underline text-sm"
            >
              ← Back to home
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <Shield className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">100% Anonymous</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Under 1 Hour</span>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Vetted Reviewers</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">3 Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perfect for any style question
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shirt className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Daily Outfit Checks</h3>
              <p className="text-gray-600 mb-4">
                Get quick feedback on your everyday outfits before you leave the house.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Color combinations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Fit & proportions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Style appropriateness</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 border border-pink-100">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Special Events</h3>
              <p className="text-gray-600 mb-4">
                Make sure you're dressed right for important occasions.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Date nights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Job interviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Weddings & parties</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Shopping Decisions</h3>
              <p className="text-gray-600 mb-4">
                Get feedback before you buy to avoid fashion regrets.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Purchase decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Style compatibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Value assessment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why you need outfit feedback
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">You can't see yourself objectively</p>
                    <p className="text-gray-600 text-sm">You've been staring in the mirror for 20 minutes—you're not sure anymore</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Friends are too nice</p>
                    <p className="text-gray-600 text-sm">They'll say "you look fine" even when something's off</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Style regrets are expensive</p>
                    <p className="text-gray-600 text-sm">Wrong outfit choices waste time and money</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Get honest feedback instantly
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Quick ratings & brief comments</p>
                    <p className="text-gray-600 text-sm">Perfect for simple outfit checks—fast and affordable</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anonymous & brutally honest</p>
                    <p className="text-gray-600 text-sm">Reviewers have no reason to sugar-coat—they'll tell you the truth</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Decide with confidence</p>
                    <p className="text-gray-600 text-sm">Know you're making the right choice before you walk out the door</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Verdict Card */}
      <SampleVerdictCard />

      {/* How It Works */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Snap Your Outfit</h3>
              <p className="text-gray-600 text-sm">
                Take a photo of your outfit or describe what you're wearing
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Get 3 Quick Ratings</h3>
              <p className="text-gray-600 text-sm">
                Receive honest feedback from real people in under an hour
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Dress with Confidence</h3>
              <p className="text-gray-600 text-sm">
                Make your decision and walk out the door knowing you look great
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingTableSection />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to stop second-guessing your outfits?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Get honest feedback from real people in under an hour. Quick, affordable, and brutally honest.
          </p>
          <button
            onClick={() => router.push('/start-simple?category=appearance&subcategory=fashion')}
            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px]"
          >
            Get My Outfit Feedback
          </button>
        </div>
      </section>
    </div>
  );
}

