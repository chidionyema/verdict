'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  getUserOnboarding, 
  completeOnboardingStep, 
  getOnboardingProgress,
  getNextStep,
  ONBOARDING_STEPS,
  type OnboardingState 
} from '@/lib/onboarding';
import { User } from '@supabase/supabase-js';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Lock,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { ProfileSetup } from './ProfileSetup';
import { GuidelinesAcceptance } from './GuidelinesAcceptance';
import { SafetyTraining } from './SafetyTraining';

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
  allowSkip?: boolean;
}

export function OnboardingFlow({ user, onComplete, allowSkip = false }: OnboardingFlowProps) {
  const router = useRouter();
  const supabase = createClient();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadOnboardingState();
  }, [user.id]);

  const loadOnboardingState = async () => {
    setLoading(true);
    try {
      const state = await getUserOnboarding(user.id);
      if (state) {
        setOnboardingState(state);
        
        // Find the current step index
        const nextStep = getNextStep(state);
        if (nextStep) {
          const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === nextStep.id);
          setCurrentStepIndex(stepIndex);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
    setLoading(false);
  };

  const handleStepComplete = async (stepId: keyof OnboardingState) => {
    setIsCompleting(true);
    try {
      const success = await completeOnboardingStep(user.id, stepId);
      if (success) {
        // Reload state to get updated progress
        await loadOnboardingState();
        
        // Move to next step or complete onboarding
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < ONBOARDING_STEPS.length) {
          setCurrentStepIndex(nextStepIndex);
        } else {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
    setIsCompleting(false);
  };

  if (loading || !onboardingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const progress = getOnboardingProgress(onboardingState);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isStepCompleted = onboardingState[currentStep.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header with progress */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Getting Started</h1>
              <p className="text-sm text-gray-600">
                Complete setup to unlock all features
              </p>
            </div>
            
            {allowSkip && (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 p-2"
                aria-label="Skip onboarding"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Required steps</span>
              <span>{Math.round(progress.required)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.required}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Setup Steps</h3>
              <div className="space-y-3">
                {ONBOARDING_STEPS.map((step, index) => {
                  const isCompleted = onboardingState[step.id];
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : isCompleted 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted 
                          ? 'bg-green-600 text-white' 
                          : isCurrent 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-indigo-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {step.title}
                        </p>
                        {step.required && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Lock className="h-3 w-3" />
                            Required
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Step header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{currentStep.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{currentStep.title}</h2>
                    <p className="text-indigo-100 mt-1">{currentStep.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-indigo-200">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {currentStep.estimatedTime}
                      </div>
                      {currentStep.required && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          Required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {isStepCompleted && (
                  <div className="mt-4 bg-green-500/20 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-200" />
                    <span className="text-sm font-medium text-green-100">Step completed</span>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="p-6">
                <OnboardingStepContent
                  step={currentStep}
                  user={user}
                  isCompleted={isStepCompleted}
                  onComplete={() => handleStepComplete(currentStep.id)}
                  loading={isCompleting}
                />
              </div>

              {/* Navigation */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <button
                  onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  {!currentStep.required && !isStepCompleted && (
                    <button
                      onClick={() => setCurrentStepIndex(Math.min(ONBOARDING_STEPS.length - 1, currentStepIndex + 1))}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Skip for now
                    </button>
                  )}
                  
                  <button
                    onClick={() => setCurrentStepIndex(Math.min(ONBOARDING_STEPS.length - 1, currentStepIndex + 1))}
                    disabled={currentStep.required && !isStepCompleted}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Complete Setup' : 'Next Step'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for rendering step-specific content
interface OnboardingStepContentProps {
  step: typeof ONBOARDING_STEPS[0];
  user: User;
  isCompleted: boolean;
  onComplete: () => void;
  loading: boolean;
}

function OnboardingStepContent({ 
  step, 
  user, 
  isCompleted, 
  onComplete, 
  loading 
}: OnboardingStepContentProps) {
  
  // Render specific step components based on step ID
  switch (step.id) {
    case 'profile_completed':
      return (
        <ProfileSetup
          user={user}
          onComplete={onComplete}
          loading={loading}
        />
      );
    
    case 'guidelines_accepted':
      return (
        <GuidelinesAcceptance
          onAccept={onComplete}
          loading={loading}
        />
      );
    
    case 'safety_training_completed':
      return (
        <SafetyTraining
          onComplete={onComplete}
          loading={loading}
        />
      );
    
    default:
      // Generic step content for other steps
      return (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {getStepInstructions(step.id)}
            </p>
          </div>

          {!isCompleted && (
            <div className="bg-gray-50 rounded-lg p-4">
              <button
                onClick={onComplete}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Step completed successfully!</span>
            </div>
          )}
        </div>
      );
  }
}

function getStepInstructions(stepId: string): string {
  switch (stepId) {
    case 'email_verified':
      return 'Please check your email and click the verification link to confirm your account.';
    case 'profile_completed':
      return 'Add your display name, location, and other basic information to help us personalize your experience.';
    case 'guidelines_accepted':
      return 'Read and accept our community guidelines to ensure a safe and respectful environment for everyone.';
    case 'safety_training_completed':
      return 'Learn about giving constructive feedback and receiving criticism in a healthy way.';
    case 'tutorial_completed':
      return 'Take a quick tour of the platform to understand how to submit requests and provide judgments.';
    case 'first_judgment_completed':
      return 'Complete your first practice judgment to earn credits and understand how the review process works.';
    case 'first_submission_completed':
      return 'Create your first feedback request to experience the full platform workflow.';
    default:
      return 'Complete this step to continue with your onboarding.';
  }
}