'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Users, TrendingUp, Sparkles, ArrowRight, Check, Star } from 'lucide-react';
import { isValidReferralCode } from '@/lib/referral-system';
import { useLocalizedPricing } from '@/hooks/use-pricing';

export function ReferralLandingContent() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string>('');
  const [isValidRef, setIsValidRef] = useState<boolean>(false);
  const pricing = useLocalizedPricing();

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      setIsValidRef(isValidReferralCode(refParam));
    }
  }, [searchParams]);

  const signupUrl = isValidRef ? `/auth/signup?ref=${referralCode}` : '/auth/signup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full filter blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Referral notification */}
          {isValidRef && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold animate-bounce">
                <Gift className="h-5 w-5" />
                You've been invited! Code: {referralCode}
              </div>
            </div>
          )}

          {/* Main headline */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Share Verdict,{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Earn Credits
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {isValidRef
                ? "Your friend invited you to try Verdict! Sign up now and you'll both get a free credit to use immediately."
                : "Invite friends to get honest feedback. When they sign up with your code, you both get free credits instantly."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <Link
                href={signupUrl}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isValidRef ? 'Claim Your Credit' : 'Get Started Free'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              {!isValidRef && (
                <Link
                  href="/auth/login"
                  className="flex-1 bg-white text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all duration-300"
                >
                  Already have an account?
                </Link>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Share Your Code</h3>
                <p className="text-gray-600">
                  Get your unique referral code and share it with friends via social media, email, or messaging.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Friend Signs Up</h3>
                <p className="text-gray-600">
                  Your friend creates an account using your referral code within 72 hours of receiving it.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Both Get Credits</h3>
                <p className="text-gray-600">
                  You both instantly receive 1 free credit to submit feedback requests or skip the judging queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why People Love Verdict</h2>
            <p className="text-xl text-gray-600">
              Join thousands getting honest feedback on photos, decisions, and more
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">100% Anonymous</h3>
                  <p className="text-gray-600">No profiles, names, or personal info shared. Complete privacy guaranteed.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Real People, Not Bots</h3>
                  <p className="text-gray-600">Every response comes from verified humans with relevant experience.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Fast Results</h3>
                  <p className="text-gray-600">Get 3 detailed feedback reports within hours, not days.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Two Ways to Use</h3>
                  <p className="text-gray-600">Judge others to earn free credits, or pay {pricing.privatePrice} to skip the queue.</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 mb-4">
                "Finally got honest feedback on my dating photos. Turns out the group shot was killing my profile. Made the changes and got 3x more matches!"
              </blockquote>
              <cite className="text-gray-600 font-medium">— Sarah, 28, London</cite>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            {isValidRef ? "Ready to Get Your Free Credit?" : "Ready to Start Referring?"}
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            {isValidRef
              ? "Sign up now to claim your free credit and start getting honest feedback from real people."
              : "Join thousands of users who trust Verdict for honest, anonymous feedback."}
          </p>
          
          <Link
            href={signupUrl}
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {isValidRef ? 'Sign Up & Claim Credit' : 'Get Started Free'}
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <p className="text-purple-200 text-sm mt-4">
            No credit card required • 100% anonymous • Results in hours
          </p>
        </div>
      </div>
    </div>
  );
}