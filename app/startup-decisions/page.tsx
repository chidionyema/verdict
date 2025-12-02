'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { NORTH_STAR_TAGLINE } from '@/lib/copy';

export default function StartupDecisionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="startup-decisions-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Verdict – Startup & Product Decisions',
            description:
              'Get outside feedback on your pitch, landing page, pricing, or product decisions before you launch.',
            serviceType: 'Startup and product advice',
          }),
        }}
      />

      <HeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pressure‑test your startup decisions
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Before you ship that pricing page, pitch deck, or new feature, get fast, anonymous second opinions from real
            people. {NORTH_STAR_TAGLINE}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Perfect for questions like:
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>“Does this landing page explain what we do clearly?”</li>
                <li>“Is this pricing table confusing or fair?”</li>
                <li>“Which of these taglines feels more trustworthy?”</li>
                <li>“Would you sign up after seeing this email or onboarding flow?”</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                What a startup verdict looks like
              </h3>
              <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
                Sample (anonymised)
              </p>
              <p className="text-sm text-gray-700 italic mb-3">
                “Here&apos;s our new pricing page. As a potential customer, is this clear and would you consider buying?”
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">
                  Verdict: <span className="text-purple-700">Your offer is interesting, but the pricing feels risky.</span>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>“The three tiers look similar — I&apos;m not sure which one is for me.”</li>
                  <li>“Annual‑only pricing without a monthly option makes me hesitate to try it.”</li>
                  <li>“The &quot;no credit card required&quot; line is great; move it higher on the page.”</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => router.push('/start-simple?category=decision&subcategory=business')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
            >
              Get feedback on your startup decision
            </button>
            <p className="text-sm text-gray-500 max-w-md">
              Paste your pitch, link your landing page, or describe the decision, then choose “Decision / financial or
              business” to get 3 outside opinions.
            </p>
          </div>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}



