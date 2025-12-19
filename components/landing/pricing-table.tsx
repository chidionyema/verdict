'use client';

import { Check, Clock, Sparkles, Shirt, Briefcase, Heart, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { useLocalizedPricing } from '@/hooks/use-pricing';

export function PricingTableSection() {
  const pricing = useLocalizedPricing();

  const PATHS = [
    {
      name: 'Earn Credits (Free)',
      badge: 'Community Mode',
      path: 'free',
      cost: '£0',
      costDetail: 'Your time (~15 min)',
      verdicts: '3 comprehensive reports',
      delivery: 'After earning credits',
      steps: [
        'Review 3 submissions in feed',
        'Earn 1 credit automatically',
        'Submit your request (public)',
        'Get 3 feedback reports',
      ],
      features: [
        '✅ No payment required',
        '✅ Community participation',
        '✅ Earn unlimited credits',
        '⏱️ Requires ~15 minutes (judging)',
        '👁️ Public (appears in feed)',
      ],
      ctaText: 'Start Reviewing Free',
      ctaAction: () => window.location.href = '/feed',
      highlight: false,
    },
    {
      name: `Pay Privately (${pricing.privatePrice})`,
      badge: 'Instant Access',
      path: 'paid',
      cost: pricing.privatePrice,
      costDetail: 'One-time payment',
      verdicts: '3 comprehensive reports',
      delivery: 'within 2 hours',
      steps: [
        `Pay ${pricing.privatePrice} (no judging required)`,
        'Submit your request privately',
        'Get 3 feedback reports',
        'Completely confidential',
      ],
      features: [
        '✅ No time required',
        '✅ Completely private',
        '✅ Faster responses (<1 hour)',
        '✅ Skip judging entirely',
        `💰 Costs ${pricing.privatePrice} per request`,
      ],
      ctaText: 'Submit Privately',
      ctaAction: () => window.location.href = '/submit',
      highlight: true,
    },
  ];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Two Ways to Get Feedback
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Choose the path that fits your needs: Earn free credits by judging others, or pay {pricing.privatePrice} for instant private results. Both get you 3 honest feedback reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {PATHS.map((path) => (
            <div
              key={path.name}
              className={`rounded-2xl p-6 md:p-8 bg-white shadow-lg border-2 ${
                path.highlight
                  ? 'border-purple-500 ring-2 ring-purple-100 relative'
                  : 'border-green-200'
              }`}
            >
              {path.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-md">
                  Instant
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{path.name}</h3>
                <p className="text-xs uppercase tracking-wide text-gray-600 mt-1">
                  {path.badge}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-gray-900">{path.cost}</p>
                <p className="text-sm text-gray-500">{path.costDetail}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">{path.verdicts}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  {path.delivery}
                </p>
              </div>

              {/* Steps */}
              <div className="mb-6 space-y-3">
                {path.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      path.path === 'free' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm mb-6">
                {path.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>

              <TouchButton
                onClick={path.ctaAction}
                className={`w-full justify-center mt-auto min-h-[48px] ${
                  path.highlight
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {path.ctaText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </TouchButton>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center max-w-3xl mx-auto">
          Pricing table is indicative of typical bundles. Inside the app you purchase credits that
          can be used flexibly across any request type.
        </p>
      </div>
    </section>
  );
}


