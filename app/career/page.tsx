'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Briefcase, FileText, Mail, Shield, Clock, CheckCircle, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { SampleVerdictCard } from '@/components/landing/sample-verdict-card';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

export default function CareerLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* SEO Schema */}
      <Script
        id="career-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'AskVerdict – Career Feedback & Professional Advice',
            description:
              'Get professional feedback on your resume, emails, and job decisions from verified reviewers. Make better career moves with honest, actionable advice.',
            serviceType: 'Career advice and professional feedback',
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
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6">
            Get professional feedback on your resume, emails, and job decisions
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Make better career moves with honest, actionable advice from verified professionals. Get 3 comprehensive feedback reports that help you stand out.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => router.push('/start-simple?category=writing&subcategory=career')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px] inline-flex items-center gap-2"
            >
              Get Career Feedback
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
              <span className="text-sm font-medium text-gray-900">Verified Professionals</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">3 Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What you can get feedback on
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Resumes & Cover Letters</h3>
              <p className="text-gray-600 mb-4">
                Get feedback on formatting, content, and how to stand out to recruiters.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ATS optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Content clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Professional presentation</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Professional Emails</h3>
              <p className="text-gray-600 mb-4">
                Perfect your communication before sending important emails.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tone & professionalism</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Clarity & conciseness</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Call-to-action effectiveness</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Job Decisions</h3>
              <p className="text-gray-600 mb-4">
                Get perspective on job offers, salary negotiations, and career moves.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Offer evaluation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Career path advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Negotiation strategies</span>
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
                Why career feedback matters
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Resume errors cost opportunities</p>
                    <p className="text-gray-600 text-sm">One typo or formatting issue can get your resume rejected</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Friends aren't experts</p>
                    <p className="text-gray-600 text-sm">They mean well, but may not know what recruiters actually want</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">You're too close to see problems</p>
                    <p className="text-gray-600 text-sm">You've read your resume 100 times—you're blind to issues</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Get professional feedback that works
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">3 detailed feedback reports</p>
                    <p className="text-gray-600 text-sm">Ratings, strengths, specific improvements, and actionable recommendations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">From verified professionals</p>
                    <p className="text-gray-600 text-sm">Reviewers are vetted for expertise and quality feedback</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anonymous & honest</p>
                    <p className="text-gray-600 text-sm">Get brutally honest feedback without professional judgment</p>
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Upload Your Content</h3>
              <p className="text-gray-600 text-sm">
                Share your resume, email, or describe your career situation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Get 3 Reports</h3>
              <p className="text-gray-600 text-sm">
                Receive comprehensive feedback from verified professionals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Improve & Succeed</h3>
              <p className="text-gray-600 text-sm">
                Apply feedback and make better career decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingTableSection />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to advance your career?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get professional feedback from verified reviewers in under an hour. Make better career moves with confidence.
          </p>
          <button
            onClick={() => router.push('/start-simple?category=writing&subcategory=career')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[48px]"
          >
            Get My Career Feedback
          </button>
        </div>
      </section>
    </div>
  );
}

