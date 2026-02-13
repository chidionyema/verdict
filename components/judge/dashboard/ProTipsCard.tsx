'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, TrendingUp, Clock, MessageSquare } from 'lucide-react';

interface ProTipsCardProps {
  qualityScore?: number | null;
  className?: string;
}

// Tips organized by improvement area
const TIPS_BY_FOCUS = {
  quality: [
    "Start your feedback with a clear recommendation, then explain why",
    "Give 2-3 specific reasons tied to the seeker's context",
    "End with one concrete action the seeker can take next",
    "Reference specific details from their submission",
  ],
  speed: [
    "Use keyboard shortcuts: numbers (1-9, 0) set ratings instantly",
    "Templates are starting points - personalize them quickly",
    "Focus on the most important point first",
    "Press Cmd/Ctrl + Enter to submit quickly",
  ],
  engagement: [
    "Match the tone the seeker requested",
    "Acknowledge their situation before giving advice",
    "Be encouraging even when giving critical feedback",
    "Share relevant experience when applicable",
  ],
  earnings: [
    "Premium requests pay more - unlock them with 8.5+ quality scores",
    "Maintain streaks for bonus multipliers",
    "Expert queue requests pay up to 3x more",
    "Consistent quality leads to more request matching",
  ],
};

// Rotating tips for general use
const ROTATING_TIPS = [
  {
    icon: CheckCircle2,
    title: "Be Specific",
    tip: "Avoid generic feedback - reference specific details from the submission",
  },
  {
    icon: MessageSquare,
    title: "Show Understanding",
    tip: "Reference the context and show you understand their situation",
  },
  {
    icon: TrendingUp,
    title: "Actionable Advice",
    tip: "Give actionable suggestions, not just opinions or ratings",
  },
  {
    icon: Clock,
    title: "Optimal Length",
    tip: "Aim for 100-200 characters - detailed but concise",
  },
  {
    icon: Lightbulb,
    title: "One Clear Recommendation",
    tip: "Start with your main recommendation, then support it",
  },
];

export function ProTipsCard({ qualityScore, className = '' }: ProTipsCardProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Determine which tips to prioritize based on quality score
  const getPersonalizedTips = () => {
    if (!qualityScore) return TIPS_BY_FOCUS.quality;
    if (qualityScore < 7) return TIPS_BY_FOCUS.quality;
    if (qualityScore < 8.5) return [...TIPS_BY_FOCUS.quality.slice(0, 2), ...TIPS_BY_FOCUS.engagement.slice(0, 2)];
    return TIPS_BY_FOCUS.earnings; // High performers get earnings tips
  };

  // Auto-rotate tips
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const currentTip = ROTATING_TIPS[currentTipIndex];
  const CurrentIcon = currentTip.icon;
  const personalizedTips = getPersonalizedTips();

  const handlePrevTip = () => {
    setAutoRotate(false);
    setCurrentTipIndex((prev) => (prev - 1 + ROTATING_TIPS.length) % ROTATING_TIPS.length);
  };

  const handleNextTip = () => {
    setAutoRotate(false);
    setCurrentTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full filter blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full filter blur-xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pro Tips for Higher Ratings</h3>
              {qualityScore && qualityScore >= 8.5 && (
                <p className="text-xs text-white/70">You&apos;re doing great! Here&apos;s how to earn more</p>
              )}
            </div>
          </div>

          {/* Tip navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevTip}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Previous tip"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/60 px-1">
              {currentTipIndex + 1}/{ROTATING_TIPS.length}
            </span>
            <button
              onClick={handleNextTip}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Next tip"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Featured rotating tip */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CurrentIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">{currentTip.title}</p>
              <p className="text-sm text-white/90">{currentTip.tip}</p>
            </div>
          </div>
        </div>

        {/* Quick tips list */}
        <div className="space-y-2">
          {personalizedTips.slice(0, 3).map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-300 flex-shrink-0" />
              <p className="text-xs text-white/80">{tip}</p>
            </div>
          ))}
        </div>

        {/* Motivational footer */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <p className="text-xs text-white/70 text-center">
            {qualityScore && qualityScore >= 8.5 ? (
              <>Your quality score of <strong>{qualityScore.toFixed(1)}</strong> qualifies you for premium requests!</>
            ) : qualityScore ? (
              <>Reach <strong>8.5</strong> quality score to unlock premium requests (currently {qualityScore.toFixed(1)})</>
            ) : (
              <>High-quality verdicts unlock premium requests with higher pay!</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
