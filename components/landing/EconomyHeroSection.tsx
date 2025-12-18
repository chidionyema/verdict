'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield,
  Users,
  Zap,
  Gift,
  Eye,
  Lock,
  TrendingUp
} from 'lucide-react';
import { usePrivatePrice } from '@/hooks/use-pricing';

export function EconomyHeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const privatePrice = usePrivatePrice();

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
    <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-[900px]">
      {/* Premium animated background */}
      <div className="absolute inset-0">
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
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex mb-6">
            <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 px-4 py-2 text-sm font-medium">
              🏆 Community-Powered Feedback Platform
            </Badge>
          </div>

          {/* Main headline */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight leading-tight mb-6">
              Get honest feedback from real people
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-6 font-medium">
              Judge others to earn free feedback, or pay for instant private results.
              <br />
              <span className="text-indigo-600 font-bold">Help the community, help yourself.</span>
            </p>
          </div>

          {/* Economy Explanation Cards */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Path */}
              <div 
                className={`relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 transition-all duration-300 cursor-pointer ${
                  activeTab === 'free' 
                    ? 'border-green-400 shadow-2xl scale-105' 
                    : 'border-white/50 shadow-xl hover:shadow-2xl hover:scale-102'
                }`}
                onClick={() => setActiveTab('free')}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-500 text-white rounded-full p-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-900">Community Path</h3>
                    <p className="text-green-600 font-semibold">Judge 3 → Earn 1 Credit → Free!</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Browse the community feed</p>
                      <p className="text-sm text-gray-600">See real dilemmas from real people</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Judge 3 submissions</p>
                      <p className="text-sm text-gray-600">Give honest feedback (~30 minutes)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Gift className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Earn 1 free credit automatically</p>
                      <p className="text-sm text-gray-600">Submit your own request for free!</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time investment:</span>
                    <span className="font-bold text-green-600">~30 minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your submission:</span>
                    <span className="font-bold text-green-600">Public in feed</span>
                  </div>
                </div>
              </div>

              {/* Paid Path */}
              <div 
                className={`relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 transition-all duration-300 cursor-pointer ${
                  activeTab === 'paid' 
                    ? 'border-purple-400 shadow-2xl scale-105' 
                    : 'border-white/50 shadow-xl hover:shadow-2xl hover:scale-102'
                }`}
                onClick={() => setActiveTab('paid')}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full p-4">
                    <Zap className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-900">Instant Path</h3>
                    <p className="text-purple-600 font-semibold">Pay {privatePrice} → Skip the queue</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Submit your question</p>
                      <p className="text-sm text-gray-600">Upload photo or describe your situation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Pay {privatePrice} securely</p>
                      <p className="text-sm text-gray-600">One-time payment, no subscription</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Get results in under 1 hour</p>
                      <p className="text-sm text-gray-600">Completely private, no public posting</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time investment:</span>
                    <span className="font-bold text-purple-600">5 minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your submission:</span>
                    <span className="font-bold text-purple-600">100% private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-center max-w-3xl mx-auto">
              <TouchButton
                onClick={() => router.push('/feed')}
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 flex-1"
              >
                <span className="flex items-center justify-center gap-3">
                  <Users className="h-6 w-6" />
                  Start Judging (Free)
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="text-sm text-green-100 mt-1 font-normal">
                  Judge 3 submissions → Earn 1 credit
                </div>
              </TouchButton>
              
              <TouchButton
                onClick={() => router.push('/submit-unified')}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 flex-1"
              >
                <span className="flex items-center justify-center gap-3">
                  <Lock className="h-6 w-6" />
                  Submit Now ({privatePrice})
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="text-sm text-indigo-100 mt-1 font-normal">
                  Skip judging → Instant results
                </div>
              </TouchButton>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>15,000+ decisions made</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>4.9/5 average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span>100% anonymous</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}