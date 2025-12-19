'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Shield
} from 'lucide-react';
import { useLocalizedPricing } from '@/hooks/use-pricing';

// Removed floating feedback cards and rotating use cases for clearer communication

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pricing = useLocalizedPricing();

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

      {/* Visual clutter removed for clearer communication */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center">
          {/* Simplified badge - less distraction */}
          <div className="inline-flex mb-6">
            <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 text-sm font-medium">
              Currently in beta
            </Badge>
          </div>

          {/* Main headline with premium typography */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight leading-tight mb-6">
              Get honest feedback from strangers in minutes
            </h1>
            
            {/* Clear, benefit-focused subheadline */}
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4 font-medium">
              Share your question. Get 3 anonymous responses. Make better decisions.
            </p>
            <p className="text-base text-gray-500 max-w-2xl mx-auto mb-2">
              Your friends are too nice. Strangers will tell you the truth.
            </p>
          </div>

          {/* Static use case examples - simpler */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 bg-white rounded-full border border-gray-200">💼 Career decisions</span>
            <span className="px-3 py-1 bg-white rounded-full border border-gray-200">💝 Dating profiles</span>
            <span className="px-3 py-1 bg-white rounded-full border border-gray-200">👔 Outfit checks</span>
            <span className="px-3 py-1 bg-white rounded-full border border-gray-200">📧 Email feedback</span>
          </div>

          {/* Removed multiple social proof cards - using single line below CTA for clarity */}

          {/* Primary CTA - Single Clear Action */}
          <div className="mb-10">
            <TouchButton
              onClick={() => router.push('/feed')}
              className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 mb-4"
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
              <span className="relative flex items-center gap-3">
                Get 3 Free Responses
                <ArrowRight className="h-6 w-6" />
              </span>
            </TouchButton>
            
            {/* Secondary option - smaller, below */}
            <p className="text-sm text-gray-500 text-center">
              Or <button onClick={() => router.push('/submit')} className="text-indigo-600 hover:text-indigo-700 font-medium underline">pay {pricing.privatePrice} for instant private feedback</button>
            </p>

            {/* Single trust line - concise, benefit-focused */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-green-600" />
              <span>3 feedback reports guaranteed • Quality reviewers • 100% anonymous</span>
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
      `}</style>
    </div>
  );
}