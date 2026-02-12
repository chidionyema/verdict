'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Clock,
  ArrowRight,
  X,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

interface FirstVerdictGuideProps {
  onDismiss: () => void;
  onComplete: () => void;
  category?: string;
}

const GUIDE_STEPS = [
  {
    id: 'welcome',
    title: "Your First Verdict!",
    description: "You're about to help someone make a decision. No pressure - just share your honest opinion.",
    icon: Sparkles,
    color: 'indigo',
    tips: [
      "There's no wrong answer - your perspective is valuable",
      "Take your time - quality matters more than speed",
      "Be kind but honest - that's what people need",
    ],
  },
  {
    id: 'review',
    title: "Review Their Submission",
    description: "Look at what they've shared and read their context carefully.",
    icon: MessageSquare,
    color: 'blue',
    tips: [
      "Read the context - it tells you what they're deciding",
      "Look at the details - small things matter",
      "Think about what YOU would want to hear",
    ],
  },
  {
    id: 'respond',
    title: "Share Your Verdict",
    description: "Give them a clear answer and explain your thinking.",
    icon: ThumbsUp,
    color: 'green',
    tips: [
      "Start with your recommendation (yes/no, A/B, etc.)",
      "Give 2-3 specific reasons why",
      "Be constructive - help them improve",
    ],
  },
];

export function FirstVerdictGuide({ onDismiss, onComplete, category }: FirstVerdictGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = GUIDE_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'bg-indigo-100 text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      text: 'text-indigo-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-700',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      text: 'text-green-700',
    },
  };

  const colors = colorClasses[step.color as keyof typeof colorClasses];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={`${colors.bg} ${colors.border} border-2 rounded-2xl shadow-2xl max-w-md w-full p-6 relative`}
      >
        {/* Skip button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {GUIDE_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-current ' + colors.text
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <Icon className="h-8 w-8" />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
            <p className="text-gray-600 mb-6">{step.description}</p>

            {/* Tips */}
            <div className="text-left space-y-2 mb-6">
              {step.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                  <span className="text-sm text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3 ${colors.button} text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2`}
          >
            {isLastStep ? (
              <>
                <Sparkles className="h-4 w-4" />
                Start My First Verdict
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Encouragement */}
        <p className="text-center text-xs text-gray-500 mt-4">
          <Lightbulb className="h-3 w-3 inline mr-1" />
          {category ? `You're reviewing a ${category} request` : 'You got this!'}
        </p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Simplified verdict form for first-time judges
 */
interface SimplifiedVerdictFormProps {
  verdictSummary: string;
  setVerdictSummary: (value: string) => void;
  reasons: string;
  setReasons: (value: string) => void;
  rating: number;
  setRating: (value: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  earning: string;
}

export function SimplifiedVerdictForm({
  verdictSummary,
  setVerdictSummary,
  reasons,
  setReasons,
  rating,
  setRating,
  onSubmit,
  submitting,
  earning,
}: SimplifiedVerdictFormProps) {
  const canSubmit = verdictSummary.trim().length >= 10 && reasons.length >= 40;

  return (
    <div className="space-y-6">
      {/* Friendly header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          Share Your Honest Opinion
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          There's no wrong answer - just tell them what you think and why.
        </p>
      </div>

      {/* Simple rating with emoji scale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How would you rate this? <span className="text-gray-400">(1-10)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl">😕</span>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="flex-1 h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-2xl">😍</span>
          <span className="ml-2 text-2xl font-bold text-gray-900 w-8">{rating}</span>
        </div>
      </div>

      {/* Verdict */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your verdict in one sentence
          <span className="text-gray-400 font-normal ml-1">(be clear and direct)</span>
        </label>
        <input
          value={verdictSummary}
          onChange={(e) => setVerdictSummary(e.target.value)}
          placeholder="e.g., 'Go with Option A - it's more flattering and professional.'"
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
        />
        {verdictSummary.length > 0 && verdictSummary.length < 10 && (
          <p className="text-sm text-amber-600 mt-1">Keep going... ({10 - verdictSummary.length} more characters)</p>
        )}
        {verdictSummary.length >= 10 && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Great start!
          </p>
        )}
      </div>

      {/* Reasons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why do you think so?
          <span className="text-gray-400 font-normal ml-1">(2-3 specific reasons)</span>
        </label>
        <textarea
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          placeholder="Share your reasoning:&#10;- First reason...&#10;- Second reason...&#10;- Any helpful suggestions..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
          rows={5}
        />
        <div className="flex justify-between items-center mt-1">
          <p className={`text-sm ${reasons.length < 40 ? 'text-amber-600' : 'text-green-600'}`}>
            {reasons.length < 40
              ? `${40 - reasons.length} more characters needed`
              : `${reasons.length} characters - nice detail!`}
          </p>
          <p className="text-xs text-gray-400">{reasons.length}/500</p>
        </div>
      </div>

      {/* Earning preview */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-800 font-medium">You'll earn</p>
            <p className="text-xs text-green-600">Available after 7 days</p>
          </div>
          <p className="text-2xl font-bold text-green-600">${earning}</p>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          canSubmit && !submitting
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Submit My Verdict
          </>
        )}
      </button>

      {!canSubmit && (
        <p className="text-center text-sm text-gray-500">
          Complete both fields above to submit
        </p>
      )}
    </div>
  );
}
