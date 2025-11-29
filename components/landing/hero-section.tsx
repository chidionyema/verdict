'use client';

import { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
  MessageCircle,
  Eye,
  TrendingUp,
  Heart
} from 'lucide-react';
import { isExperimentEnabled } from '@/lib/experiments';

const MAIN_HEADLINE = "Get honest opinions in minutes";

const SOCIAL_PROOF_STATS = [
  { value: "2,847", label: "Verdicts delivered", trend: "+47% this week" },
  { value: "4.9", label: "Average rating", stars: true },
  { value: "47min", label: "Average response time", fast: true },
];

const USE_CASES = [
  { text: 'Should I take this job offer?', emoji: '💼', category: 'career' },
  { text: 'Is this outfit professional enough?', emoji: '👔', category: 'style' },
  { text: 'How can I improve my dating profile?', emoji: '💝', category: 'dating' },
  { text: 'Will this email sound too aggressive?', emoji: '📧', category: 'communication' },
];

// Floating verdict preview component
function FloatingVerdict({ delay, position }: { delay: number; position: { top?: string; bottom?: string; left?: string; right?: string } }) {
  return (
    <div
      className={`absolute hidden xl:block animate-float opacity-85 hover:opacity-100 transition-all duration-300 z-0`}
      style={{
        animationDelay: `${delay}s`,
        ...position
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100/50 p-4 w-72 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {8 + Math.floor(delay / 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < 4 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            <div className="h-12 flex items-start">
              <p className="text-sm text-gray-700 leading-tight">
                {delay === 0 && "Great choice! The blue really brings out your eyes. Confident and approachable look."}
                {delay === 2 && "Consider negotiating 10% higher. They clearly want you, use that leverage now."}
                {delay === 4 && "Perfect tone. Direct but professional. Send it!"}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> Helpful
              </span>
              <span>Anonymous Judge</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [currentUseCase, setCurrentUseCase] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const useCaseInterval = setInterval(() => {
      setCurrentUseCase((prev) => (prev + 1) % USE_CASES.length);
    }, 3500);

    return () => clearInterval(useCaseInterval);
  }, []);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-[800px]">
      {/* Premium animated background */}
      <div className="absolute inset-0">
        {/* Dynamic gradient orbs with parallax */}
        <div 
          className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)` }}
        />
        <div 
          className="absolute top-40 right-1/3 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
          style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * 15}px)` }}
        />
        <div 
          className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
          style={{ transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * -20}px)` }}
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
      </div>

      {/* Floating verdict cards - perfectly aligned */}
      <FloatingVerdict delay={0} position={{ top: '260px', left: '2%' }} />
      <FloatingVerdict delay={2} position={{ top: '260px', right: '2%' }} />
      <FloatingVerdict delay={4} position={{ top: '480px', right: '2%' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center">
          {/* Premium badge with animation */}
          <div className="inline-flex mb-8">
            <Badge className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-6 py-3 text-sm font-medium shadow-lg">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-md opacity-75 animate-pulse" />
              <Sparkles className="relative w-4 h-4 mr-2 animate-spin-slow" />
              <span className="relative">Limited Beta Access</span>
              <span className="relative ml-2 text-indigo-200">• 500 spots left</span>
            </Badge>
          </div>

          {/* Main headline with premium typography */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight leading-[0.9] mb-6">
              Get honest opinions
              <br />
              <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-indigo-600">
                in minutes
              </span>
            </h1>
            
            {/* Animated subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real people give anonymous feedback on life's tough decisions.
            </p>
          </div>

          {/* Rotating use case with premium animation */}
          <div className="mb-12 h-12 relative">
            <div className="absolute inset-x-0 flex items-center justify-center">
              {USE_CASES.map((useCase, index) => (
                <div
                  key={index}
                  className={`absolute transition-all duration-500 ${
                    index === currentUseCase
                      ? 'opacity-100 transform translate-y-0'
                      : 'opacity-0 transform translate-y-4'
                  }`}
                >
                  <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100">
                    <span className="text-2xl">{useCase.emoji}</span>
                    <span className="text-lg font-medium text-gray-800">"{useCase.text}"</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {useCase.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium social proof with live updates */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            {SOCIAL_PROOF_STATS.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl px-6 py-4 shadow-lg border border-gray-100 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-3">
                  {stat.stars ? (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  ) : stat.fast ? (
                    <Clock className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  )}
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                    {stat.trend && (
                      <div className="text-xs text-green-600 font-medium">{stat.trend}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Premium CTA section */}
          <div className="mb-10">
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
              <TouchButton
                onClick={() => router.push('/start-simple')}
                className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-5 text-xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 min-h-[64px] overflow-hidden"
              >
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="relative flex items-center">
                  Get your first verdict free
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </TouchButton>
              
              <TouchButton
                variant="outline"
                onClick={() => {
                  const demoSection = document.getElementById('how-it-works');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-5 text-lg font-medium rounded-2xl"
              >
                <Eye className="w-5 h-5 mr-2" />
                Watch demo
              </TouchButton>
            </div>
            
            {/* Trust indicators with icons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span>100% Anonymous</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                </div>
                <span>3 guaranteed responses</span>
              </div>
            </div>
          </div>

          {/* Platform growth ticker */}
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Growing Platform</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  2,847+ verdicts delivered
                </span>
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  4.9/5 rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium bottom fade with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

      <style jsx>{`
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          20% { transform: translate(50px, -80px) scale(1.1) rotate(90deg); }
          40% { transform: translate(-50px, 60px) scale(0.9) rotate(180deg); }
          60% { transform: translate(70px, 30px) scale(1.05) rotate(270deg); }
          80% { transform: translate(-30px, -70px) scale(0.95) rotate(360deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}