'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { SocialProofSection } from '@/components/landing/social-proof-section';
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

      {/* How It Works - Simple 3-step process */}
      <HowItWorks />

      {/* Social Proof with Beta Positioning */}
      <SocialProofSection />
      
      {/* Transparent Pricing */}
      <PricingTableSection />

      {/* Why not Reddit section */}
      <div className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why not just post on Reddit?
            </h2>
            <p className="text-xl text-gray-600">
              We get this question a lot. Here's the honest comparison:
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Reddit/Forums</h3>
              <ul className="space-y-2 text-red-700">
                <li>• Public posts anyone can see</li>
                <li>• Random strangers, variable quality</li>
                <li>• Might get 0 responses or trolls</li>
                <li>• No guarantee of helpful feedback</li>
                <li>• Your question stays online forever</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Verdict</h3>
              <ul className="space-y-2 text-green-700">
                <li>• Completely private submissions</li>
                <li>• Verified reviewers with quality scores</li>
                <li>• Guaranteed 3 responses</li>
                <li>• Constructive, helpful feedback</li>
                <li>• Auto-deletes after 30 days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
                All reviewers are trained to be honest but constructive. Mean or inappropriate feedback is flagged and those reviewers lose access. We want truth, not cruelty.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How qualified are the reviewers?
              </h3>
              <p className="text-gray-600">
                All reviewers pass a quality check and maintain ratings. Poor performers lose access. You get feedback from people who know how to give it.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I become a reviewer?
              </h3>
              <p className="text-gray-600">
                Yes! Help others make better decisions and earn money for quality responses. Apply to review in areas you know well. Flexible - review when you have time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Single Final CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get honest opinions?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join our beta and be among the first to get unfiltered feedback.
            Start with 3 free opinions - no credit card required.
          </p>

          <TouchButton
            onClick={() => window.location.href = '/start'}
            size="lg"
            className="bg-white text-indigo-600 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Get 3 free opinions
            <ArrowRight className="w-5 h-5 ml-2" />
          </TouchButton>

          <div className="mt-6 flex items-center justify-center gap-6 text-indigo-200 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Anonymous</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>No account needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>47min average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}