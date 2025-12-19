'use client';

import { useState, useEffect } from 'react';
import { Zap, CheckCircle, TrendingUp, Send, Star, MessageSquare, Gift } from 'lucide-react';

// Educational examples showing how the platform works - not fake live data
const PLATFORM_EXAMPLES = [
  { id: '1', icon: 'submit', text: 'Users submit dating profiles, outfits, or tough decisions' },
  { id: '2', icon: 'match', text: '3 anonymous reviewers are matched to give feedback' },
  { id: '3', icon: 'review', text: 'Reviewers provide honest ratings and detailed advice' },
  { id: '4', icon: 'deliver', text: 'Feedback is delivered — usually within 2 hours' },
  { id: '5', icon: 'earn', text: 'Review 3 submissions → earn 1 free credit' },
  { id: '6', icon: 'improve', text: 'Users improve their photos, emails, and decisions' },
];

export function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Rotate through examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PLATFORM_EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'submit': return <Send className="h-4 w-4 text-blue-300" />;
      case 'match': return <Zap className="h-4 w-4 text-yellow-300" />;
      case 'review': return <MessageSquare className="h-4 w-4 text-green-300" />;
      case 'deliver': return <CheckCircle className="h-4 w-4 text-emerald-300" />;
      case 'earn': return <Gift className="h-4 w-4 text-purple-300" />;
      case 'improve': return <Star className="h-4 w-4 text-pink-300" />;
      default: return <CheckCircle className="h-4 w-4 text-white" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Section label */}
        <div className="hidden lg:flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-medium">How it works</span>
          </div>
        </div>

        {/* Animated Examples Ticker */}
        <div className="flex-1 lg:flex-initial lg:min-w-[450px] relative min-h-[32px] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center lg:justify-start">
            {PLATFORM_EXAMPLES.map((example, index) => (
              <div
                key={example.id}
                className={`absolute w-full flex items-center gap-3 transition-all duration-500 min-h-[32px] ${
                  index === currentIndex
                    ? 'opacity-100 translate-y-0'
                    : index === (currentIndex - 1 + PLATFORM_EXAMPLES.length) % PLATFORM_EXAMPLES.length
                    ? 'opacity-0 -translate-y-full'
                    : 'opacity-0 translate-y-full'
                }`}
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getIcon(example.icon)}
                </div>
                <span className="text-sm leading-tight flex-1">
                  {example.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="hidden md:flex items-center gap-1.5 ml-4">
          {PLATFORM_EXAMPLES.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Mobile label */}
        <div className="lg:hidden flex items-center gap-2 text-xs">
          <span className="opacity-80">How it works</span>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
