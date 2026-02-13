'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Sparkles, Eye, Share2, Plus, ArrowRight } from 'lucide-react';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface CompletionCelebrationProps {
  requestId: string;
  category: string;
  verdictCount: number;
  averageRating: number;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function CompletionCelebration({
  requestId,
  category,
  verdictCount,
  averageRating,
  onDismiss,
  autoHide = false,
  autoHideDelay = 10000,
}: CompletionCelebrationProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Trigger celebration effects on mount
  useEffect(() => {
    triggerHaptic('success');
    playSuccessSound();
  }, []);

  // Auto-hide after delay if enabled
  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  if (!isVisible) return null;

  const ratingMessage =
    averageRating >= 8
      ? 'Excellent feedback!'
      : averageRating >= 6
      ? 'Good insights received'
      : 'Constructive feedback received';

  const ratingColor =
    averageRating >= 8
      ? 'text-green-600'
      : averageRating >= 6
      ? 'text-blue-600'
      : 'text-amber-600';

  return (
    <>
      {/* Confetti overlay */}
      <Confetti active={showConfetti} duration={4000} pieces={150} />

      {/* Celebration banner */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl animate-in slide-in-from-top duration-500">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/10 rounded-full"
              style={{
                width: 40 + Math.random() * 60,
                height: 40 + Math.random() * 60,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">All Done!</h2>
                </div>
                <p className="text-white/90">Your request is complete</p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  onDismiss();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Dismiss"
              >
                <span className="text-white/60 text-sm">Dismiss</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-3xl font-bold">{verdictCount}</p>
              <p className="text-white/80 text-sm">Verdicts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
              <p className="text-white/80 text-sm">Avg Rating</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-lg font-semibold capitalize">{category}</p>
              <p className="text-white/80 text-sm">Category</p>
            </div>
          </div>

          {/* Rating message */}
          <div className="bg-white rounded-xl p-4 mb-4">
            <p className={`font-semibold ${ratingColor} text-center`}>
              {ratingMessage}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const resultsSection = document.getElementById('verdicts-section');
                if (resultsSection) {
                  resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-white/90 transition min-h-[48px]"
            >
              <Eye className="h-5 w-5" />
              View Results
            </button>
            <Link
              href={`/submit?category=${encodeURIComponent(category)}&followup=true`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/30 transition min-h-[48px]"
            >
              <Plus className="h-5 w-5" />
              Ask Follow-up
            </Link>
          </div>
        </div>

        {/* Float animation */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}</style>
      </div>
    </>
  );
}

// Inline celebration banner for smaller displays
export function CompletionBanner({
  verdictCount,
  averageRating,
  onViewResults,
}: {
  verdictCount: number;
  averageRating: number;
  onViewResults?: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-green-900">All verdicts received!</p>
          <p className="text-sm text-green-700">
            {verdictCount} verdicts with {averageRating.toFixed(1)}/10 average
          </p>
        </div>
      </div>
      {onViewResults && (
        <button
          onClick={onViewResults}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm min-h-[40px]"
        >
          View <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
