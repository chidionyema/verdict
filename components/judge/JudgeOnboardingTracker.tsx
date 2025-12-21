'use client';

import { CheckCircle, Circle, Lock, Clock, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  reward?: string;
  completed: boolean;
  current: boolean;
  locked: boolean;
}

interface JudgeOnboardingTrackerProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function JudgeOnboardingTracker({ currentStep, onStepClick }: JudgeOnboardingTrackerProps) {
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome & Benefits',
      description: 'Learn about judge role and earnings',
      duration: '1 min',
      reward: 'Unlock qualification',
      completed: currentStep > 0,
      current: currentStep === 0,
      locked: false
    },
    {
      id: 'guidelines',
      title: 'Quality Guidelines',
      description: 'Learn what makes great feedback',
      duration: '2 min',
      reward: 'Quality badge',
      completed: currentStep > 1,
      current: currentStep === 1,
      locked: currentStep < 0
    },
    {
      id: 'quiz',
      title: 'Qualification Quiz',
      description: 'Test your understanding (75% to pass)',
      duration: '2 min',
      reward: 'Judge status',
      completed: currentStep > 2,
      current: currentStep === 2,
      locked: currentStep < 1
    },
    {
      id: 'profile',
      title: 'Judge Profile',
      description: 'Set your preferences and expertise',
      duration: '1 min',
      reward: '$5 welcome bonus',
      completed: currentStep > 3,
      current: currentStep === 3,
      locked: currentStep < 2
    }
  ];

  const totalDuration = steps.reduce((acc, step) => {
    const minutes = parseInt(step.duration);
    return acc + minutes;
  }, 0);

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Become a Judge</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{totalDuration} minutes total</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedSteps} of {steps.length} steps completed
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const canClick = !step.locked && onStepClick;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => canClick && onStepClick(index)}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${step.current 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                  : step.completed
                  ? 'border-green-200 bg-green-50'
                  : step.locked
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${canClick ? 'cursor-pointer' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Step indicator */}
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  ) : step.current ? (
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                      <Circle className="h-6 w-6 text-white" />
                    </div>
                  ) : step.locked ? (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-gray-500">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${
                      step.current ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h4>
                    <span className="text-sm text-gray-500">{step.duration}</span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    step.current ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>

                  {step.reward && (
                    <div className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                      step.completed 
                        ? 'bg-green-100 text-green-800' 
                        : step.current
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.completed ? (
                        <Trophy className="h-3 w-3" />
                      ) : (
                        <Star className="h-3 w-3" />
                      )}
                      <span>{step.reward}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current step indicator */}
              {step.current && (
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Motivational message */}
      {completedSteps === steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Congratulations!</h4>
              <p className="text-sm text-green-700">
                You're now a qualified judge. Start earning immediately!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Encouragement for current step */}
      {currentStep < steps.length && steps[currentStep] && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>Next up:</strong> {steps[currentStep].description}
            {steps[currentStep].reward && (
              <span className="block mt-1">
                Complete to earn: <strong>{steps[currentStep].reward}</strong>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}