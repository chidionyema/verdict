'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function CareerDecisionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="career-decisions-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Verdict – Career Decision Feedback',
            description:
              'Get anonymous feedback from expert judges on your career decisions: job offers, interviews, salary negotiations, and moving cities.',
            serviceType: 'Career advice',
          }),
        }}
      />

      <HeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stuck on a Career Decision?
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Job offer, promotion, changing careers, or moving cities—Verdict gives you fast,
            anonymous feedback from real people who&apos;ve been there.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
            <li>Compare multiple job offers with unbiased perspectives</li>
            <li>Get feedback on your salary negotiation email before you send it</li>
            <li>Sense‑check big decisions like moving cities or changing industries</li>
          </ul>
          <button
            onClick={() => router.push('/start?category=decision')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
          >
            Get Career Feedback in Minutes
          </button>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}


