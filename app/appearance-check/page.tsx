'use client';

import { EconomyHeroSection } from '@/components/landing/EconomyHeroSection';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { NORTH_STAR_TAGLINE } from '@/lib/copy';

export default function AppearanceCheckPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Structured data for SEO */}
      <Script
        id="appearance-check-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Verdict – Appearance & Outfit Feedback',
            description:
              'Get anonymous feedback on outfits and looks before interviews, dates, or important events.',
            serviceType: 'Appearance advice',
          }),
        }}
      />

      <EconomyHeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sense‑check your look before it really matters
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Interviews, first dates, big presentations — get fast, anonymous second opinions on your outfit or overall
            look so you can walk in confident. {NORTH_STAR_TAGLINE}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Perfect for questions like:
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>“Is this outfit professional enough for a final‑round interview?”</li>
                <li>“Do these photos look like me or too filtered?”</li>
                <li>“Which of these two looks is better for a first date?”</li>
                <li>“Does this style fit the event dress code?”</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                What an appearance verdict looks like
              </h3>
              <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
                Sample (anonymised)
              </p>
              <p className="text-sm text-gray-700 italic mb-3">
                “I&apos;m interviewing at a tech company tomorrow. Is this outfit too casual?”
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">
                  Verdict: <span className="text-green-700">You&apos;re in the right zone — make two small tweaks.</span>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>“Swap the trainers for simple leather shoes to look more polished.”</li>
                  <li>“Lose the loud logo tee; a plain shirt keeps the focus on you.”</li>
                  <li>“Overall this reads as friendly and competent, not overdressed.”</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => router.push('/submit?category=appearance')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
            >
              Get appearance feedback in minutes
            </button>
            <p className="text-sm text-gray-500 max-w-md">
              Upload a photo, choose “Appearance”, and get 3 honest opinions from real people before you walk out the
              door.
            </p>
          </div>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}


