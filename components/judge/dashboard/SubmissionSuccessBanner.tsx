'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, DollarSign, RefreshCw, XCircle, Heart, Sparkles, Zap } from 'lucide-react';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface SubmissionSuccessBannerProps {
  onDismiss: () => void;
  onRefresh: () => void;
}

export function SubmissionSuccessBanner({ onDismiss, onRefresh }: SubmissionSuccessBannerProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger celebration on mount
  useEffect(() => {
    setShowConfetti(true);
    triggerHaptic('success');
    playSuccessSound();
  }, []);

  return (
    <>
      <Confetti active={showConfetti} duration={3000} pieces={60} />
      <div className="mb-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden animate-in slide-in-from-top duration-300">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />

        {/* Floating icons */}
        <Sparkles className="absolute top-3 right-20 h-4 w-4 text-white/40 animate-pulse" />
        <Heart className="absolute bottom-4 right-32 h-3 w-3 text-white/30 animate-bounce" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center relative">
              <CheckCircle2 className="h-7 w-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap className="h-2.5 w-2.5 text-yellow-900" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                You helped someone!
                <span className="text-xl">🎉</span>
              </h3>
              <p className="text-green-100 text-sm">
                Your feedback makes a real difference. Earnings available in 7 days.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('light');
                router.push('/judge/earnings');
              }}
              className="px-4 py-2.5 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <DollarSign className="h-4 w-4" />
              View Earnings
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onRefresh();
              }}
              className="px-4 py-2.5 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition inline-flex items-center gap-2 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Help Another
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onDismiss();
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Dismiss"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress hint */}
        <div className="mt-4 pt-3 border-t border-white/20 text-green-100 text-xs flex items-center gap-2">
          <Heart className="h-3 w-3 text-pink-300" />
          <span>Every review you give helps someone make better decisions</span>
        </div>
      </div>
    </>
  );
}
