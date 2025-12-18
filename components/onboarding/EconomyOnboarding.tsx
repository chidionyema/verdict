'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Zap, Users, CheckCircle, Gift, Sparkles, Play, X } from 'lucide-react';
import { getPricingTexts } from '@/lib/localization';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  action?: string;
  highlight: string;
}

interface EconomyOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail?: string;
}

export function EconomyOnboarding({ isOpen, onClose, onComplete, userEmail }: EconomyOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const pricing = getPricingTexts();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to the Review Economy! 🎉',
      description: 'AskVerdict works differently. Instead of just paying for everything, you can earn free feedback by helping others.',
      highlight: 'Help others, get helped back',
      visual: (
        <div className="flex items-center justify-center space-x-4 my-8">
          <div className="bg-blue-100 rounded-full p-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="bg-purple-100 rounded-full p-4">
            <Gift className="h-8 w-8 text-purple-600" />
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      )
    },
    {
      id: 'judge-five',
      title: 'Judge 3 = Earn 1 Credit',
      description: 'Review 3 submissions from the community and automatically earn 1 credit. It\'s that simple!',
      highlight: 'Takes about 15 minutes',
      action: 'Try judging now',
      visual: (
        <div className="my-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                showAnimation && num <= 3 ? 'bg-blue-600' : 'bg-gray-300'
              } transition-colors duration-500`} style={{ transitionDelay: `${num * 200}ms` }}>
                {num}
              </div>
            ))}
          </div>
          <div className="text-center">
            <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mb-4" />
            <div className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-4 inline-block font-bold ${showAnimation ? 'animate-bounce' : ''}`}>
              🎉 +1 Credit Earned!
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'use-credit',
      title: 'Use Your Credit for Free Feedback',
      description: 'Spend your earned credit to submit your own request and get 3 honest feedback reports - completely free!',
      highlight: 'Same quality as paid submissions',
      action: 'Submit your first request',
      visual: (
        <div className="my-8 text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-4 inline-block font-bold mb-4">
            1 Credit
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mb-4" />
          <div className="bg-white border-2 border-green-200 rounded-xl p-6 max-w-sm mx-auto">
            <h4 className="font-bold text-gray-900 mb-2">Your Question</h4>
            <p className="text-sm text-gray-600 mb-4">"Should I wear this outfit to my job interview?"</p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Review {num}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'two-paths',
      title: 'Two Ways to Get Feedback',
      description: 'Choose what works for you: earn credits by judging others, or pay for instant private results.',
      highlight: 'Both paths get you 3 quality reports',
      visual: (
        <div className="grid grid-cols-2 gap-4 my-8">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-green-900">Free Path</h4>
            <p className="text-sm text-green-700">Judge 3 → Earn credit</p>
            <p className="text-xs text-green-600 mt-1">~15 minutes</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
            <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <Zap className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-purple-900">Instant Path</h4>
            <p className="text-sm text-purple-700">Pay {pricing.privateSubmissionPrice} → Submit now</p>
            <p className="text-xs text-purple-600 mt-1">No waiting</p>
          </div>
        </div>
      )
    },
    {
      id: 'ready',
      title: 'Ready to Get Started? 🚀',
      description: 'Jump into the community feed and start reviewing! Your first 5 judgments will earn you a free submission credit.',
      highlight: 'Join thousands helping each other',
      action: 'Start reviewing now',
      visual: (
        <div className="my-8 text-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 max-w-md mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">You're Ready!</h4>
            <p className="text-indigo-100">
              Start judging and earning credits in the community feed
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => setShowAnimation(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setShowAnimation(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setShowAnimation(true);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_skipped', 'true');
    onClose();
  };

  const handleAction = () => {
    if (currentStepData.action) {
      onComplete();
      // Redirect based on the action
      if (currentStepData.action.includes('judging') || currentStepData.action.includes('reviewing')) {
        window.location.href = '/feed';
      } else if (currentStepData.action.includes('submit')) {
        window.location.href = '/submit-unified';
      }
    } else {
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8">
          {/* Progress bar */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-indigo-600 w-8'
                    : index < currentStep
                    ? 'bg-green-500 w-4'
                    : 'bg-gray-200 w-4'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-gray-600 mb-2 max-w-md mx-auto">
              {currentStepData.description}
            </p>
            <div className="text-sm text-indigo-600 font-semibold mb-6">
              {currentStepData.highlight}
            </div>

            {/* Visual */}
            <div className="animate-fade-in">
              {currentStepData.visual}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isFirstStep
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex gap-3">
                {currentStepData.action && (
                  <button
                    onClick={handleAction}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {currentStepData.action}
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isLastStep ? 'Get Started' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Helper text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </p>
              {userEmail && currentStep === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Welcome {userEmail}! 👋
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}