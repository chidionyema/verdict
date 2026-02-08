'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Eye, Gavel, TrendingUp, Users, Lock, Sparkles } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { useLocalizedPricing } from '@/hooks/use-pricing';

export function EconomyExplanationSection() {
  const router = useRouter();
  const pricing = useLocalizedPricing();

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">The Review Economy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Two Ways to Get Feedback
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the path that fits your needs: Review others to earn free credits, or pay {pricing.privatePrice} for instant private results. Both get you 3 honest feedback reports.
          </p>
        </div>

        {/* Three Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Discover */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <Eye className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Discover</h3>
            <p className="text-gray-600 mb-6">
              Scroll through real dilemmas from the community. Review dating profiles, outfits, career decisions. It's addictive.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Browse endless content</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Review others' submissions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>See what others think</span>
              </div>
            </div>
            <TouchButton
              onClick={() => router.push('/feed')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Browse Feed
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchButton>
          </div>

          {/* Submit */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all relative">
            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Popular
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Submit</h3>
              <p className="text-gray-600 mb-6">
              Get honest feedback on your own submissions. Use earned credits or pay {pricing.privatePrice} to skip reviewing.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span><strong className="text-green-600">Free</strong> with credits</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span><strong>{pricing.privatePrice}</strong> for private & instant</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Get 3 comprehensive reviews</span>
              </div>
            </div>
            <TouchButton
              onClick={() => router.push('/submit')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Submit Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchButton>
          </div>

          {/* Review Queue */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
              <Gavel className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Review Queue</h3>
            <p className="text-gray-600 mb-6">
              Help others make better decisions. Earn credits for every review. Build your reputation.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span><strong>Earn credits</strong> per judgment</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span><strong>3 reviews = 1 credit</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span>Build your reputation tier</span>
              </div>
            </div>
            <TouchButton
              onClick={() => router.push('/reviewer')}
              variant="outline"
              className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Start Reviewing
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchButton>
          </div>
        </div>

        {/* Two Paths Side-by-Side */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-indigo-100 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Two Ways to Get Feedback
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the path that fits your needs. Both get you 3 honest feedback reports.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Community Path */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-green-600" />
                <h4 className="text-2xl font-bold text-gray-900">Community Path</h4>
                <span className="ml-auto bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Free</span>
              </div>
              <p className="text-gray-700 mb-6">
                Review 3 submissions to earn 1 credit. Use your credit to get feedback on your own request. Perfect if you have time.
              </p>
              
              {/* Visual Flow */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                  <span className="flex-1">Review 3 others (~20 min)</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                  <span className="flex-1">Earn 1 credit automatically</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                  <span className="flex-1">Get 3 feedback reports</span>
                </div>
              </div>

              <TouchButton
                onClick={() => router.push('/feed')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Start Reviewing Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </TouchButton>
            </div>

            {/* Paid Path */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
                <h4 className="text-2xl font-bold text-gray-900">Private Path</h4>
                <span className="ml-auto bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">{pricing.privatePrice}</span>
              </div>
              <p className="text-gray-700 mb-6">
                Pay {pricing.privatePrice} to skip judging and submit privately. Get instant, confidential results. Perfect if you're in a hurry or need privacy.
              </p>
              
              {/* Steps */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Pay {pricing.privatePrice}</h5>
                    <p className="text-sm text-gray-600">One-time payment, no subscription</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Submit instantly</h5>
                    <p className="text-sm text-gray-600">No judging required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Get results fast</h5>
                    <p className="text-sm text-gray-600">3 feedback reports within 2 hours (private)</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  <span>✅ No time required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  <span>✅ Completely private</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  <span>✅ Faster responses (within 2 hours)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>💰 Costs {pricing.privatePrice} per request</span>
                </div>
              </div>

              <TouchButton
                onClick={() => router.push('/submit')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Submit Privately for {pricing.privatePrice}
                <ArrowRight className="h-4 w-4 ml-2" />
              </TouchButton>
            </div>
          </div>

          {/* Comparison Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              <strong className="text-gray-900">Both paths get you 3 honest feedback reports.</strong> Choose based on whether you value time or money, and whether you want your submission public or private.
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Zero Cost to Start</h4>
            <p className="text-sm text-gray-600">
              Review others for free. Earn credits through participation. No upfront payment needed.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Community-Driven</h4>
            <p className="text-sm text-gray-600">
              Real people reviewing real dilemmas. See what others think. Compare your choices.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Flexible Pricing</h4>
            <p className="text-sm text-gray-600">
              Earn free credits or pay {pricing.privatePrice} for privacy and speed. Your choice, your control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

