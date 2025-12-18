'use client';

import { EconomyHeroSection } from '@/components/landing/EconomyHeroSection';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { NORTH_STAR_TAGLINE } from '@/lib/copy';

export default function DatingFeedbackPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Structured data for SEO */}
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
              'Get anonymous feedback on your dating photos and bios so you can feel confident before you swipe.',
            serviceType: 'Dating profile advice',
          }),
        }}
      />

      <EconomyHeroSection />

      {/* Use‑case specific funnel */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get honest feedback on your dating profile
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            First impressions matter. Verdict gives you fast, anonymous second opinions on your photos and bios so
            you can stop guessing and start matching — {NORTH_STAR_TAGLINE.toLowerCase()}.
          </p>

          {/* Problem framing / examples */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Perfect for questions like:
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>“Which of these 3 photos should be my first picture on Hinge?”</li>
                <li>“Does this bio sound confident or cringe?”</li>
                <li>“Is my profile giving off the wrong vibe?”</li>
                <li>“Should I include this group photo or is it confusing?”</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                What a dating verdict looks like
              </h3>
              <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
                Sample (anonymised)
              </p>
              <p className="text-sm text-gray-700 italic mb-3">
                “Here are 3 photos I&apos;m thinking of using on my profile. Which should be first, and is my bio okay?”
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">
                  Verdict: <span className="text-indigo-700">Lead with Photo #2 and tighten your bio.</span>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>“Photo #2 feels the most natural and shows your face clearly — use that as your first.”</li>
                  <li>“Cut the last sentence of your bio; it reads a bit negative. End on the hobby line instead.”</li>
                  <li>“Swap the group picture for a solo shot so it&apos;s obvious who you are.”</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA into simplified start with profile/dating context */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => router.push('/start-simple?category=profile&subcategory=dating')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
            >
              Get dating profile feedback in minutes
            </button>
            <p className="text-sm text-gray-500 max-w-md">
              Upload your photos or bio, choose “Profile / dating”, and get 3 honest opinions from real people before
              you put yourself out there.
            </p>
          </div>
        </div>
      </section>

      <SocialProofSection />
      <PricingTableSection />
    </div>
  );
}



