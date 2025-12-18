'use client';

import { EconomyHeroSection } from '@/components/landing/EconomyHeroSection';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { NORTH_STAR_TAGLINE } from '@/lib/copy';

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

      <EconomyHeroSection />

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Make your next career move with confidence
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Job offer, promotion, changing careers, or moving cities — Verdict gives you fast,
            anonymous second opinions from people who&apos;ve been there.
          </p>

          {/* Problem framing / examples */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Perfect for questions like:
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>“Should I take this higher‑pay but riskier startup offer?”</li>
                <li>“Does this salary negotiation email sound fair or pushy?”</li>
                <li>“Is it too soon to switch industries into product management?”</li>
                <li>“Should I move cities for this role, or stay where I am?”</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                What a career verdict looks like
              </h3>
              <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
                Sample (anonymised)
              </p>
              <p className="text-sm text-gray-700 italic mb-3">
                “I have two offers: a stable corporate job vs a risky startup with equity.
                I&apos;m 28 and not sure which to pick.”
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">
                  Verdict: <span className="text-green-700">Lean toward the startup, with guardrails.</span>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>“Your risk profile (age, no dependents) makes this a good time to try.”</li>
                  <li>“Ask for a 6‑month review and clear leveling so you&apos;re not stuck.”</li>
                  <li>“If you don&apos;t take it, write down why — so you don&apos;t second‑guess later.”</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => router.push('/start-simple?category=decision')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
            >
              Get career feedback in minutes
            </button>
            <p className="text-sm text-gray-500 max-w-md">
              You&apos;ll upload your situation, pick “Career / decision”, and get 3 anonymous, detailed opinions
              you can actually act on.
            </p>
          </div>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}



