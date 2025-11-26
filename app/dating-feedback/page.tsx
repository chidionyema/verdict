'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function DatingFeedbackPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="dating-feedback-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Verdict – Dating Profile Feedback',
            description:
              'Get anonymous feedback from strangers on your dating photos, prompts, and messages before you swipe.',
            serviceType: 'Dating profile review',
          }),
        }}
      />

      <HeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Make Your Dating Profile Actually Work
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Before you spend weeks wondering why no one matches, get blunt, anonymous feedback on
            your photos, prompts, and messages.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
            <li>Ask which photo gets more matches</li>
            <li>Check if your prompts sound confident or cringe</li>
            <li>Test first messages before you send them</li>
          </ul>
          <button
            onClick={() => router.push('/start?category=appearance')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
          >
            Get Dating Profile Feedback
          </button>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}


