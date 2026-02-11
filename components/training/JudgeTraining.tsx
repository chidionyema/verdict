'use client';

import { useState } from 'react';
import { CheckCircle, ArrowRight, X, Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface JudgeTrainingProps {
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

export function JudgeTraining({ onComplete, onSkip, className = '' }: JudgeTrainingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Judging!',
      subtitle: 'Earn credits by giving helpful feedback',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center">
            <div className="text-5xl mb-3">⚖️</div>
            <p className="text-gray-700 font-medium">
              People submit photos, text, or ideas and want honest feedback from real people like you.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">How it works:</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1 ml-7">
              <li>• Review submissions from others</li>
              <li>• Give a quick rating (thumbs up/down)</li>
              <li>• Write helpful feedback</li>
              <li>• <strong>Earn 1 credit for every 3 reviews</strong></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Good Feedback Examples',
      subtitle: 'Be helpful, specific, and kind',
      content: (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">Someone asks: "Does this haircut suit me for a job interview?"</p>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Good response:</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                "Looks professional and well-groomed! The clean lines work great for a corporate setting. Maybe add a bit of styling product for extra polish on the day."
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">Someone shares a dating profile photo:</p>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-gray-900">Constructive critique:</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                "The lighting is quite dark and the car background is distracting. Try natural light near a window with a clean background - it'll make a huge difference!"
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Avoid These Mistakes',
      subtitle: 'Low-effort responses hurt your reputation',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <X className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Don't do this:</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white border border-red-100 rounded-lg p-3 flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">"looks good" <span className="text-red-500">(too short)</span></p>
              </div>
              <div className="bg-white border border-red-100 rounded-lg p-3 flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">"terrible lol" <span className="text-red-500">(not helpful)</span></p>
              </div>
              <div className="bg-white border border-red-100 rounded-lg p-3 flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">"idk maybe" <span className="text-red-500">(no real feedback)</span></p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-indigo-800">Minimum requirements:</span>
            </div>
            <ul className="text-sm text-indigo-700 space-y-1 ml-7">
              <li>• At least 50 characters of feedback</li>
              <li>• Be specific about what works or doesn't</li>
              <li>• Offer suggestions when giving critique</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className={`max-w-lg mx-auto ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-bold text-lg">{currentStepData.title}</h3>
              <p className="text-indigo-100 text-sm">{currentStepData.subtitle}</p>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="text-right">
                <div className="text-sm opacity-80">
                  {currentStep + 1} of {steps.length}
                </div>
                <div className="flex gap-1 mt-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= currentStep ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Skip training"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex-shrink-0">
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Start Earning Credits</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full mt-2 py-2.5 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
