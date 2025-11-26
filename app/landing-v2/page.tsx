'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { FeaturesComparison } from '@/components/landing/features-comparison';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { JudgeSelectionSection } from '@/components/landing/judge-selection';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { TouchButton } from '@/components/ui/touch-button';
import { 
  ArrowRight,
  Shield, 
  Clock, 
  MessageSquare,
  Star,
  CheckCircle,
  Zap
} from 'lucide-react';

export default function WorldClassLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <HeroSection />

      {/* Features Overview */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Truth You've Been Looking For
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No more sugar-coated feedback from friends. Get honest opinions that actually help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">100% Anonymous</h3>
              <p className="text-gray-600">
                No profiles, names, or personal info. Complete privacy for honest feedback.
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Get 3 expert verdicts in under 5 minutes. No waiting around for days.
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Feedback</h3>
              <p className="text-gray-600">
                Detailed, constructive responses from verified humans. No bots or spam.
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl">
              <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proven Results</h3>
              <p className="text-gray-600">
                4.9★ average rating from 47K+ users who got the feedback they needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Judge selection / credibility */}
      <JudgeSelectionSection />

      {/* Pricing table */}
      <PricingTableSection />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Features Comparison */}
      <FeaturesComparison />

      {/* Social Proof */}
      <SocialProofSection />

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about getting verdicts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How anonymous is it really?
              </h3>
              <p className="text-gray-600">
                Completely anonymous. Judges see your content but never your name, profile, or any identifying info. You see their feedback but not who they are.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What if I get mean feedback?
              </h3>
              <p className="text-gray-600">
                All judges are trained to be honest but constructive. Mean or inappropriate feedback is flagged and those judges lose access. We want truth, not cruelty.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How qualified are the judges?
              </h3>
              <p className="text-gray-600">
                All judges pass a qualification test and maintain quality ratings. Poor performers are removed. You get feedback from people who know how to give it.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I really trust stranger opinions?
              </h3>
              <p className="text-gray-600">
                Strangers have no reason to lie to you. Unlike friends who want to protect your feelings, anonymous judges give you the unfiltered truth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-16 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join 47,000+ people who've gotten the honest feedback they needed to make better decisions.
            Start with 3 free verdicts - no credit card required.
          </p>

          <TouchButton
            onClick={() => window.location.href = '/start'}
            className="bg-white text-purple-900 px-10 py-5 text-xl font-bold rounded-2xl hover:bg-gray-50 transition-colors inline-flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 duration-300"
          >
            Get My Free Verdicts Now
            <ArrowRight className="w-6 h-6" />
          </TouchButton>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-purple-200 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>3 Free Verdicts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Results in 5 Minutes</span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 pt-8 border-t border-purple-800">
            <p className="text-purple-200 text-sm mb-4">Trusted by leading communities</p>
            <div className="flex items-center justify-center gap-8 text-purple-300 text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                <span>4.9★ Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>340K+ Verdicts</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Privacy First</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}