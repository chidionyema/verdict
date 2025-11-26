'use client';

import { ShieldCheck, Star, Users, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function JudgeSelectionSection() {
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[3fr,2fr] items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How We Select Verdict Judges
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Not everyone can be a Verdict judge. We carefully screen and continuously monitor
              every judge so you get high‑quality, constructive feedback—not low‑effort replies.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-indigo-600 mt-1" />
                <span>Pass emotional intelligence and communication screening</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <span>Maintain a 4.5★+ average rating from seekers</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="h-5 w-5 text-purple-600 mt-1" />
                <span>Provide detailed, actionable feedback—not one‑word answers</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-600 mt-1" />
                <span>Come from diverse backgrounds, industries, and locations</span>
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link
                href="/judge"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition min-h-[48px]"
              >
                Become a Judge – Earn $20–50/hour
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <p className="text-sm text-gray-500 max-w-sm">
                We’re selectively inviting new judges. High‑quality, consistent feedback is rewarded
                with more requests and higher earnings.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 md:p-8 shadow-sm">
            <p className="text-sm font-semibold text-indigo-700 mb-3">
              Judge Quality Dashboard (last 30 days)
            </p>
            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Average judge rating</dt>
                <dd className="font-semibold text-gray-900">4.8 / 5.0</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Judges passing onboarding</dt>
                <dd className="font-semibold text-gray-900">17%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Judges removed for low quality</dt>
                <dd className="font-semibold text-gray-900">2.3%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Average words per verdict</dt>
                <dd className="font-semibold text-gray-900">162 words</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-gray-500">
              We continuously audit responses and remove judges who don’t meet our quality bar. Your
              feedback is always reviewed by humans—not bots.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


