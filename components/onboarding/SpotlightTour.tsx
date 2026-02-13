'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: ReactNode;
  color?: 'indigo' | 'green' | 'amber' | 'purple' | 'blue';
  action?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
}

interface SpotlightTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  storageKey?: string;
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-600',
    button: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
    progress: 'bg-indigo-500',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    button: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    progress: 'bg-green-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    progress: 'bg-amber-500',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    button: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    progress: 'bg-purple-500',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    button: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    progress: 'bg-blue-500',
  },
};

export function SpotlightTour({
  steps,
  isOpen,
  onComplete,
  onSkip,
}: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const colors = colorClasses[step?.color || 'indigo'];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !step?.target) {
      // Use a ref or callback pattern instead of calling setState directly
      const timer = setTimeout(() => setTargetRect(null), 0);
      return () => clearTimeout(timer);
    }

    const findTarget = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    // Use requestAnimationFrame to avoid calling setState synchronously
    const rafId = requestAnimationFrame(findTarget);
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOpen, step?.target, currentStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  if (!isOpen || !step) return null;

  const getTooltipPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 300;

    switch (step.position) {
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'top':
        return {
          position: 'fixed' as const,
          top: targetRect.top - tooltipHeight - padding,
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Backdrop with spotlight cutout */}
        <div className="absolute inset-0 bg-black/60">
          {targetRect && (
            <div
              className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-lg"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
            />
          )}
        </div>

        {/* Spotlight ring around target */}
        {targetRect && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute border-2 border-white rounded-lg pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 20px rgba(255,255,255,0.5)',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          style={getTooltipPosition()}
        >
          {/* Header */}
          <div className={`${colors.bg} ${colors.border} border-b p-5 relative`}>
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Skip tour"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${colors.progress} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Icon and title */}
            <div className="flex items-start gap-4">
              {step.icon && (
                <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {step.icon}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="text-gray-600 mb-4">{step.description}</p>

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <div className="space-y-2 mb-4">
                {step.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom action */}
            {step.action && (
              <button
                onClick={step.action.onClick}
                className={`w-full mb-4 py-2.5 bg-gradient-to-r ${colors.button} text-white rounded-lg font-medium flex items-center justify-center gap-2`}
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isFirstStep
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                className={`flex items-center gap-1 px-5 py-2 bg-gradient-to-r ${colors.button} text-white rounded-lg font-medium transition-all`}
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Started
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

// Preset tours for common flows
export const SUBMIT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Verdict!',
    description: 'Get honest, anonymous feedback from real people on anything - photos, text, or decisions.',
    position: 'center',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'indigo',
    tips: [
      'Real humans, not AI - authentic opinions',
      'Completely anonymous for honest feedback',
      'Get multiple perspectives (3-15 verdicts)',
    ],
  },
  {
    id: 'choose-category',
    title: 'Choose Your Category',
    description: 'Select what type of feedback you need. This helps match you with the right judges.',
    target: '[data-tour="category-select"]',
    position: 'bottom',
    color: 'blue',
    tips: [
      'Dating photos, outfit choices, writing samples',
      'Life decisions, business ideas, creative work',
    ],
  },
  {
    id: 'upload-content',
    title: 'Share What You Need Feedback On',
    description: 'Upload photos or write text describing your situation. Be specific for better feedback!',
    target: '[data-tour="content-upload"]',
    position: 'bottom',
    color: 'purple',
    tips: [
      'Photos: Up to 5 images supported',
      'Text: Describe your situation clearly',
      'More context = better verdicts',
    ],
  },
  {
    id: 'submit',
    title: 'Submit and Relax',
    description: 'Hit submit and judges will start reviewing. You\'ll be notified as verdicts come in!',
    target: '[data-tour="submit-button"]',
    position: 'top',
    color: 'green',
    tips: [
      'Average response time: 2 hours',
      'Get notified for each new verdict',
      'Rate verdicts to improve quality',
    ],
  },
];

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Your Dashboard',
    description: 'This is your home base. Track your requests, see verdicts, and manage everything in one place.',
    position: 'center',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'indigo',
  },
  {
    id: 'requests',
    title: 'Your Requests',
    description: 'All your submitted requests appear here. Click any to see the verdicts.',
    target: '[data-tour="requests-list"]',
    position: 'right',
    color: 'blue',
  },
  {
    id: 'credits',
    title: 'Your Credits',
    description: 'Credits are used to submit requests. Earn free credits by judging others!',
    target: '[data-tour="credits-display"]',
    position: 'bottom',
    color: 'amber',
    tips: [
      'Judge 3 requests = Earn 1 credit',
      'Or purchase credits for instant access',
    ],
  },
];
