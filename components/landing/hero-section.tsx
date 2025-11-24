'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Users, 
  Star, 
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react';

const ROTATING_HEADLINES = [
  "Stop Wondering. Start Knowing.",
  "Get Brutal Honesty in 5 Minutes.",
  "Finally, Someone Will Tell You The Truth.",
  "Skip The Guesswork. Get Real Opinions."
];

const SOCIAL_PROOF_STATS = [
  { icon: Users, label: "27,340+ verdicts", color: "text-blue-600" },
  { icon: Star, label: "4.9★ rating", color: "text-yellow-500" },
  { icon: Clock, label: "Avg 3 min delivery", color: "text-green-600" },
];

const USE_CASES = [
  "Does this outfit actually look good?",
  "Is my dating profile attractive?", 
  "Should I take this job offer?",
  "Is this business idea worth pursuing?",
  "Does this haircut suit my face?",
];

export function HeroSection() {
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const [currentUseCase, setCurrentUseCase] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const headlineInterval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % ROTATING_HEADLINES.length);
    }, 3000);

    const useCaseInterval = setInterval(() => {
      setCurrentUseCase((prev) => (prev + 1) % USE_CASES.length);
    }, 2000);

    return () => {
      clearInterval(headlineInterval);
      clearInterval(useCaseInterval);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Pre-headline Badge */}
          <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Over 1M+ honest opinions delivered
          </Badge>

          {/* Rotating Headline */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
              <span className="block transition-all duration-1000 transform">
                {ROTATING_HEADLINES[currentHeadline]}
              </span>
            </h1>
          </div>

          {/* Sub-headline with rotating use case */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Whether you're asking{' '}
              <span className="font-semibold text-purple-600 transition-all duration-500">
                "{USE_CASES[currentUseCase]}"
              </span>
              <br />
              Get 10 brutally honest answers from strangers in minutes.
            </p>
          </div>

          {/* Social Proof Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            {SOCIAL_PROOF_STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-gray-700 font-medium">{stat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
            <TouchButton
              onClick={() => router.push('/start')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 group min-h-[56px]"
            >
              Get My 3 Free Verdicts
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </TouchButton>
            
            <TouchButton
              variant="outline"
              onClick={() => {
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-4 text-lg border-2 hover:bg-gray-50"
            >
              Watch Demo (30s)
            </TouchButton>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>Results in 5 minutes</span>
            </div>
          </div>

          {/* Urgency Indicator */}
          <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-orange-800">
              <Zap className="h-4 w-4" />
              <span className="font-medium">
                <span className="animate-pulse">Live now:</span> 147 people getting verdicts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>

      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}