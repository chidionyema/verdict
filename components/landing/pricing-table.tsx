'use client';

import { Check, Clock, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import { TouchButton } from '@/components/ui/touch-button';
import { VERDICT_TIERS } from '@/lib/validations';
import { getVerdictTierPricing } from '@/lib/pricing';
import type { Locale } from '@/i18n.config';

const BASIC_VERDICTS = VERDICT_TIERS.basic.verdicts;

export function PricingTableSection() {
  const locale = useLocale() as Locale;
  const verdictPricing = getVerdictTierPricing(locale);

  const basicPriceFormatted = verdictPricing.basic.price.formatted;

  const PLANS = [
    {
      name: 'Free trial',
      badge: 'Start here',
      verdicts: '3 opinions',
      delivery: '47min average',
      features: ['Test the experience', 'Honest feedback from real people', 'Completely anonymous'],
      limitations: [],
      price: 'Free',
      priceDetail: 'No credit card required',
      highlight: false,
    },
    {
      name: 'Pay per request',
      badge: 'Simple & transparent',
      verdicts: `${BASIC_VERDICTS} opinions (Basic tier)`,
      delivery: 'Most requests answered in under an hour',
      features: [
        'Pay only when you need a verdict',
        'Choose Basic, Standard, or Premium inside the app',
        'Same quality as your free trial',
      ],
      limitations: [],
      price: basicPriceFormatted,
      priceDetail: 'per Basic request (higher tiers available in app)',
      highlight: true,
    },
    {
      name: 'Power users',
      badge: 'Coming soon',
      verdicts: 'Subscription plans',
      delivery: 'Priority queue',
      features: [
        'Best value for regular users',
        'Faster responses',
        'Premium reviewers',
      ],
      limitations: ['Subscriptions are not yet available – one-off requests only for now.'],
      price: 'Coming soon',
      priceDetail: '',
      highlight: false,
    },
  ];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Try free, then pay only when you need more opinions. No hidden fees, no complex tiers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 md:p-8 bg-white shadow-sm border ${
                plan.highlight
                  ? 'border-indigo-500 ring-2 ring-indigo-100 relative'
                  : 'border-gray-200'
              } testimonial-card`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-md">
                  Best value
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs uppercase tracking-wide text-indigo-600 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">{plan.price}</p>
                <p className="text-sm text-gray-500">{plan.priceDetail}</p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-gray-900">{plan.verdicts}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  {plan.delivery}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.limitations.length > 0 && (
                  <li className="text-xs text-gray-500 mt-1">{plan.limitations.join(' • ')}</li>
                )}
              </ul>

              <TouchButton
                onClick={() => (window.location.href = '/start-simple')}
                className={`w-full justify-center mt-auto min-h-[48px] ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {plan.name === 'Free trial' ? 'Start free trial' : 'Get 3 more verdicts'}
              </TouchButton>

              <p className="mt-3 text-[11px] text-gray-400">
                Money‑back guarantee if you’re not happy with the feedback. No questions asked.
              </p>
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


