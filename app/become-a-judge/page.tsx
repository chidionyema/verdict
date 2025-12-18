'use client';

import Link from 'next/link';
import { CheckCircle, DollarSign, Star, Target, Clock, ShieldCheck } from 'lucide-react';
import { VERDICT_TIERS, VERDICT_TIER_PRICING } from '@/lib/validations';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

const BASIC = VERDICT_TIER_PRICING.basic;
const DETAILED = VERDICT_TIER_PRICING.detailed;

export default function BecomeJudgePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 min-h-[44px]"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Verdict Judge</h1>
          <p className="text-gray-600">
            Help real people make better decisions and get paid for thoughtful, honest feedback.
          </p>
        </div>

        <div className="grid gap-6 mb-10 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What you&apos;ll do</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Read real scenarios (dating, careers, writing, big decisions).
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Give a clear 1–10 rating and a few paragraphs of constructive feedback.
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Follow our quality guidelines for tone, clarity, and helpfulness.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Payouts by tier
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between">
                <span>Basic requests ({VERDICT_TIERS.basic.verdicts} quick ratings)</span>
                <span className="font-semibold">
                  ${BASIC.judgePayout.toFixed(2)} per rating
                </span>
              </li>
              <li className="flex justify-between">
                <span>Detailed requests ({VERDICT_TIERS.detailed.verdicts} written reviews)</span>
                <span className="font-semibold">
                  ${DETAILED.judgePayout.toFixed(2)} per review
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              Actual hourly earnings depend on how many requests you choose to review and how fast
              you write high‑quality verdicts.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Requirements & expectations
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
              Strong written English and ability to explain your reasoning clearly.
            </li>
            <li className="flex gap-2">
              <Target className="h-4 w-4 text-purple-600 mt-0.5" />
              Consistently constructive tone – honest but never cruel.
            </li>
            <li className="flex gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
              Aim to respond within a few hours of claiming a request.
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            We continuously monitor judge quality and may pause judging access if feedback falls
            below our bar.
          </p>
        </div>

        {/* Example of a great verdict */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            What a great verdict looks like
          </h2>
          <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">
            Sample (anonymised)
          </p>
          <p className="text-sm text-gray-700 italic mb-3">
            “Should I send this message to a hiring manager on LinkedIn, or does it sound too pushy?”
          </p>
          <div className="space-y-2 text-sm text-gray-800">
            <p className="font-semibold">
              Verdict in one sentence:
              <span className="ml-1 text-gray-900">
                This message is almost there — friendly, but a touch long and slightly apologetic.
              </span>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>“Your opener is strong; it shows you&apos;ve done your homework on their role and company.”</li>
              <li>“The middle paragraph repeats your CV; you can cut that and keep the focus on your ask.”</li>
              <li>“End with one clear, low‑pressure question (e.g. &quot;Would you be open to a quick chat next week?&quot;).”</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Great verdicts are specific, actionable, and respectful — seekers should leave knowing exactly what to do next.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-gray-600">
            Ready to start judging? You can browse available requests from your Judge Dashboard.
          </div>
          <div className="flex gap-3">
            <Link
              href="/judge"
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Go to Judge Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


