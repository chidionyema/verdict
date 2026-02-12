'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Gavel,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  PartyPopper,
} from 'lucide-react';

interface NewJudgeWelcomeTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome, Judge!',
    description: "You've joined a community of people helping others make better decisions. Here's how to get started.",
    icon: PartyPopper,
    color: 'indigo',
    tips: [
      'You can judge as much or as little as you want',
      'Each verdict takes just 1-2 minutes',
      "Your honest opinion is what people need",
    ],
  },
  {
    id: 'queue',
    title: 'Your Verdict Queue',
    description: 'This is where you\'ll find requests waiting for your feedback. Look for the "Quick" badge for easy ones to start with.',
    icon: Gavel,
    color: 'blue',
    tips: [
      'Green "Quick" badges = shorter, simpler requests',
      '"Needs help" badges = requests waiting longer',
      'Start with your strongest categories',
    ],
  },
  {
    id: 'earnings',
    title: 'Track Your Earnings',
    description: "You earn real money for every verdict. Payments are processed weekly after a 7-day maturation period.",
    icon: DollarSign,
    color: 'green',
    tips: [
      'Community requests: $0.60 per verdict',
      'Standard requests: $1.00 per verdict',
      'Expert requests: $2.00+ per verdict',
    ],
  },
  {
    id: 'progress',
    title: 'Level Up & Earn More',
    description: 'As you submit more verdicts, you\'ll unlock higher tiers with bonus earnings and access to premium requests.',
    icon: TrendingUp,
    color: 'purple',
    tips: [
      '10 verdicts = Bronze Judge (+5% bonus)',
      '25 verdicts = Silver Judge (+10% bonus)',
      'Daily streaks unlock extra rewards',
    ],
  },
  {
    id: 'ready',
    title: "You're Ready!",
    description: 'Time to submit your first verdict. Remember: there\'s no wrong answer - just share your honest opinion.',
    icon: Sparkles,
    color: 'amber',
    tips: [
      'Be specific and actionable',
      'Explain your reasoning',
      'Be kind but honest',
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string; button: string }> = {
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-600',
    button: 'from-indigo-600 to-purple-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    button: 'from-blue-600 to-cyan-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    button: 'from-green-600 to-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    button: 'from-purple-600 to-pink-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    button: 'from-amber-500 to-orange-500',
  },
};

export function NewJudgeWelcomeTour({ onComplete, onSkip }: NewJudgeWelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TOUR_STEPS[currentStep];
  const colors = colorClasses[step.color];
  const Icon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className={`${colors.bg} ${colors.border} border-b p-6 relative`}>
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {TOUR_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-gray-800'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Icon and title */}
            <div className="text-center">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}
              >
                <Icon className="h-8 w-8" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-gray-600 text-center mb-6">{step.description}</p>

                {/* Tips */}
                <div className="space-y-2 mb-6">
                  {step.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                  isFirstStep
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <span className="text-sm text-gray-400">
                {currentStep + 1} of {TOUR_STEPS.length}
              </span>

              <button
                onClick={handleNext}
                className={`flex items-center gap-1 px-6 py-2 bg-gradient-to-r ${colors.button} text-white rounded-xl font-medium hover:shadow-lg transition-all`}
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Judging
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage welcome tour state
 */
export function useWelcomeTour(userId: string) {
  const [showTour, setShowTour] = useState(false);
  const STORAGE_KEY = `verdict_judge_tour_completed_${userId}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [STORAGE_KEY]);

  const completeTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(STORAGE_KEY, 'skipped');
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowTour(true);
  };

  return { showTour, completeTour, skipTour, resetTour };
}
