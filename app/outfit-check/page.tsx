'use client';

import { EconomyHeroSection } from '@/components/landing/EconomyHeroSection';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function OutfitCheckPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="outfit-check-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Verdict – Outfit Check Feedback',
            description:
              'Get anonymous style feedback from strangers on your outfit before interviews, dates, or important events.',
            serviceType: 'Outfit review',
          }),
        }}
      />

      <EconomyHeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Outfit Check Before It Really Matters
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Interview, first date, big presentation—get fast, honest feedback on your outfit from
            real people, not just your mirror.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
            <li>Ask &quot;Is this outfit professional enough?&quot;</li>
            <li>Compare two looks side‑by‑side before an event</li>
            <li>Make sure you&apos;re sending the signal you actually want to send</li>
          </ul>
          <button
            onClick={() => router.push('/start?category=appearance&media_type=photo')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
          >
            Upload an Outfit Photo
          </button>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}



