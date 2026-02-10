'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Heart, Camera, Shield, Clock, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { SampleVerdictCard } from '@/components/landing/sample-verdict-card';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

export default function DatingLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* SEO Schema */}
      <Script
        id="dating-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'AskVerdict – Dating Profile Feedback',
            description:
              'Get honest feedback on your dating profile photos from real people. Anonymous, fast, and brutally honest feedback.',
            serviceType: 'Dating profile advice',
            areaServed: 'Worldwide',
            offers: {
              '@type': 'Offer',
              price: '4.99',
              priceCurrency: 'USD',
            },
          }),
        }}
      />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 mb-6">
            Get honest feedback on your dating profile photos
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stop wondering why you're not getting matches. Get 3 comprehensive feedback reports from real people who'll tell you exactly what's working—and what isn't.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => router.push('/submit?category=profile&subcategory=dating')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px] inline-flex items-center gap-2"
            >
              Get Dating Profile Feedback
              <ArrowRight className="w-5 h-5" />
            </button>
            <BackButton href="/" label="Back to home" />
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <Shield className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">100% Anonymous</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Under 1 Hour</span>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Vetted Reviewers</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">3 Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why your dating profile isn't working
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Friends won't tell you the truth</p>
                    <p className="text-gray-600 text-sm">They're too nice to say your photos are blurry or your bio is boring</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">You can't see what others see</p>
                    <p className="text-gray-600 text-sm">You've been staring at the same photos for weeks—you're blind to problems</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Reddit feedback is overwhelming</p>
                    <p className="text-gray-600 text-sm">Too many opinions, lots of trolls, no structure</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Get the feedback that actually helps
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">3 structured feedback reports</p>
                    <p className="text-gray-600 text-sm">Ratings, specific strengths, improvements, and clear recommendations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anonymous & brutally honest</p>
                    <p className="text-gray-600 text-sm">Reviewers have no reason to sugar-coat—they'll tell you what's really wrong</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Get matched faster</p>
                    <p className="text-gray-600 text-sm">Fix your profile based on real feedback and start getting more matches</p>
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
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Upload Your Photos</h3>
              <p className="text-gray-600 text-sm">
                Share your dating profile photos or bio
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Get 3 Reports</h3>
              <p className="text-gray-600 text-sm">
                Receive comprehensive feedback from vetted reviewers
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Improve & Match</h3>
              <p className="text-gray-600 text-sm">
                Update your profile and start getting more matches
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingTableSection />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to improve your dating profile?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Get honest feedback from real people in under an hour. No sugar-coating, just results.
          </p>
          <button
            onClick={() => router.push('/submit?category=profile&subcategory=dating')}
            className="bg-white text-pink-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px]"
          >
            Get My Dating Profile Feedback
          </button>
        </div>
      </section>
    </div>
  );
}

