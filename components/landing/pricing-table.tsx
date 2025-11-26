'use client';

import { Check, Clock, Sparkles } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';

const PLANS = [
  {
    name: 'Starter',
    badge: 'Free to try',
    verdicts: '3 verdicts',
    delivery: '24hr delivery',
    features: ['Honest feedback from 3 expert judges', 'Great for testing the experience'],
    limitations: ['No judge selection', 'Standard queue'],
    price: '$0',
    priceDetail: 'First request free',
    highlight: false,
  },
  {
    name: 'Popular',
    badge: 'Most chosen',
    verdicts: '10 verdicts',
    delivery: '2hr average delivery',
    features: ['Deeper range of opinions', 'Choose categories you care about', 'Priority in the queue'],
    limitations: [],
    price: '$12.99',
    priceDetail: '≈ $1.30 per verdict',
    highlight: true,
  },
  {
    name: 'Pro',
    badge: 'For power users',
    verdicts: '25 verdicts',
    delivery: '30min priority delivery',
    features: ['Pick specific judges', 'Great for teams & high‑stakes decisions', 'Best price per verdict'],
    limitations: [],
    price: '$24.99',
    priceDetail: '≈ $1.00 per verdict',
    highlight: false,
  },
];

export function PricingTableSection() {
  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, then upgrade when you’re ready for deeper feedback. No subscriptions, no
            hidden fees.
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
                onClick={() => (window.location.href = '/start')}
                className={`w-full justify-center mt-auto min-h-[48px] ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {plan.name === 'Starter' ? 'Start for Free' : 'Get Started'}
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


