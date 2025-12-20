'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Heart,
  Timer,
  Sparkles
} from 'lucide-react';

interface ProgressiveProfileProps {
  user: User;
  onComplete: () => void;
  loading?: boolean;
  trigger?: 'signup' | 'first_submit' | 'credits_earned' | 'manual';
}

interface ProfileStep {
  id: string;
  title: string;
  subtitle: string;
  field: string;
  type: 'text' | 'select' | 'multi-select';
  options?: string[];
  required: boolean;
  motivation: string;
  icon: any;
  timing: 'immediate' | 'after_first_action' | 'after_credits' | 'optional';
}

const PROGRESSIVE_STEPS: ProfileStep[] = [
  {
    id: 'display_name',
    title: 'What should we call you?',
    subtitle: 'Just a name to personalize your experience',
    field: 'display_name',
    type: 'text',
    required: true,
    motivation: 'So reviewers can address you personally',
    icon: UserIcon,
    timing: 'immediate'
  },
  {
    id: 'age_range',
    title: 'What\'s your age range?',
    subtitle: 'Helps us match you with relevant perspectives',
    field: 'age_range',
    type: 'select',
    options: ['18-24', '25-34', '35-44', '45-54', '55+'],
    required: true,
    motivation: 'Age context helps reviewers give better advice',
    icon: Timer,
    timing: 'after_first_action'
  },
  {
    id: 'interests',
    title: 'What are you interested in?',
    subtitle: 'We\'ll show you more relevant requests to review',
    field: 'interests',
    type: 'multi-select',
    options: [
      'Fashion & Style', 
      'Career & Professional', 
      'Dating & Relationships',
      'Life Decisions',
      'Creative Work',
      'Business Ideas'
    ],
    required: false,
    motivation: 'Earn more credits by reviewing in your areas of interest',
    icon: Heart,
    timing: 'after_credits'
  }
];

export function ProgressiveProfile({ 
  user, 
  onComplete, 
  loading = false,
  trigger = 'signup' 
}: ProgressiveProfileProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  const supabase = createClient();
  
  // Determine which steps to show based on trigger
  const relevantSteps = PROGRESSIVE_STEPS.filter(step => {
    if (trigger === 'signup') return step.timing === 'immediate';
    if (trigger === 'first_submit') return step.timing === 'after_first_action';
    if (trigger === 'credits_earned') return step.timing === 'after_credits';
    return true; // manual shows all
  });

  const currentStep = relevantSteps[currentStepIndex];
  const isLastStep = currentStepIndex === relevantSteps.length - 1;

  useEffect(() => {
    loadExistingProfile();
  }, [user.id]);

  const loadExistingProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfileData(data);
        // Mark completed steps
        const completed = new Set<string>();
        if ((data as any).display_name) completed.add('display_name');
        if ((data as any).age_range) completed.add('age_range');
        if ((data as any).interests?.length > 0) completed.add('interests');
        setCompletedSteps(completed);

        // Skip to first incomplete step
        const firstIncomplete = relevantSteps.findIndex(
          step => !completed.has(step.id)
        );
        if (firstIncomplete !== -1) {
          setCurrentStepIndex(firstIncomplete);
        } else if (relevantSteps.length > 0) {
          // All steps completed for this trigger
          onComplete();
          return;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleStepValue = (value: any) => {
    setProfileData(prev => ({
      ...prev,
      [currentStep.field]: value
    }));
  };

  const saveStep = async () => {
    if (!currentStep) return;

    setSaving(true);
    try {
      const updateData = {
        [currentStep.field]: profileData[currentStep.field],
        updated_at: new Date().toISOString()
      };

      // Mark profile as completed if this was the last required step
      const allRequiredCompleted = PROGRESSIVE_STEPS
        .filter(s => s.required)
        .every(s => 
          completedSteps.has(s.id) || s.id === currentStep.id
        );

      if (allRequiredCompleted) {
        updateData.profile_completed = true;
      }

      const { error } = await (supabase
        .from('profiles')
        .update as any)(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Mark step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));

      // Move to next step or complete
      if (isLastStep) {
        onComplete();
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error saving step:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentStep.required) return;
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const canContinue = () => {
    if (!currentStep) return false;
    
    const value = profileData[currentStep.field];
    if (currentStep.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return false;
    }
    return true;
  };

  if (!currentStep) {
    return null;
  }

  const Icon = currentStep.icon;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Quick Setup</h3>
                <p className="text-indigo-100 text-sm">
                  Step {currentStepIndex + 1} of {relevantSteps.length}
                </p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-indigo-200" />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-indigo-400 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentStepIndex + 1) / relevantSteps.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h4>
            <p className="text-gray-600">
              {currentStep.subtitle}
            </p>
            <p className="text-sm text-indigo-600 mt-2 flex items-center justify-center gap-1">
              <Star className="h-3 w-3" />
              {currentStep.motivation}
            </p>
          </div>

          {/* Step Input */}
          <div className="space-y-4">
            {currentStep.type === 'text' && (
              <input
                type="text"
                value={profileData[currentStep.field] || ''}
                onChange={(e) => handleStepValue(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg"
                autoFocus
              />
            )}

            {currentStep.type === 'select' && (
              <div className="grid grid-cols-1 gap-2">
                {currentStep.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleStepValue(option)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      profileData[currentStep.field] === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentStep.type === 'multi-select' && (
              <div className="grid grid-cols-2 gap-2">
                {currentStep.options?.map((option) => {
                  const isSelected = (profileData[currentStep.field] || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const current = profileData[currentStep.field] || [];
                        const updated = isSelected
                          ? current.filter((item: string) => item !== option)
                          : [...current, option];
                        handleStepValue(updated);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4 inline mr-1" />}
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {!currentStep.required && (
                <button
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Skip for now
                </button>
              )}
            </div>
            
            <button
              onClick={saveStep}
              disabled={!canContinue() || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                canContinue() && !saving
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                'Saving...'
              ) : isLastStep ? (
                'Complete'
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Incentive */}
      <div className="mt-4 text-center text-sm text-gray-600">
        {trigger === 'signup' && '🎉 Complete setup to get 3 free credits!'}
        {trigger === 'first_submit' && '⚡ Quick info to improve your feedback quality'}
        {trigger === 'credits_earned' && '🏆 Unlock better matching for more earnings'}
      </div>
    </div>
  );
}