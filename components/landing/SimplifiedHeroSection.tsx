'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Users, Zap } from 'lucide-react';
import { usePrivatePrice } from '@/hooks/use-pricing';
import { LiveActivityTicker } from '@/components/activity/LiveActivityTicker';

export function SimplifiedHeroSection() {
  const [hoveredPath, setHoveredPath] = useState<'free' | 'paid' | null>(null);
  const router = useRouter();
  const privatePrice = usePrivatePrice();

  return (
    <>
      {/* Live Activity Ticker */}
      <LiveActivityTicker />
      
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-indigo-50 min-h-[700px]">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-40 right-1/3 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Trust badge */}
          <Badge className="inline-flex mb-8 bg-white/80 backdrop-blur border-indigo-200 text-indigo-700 px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            100% Human Reviewers • No AI
          </Badge>

          {/* Main headline - economy-focused and powerful */}
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-4">
            Judge others. Get judged. Make smarter decisions.
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Strangers tell the truth friends won't. Anonymous, structured, and proven to work.
          </p>

          {/* Economy explanation - critical for understanding */}
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 mb-12 max-w-3xl mx-auto border border-white/30">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <span className="font-semibold text-green-800">Help 3 people</span>
                <span className="text-green-600">→</span>
                <span className="font-semibold text-green-800">Earn 1 credit</span>
                <span className="text-green-600">→</span>
                <span className="font-semibold text-green-800">Get your feedback</span>
              </div>
              <div className="text-gray-500 font-medium">OR</div>
              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-800">Pay {privatePrice}</span>
                <span className="text-purple-600">→</span>
                <span className="font-semibold text-purple-800">Skip the line</span>
                <span className="text-purple-600">→</span>
                <span className="font-semibold text-purple-800">Get instant results</span>
              </div>
            </div>
          </div>

          {/* Single clear CTA to unified start page */}
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <TouchButton
              onClick={() => router.push('/submit')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="h-6 w-6" />
              </span>
            </TouchButton>
            <p className="text-sm text-gray-500">
              Both paths get you 3 honest opinions • Choose what works for you
            </p>
          </div>

          {/* Simple social proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>3 reviews each</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span>Under 1 hour</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>100% anonymous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}