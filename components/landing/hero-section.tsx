'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { NORTH_STAR_TAGLINE } from '@/lib/copy';
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
import { isExperimentEnabled } from '@/lib/experiments';

const MAIN_HEADLINE = "Get honest opinions in minutes";

const SOCIAL_PROOF_STATS = [
  { icon: Users, label: "500+ opinions delivered", color: "text-blue-600" },
  { icon: Star, label: "4.9★ rating", color: "text-yellow-500" },
  { icon: Sparkles, label: "Currently in beta", color: "text-purple-600" },
];

const USE_CASES = [
  'Should I take this job offer?',
  'Is this outfit professional enough?',
  'Will this email sound too aggressive to my boss?',
  'Which photo will get more matches on my dating profile?',
];

export function HeroSection() {
  const [currentUseCase, setCurrentUseCase] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const useCaseInterval = setInterval(() => {
      setCurrentUseCase((prev) => (prev + 1) % USE_CASES.length);
    }, 3000);

    return () => {
      clearInterval(useCaseInterval);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 hero-section min-h-[700px]">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Pre-headline Badge */}
          <Badge className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Currently in beta - get early access
          </Badge>

          {/* Clear Main Headline */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
              {isExperimentEnabled('hero_v2')
                ? 'Fast, anonymous second opinions from real people'
                : MAIN_HEADLINE}
            </h1>
          </div>

          {/* Sub-headline with rotating use case */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              {isExperimentEnabled('hero_v2')
                ? NORTH_STAR_TAGLINE
                : 'Real people, real feedback, completely anonymous.'}
              <br />
              <span className="font-semibold text-indigo-600 transition-all duration-500">
                "{USE_CASES[currentUseCase]}"
              </span>
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
          <div className="mb-8">
            <TouchButton
              onClick={() => router.push('/start-simple')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-4 text-xl font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 group min-h-[56px]"
            >
              Get 3 free requests
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </TouchButton>
            
            <div className="mt-4">
              <TouchButton
                variant="ghost"
                onClick={() => {
                  const demoSection = document.getElementById('how-it-works');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-indigo-600 hover:text-indigo-700"
              >
                See how it works
              </TouchButton>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Anonymous</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No account required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span>47min average</span>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl max-w-lg mx-auto">
            <div className="text-center text-blue-800">
              <div className="font-medium mb-2">Popular feedback categories:</div>
              <div className="text-sm flex flex-wrap justify-center gap-2">
                <span>• Dating profiles</span>
                <span>• Job interview prep</span>
                <span>• Business decisions</span>
                <span>• Style & appearance</span>
              </div>
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