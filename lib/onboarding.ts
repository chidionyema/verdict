/**
 * Mandatory Onboarding System
 *
 * Manages the complete onboarding flow ensuring users:
 * - Understand platform rules and safety
 * - Complete essential profile setup
 * - Learn how to use key features
 * - Accept community guidelines
 * - Complete first meaningful interaction
 */

import { createClient } from '@/lib/supabase/client';

export interface OnboardingState {
  profile_completed: boolean;
  tutorial_completed: boolean;
  guidelines_accepted: boolean;
  first_submission_completed: boolean;
  first_judgment_completed: boolean;
  email_verified: boolean;
  safety_training_completed: boolean;
  onboarding_completed: boolean;
}

export interface OnboardingStep {
  id: keyof OnboardingState;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  estimatedTime: string;
  component?: string;
  action?: () => void;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'email_verified',
    title: 'Verify Your Email',
    description: 'Confirm your email address to secure your account',
    icon: '📧',
    required: false,
    estimatedTime: '1 min',
    component: 'EmailVerification'
  },
  {
    id: 'profile_completed',
    title: 'Complete Your Profile',
    description: 'Add basic information to personalize your experience',
    icon: '👤',
    required: true,
    estimatedTime: '2 min',
    component: 'ProfileSetup'
  },
  {
    id: 'guidelines_accepted',
    title: 'Community Guidelines',
    description: 'Learn our community rules and safety guidelines',
    icon: '📋',
    required: true,
    estimatedTime: '3 min',
    component: 'GuidelinesAcceptance'
  },
  {
    id: 'safety_training_completed',
    title: 'Safety Training',
    description: 'Learn how to give and receive feedback safely',
    icon: '🛡️',
    required: true,
    estimatedTime: '4 min',
    component: 'SafetyTraining'
  },
  {
    id: 'tutorial_completed',
    title: 'Platform Tutorial',
    description: 'Learn how to submit requests and judge others',
    icon: '🎯',
    required: true,
    estimatedTime: '5 min',
    component: 'PlatformTutorial'
  },
  {
    id: 'first_judgment_completed',
    title: 'Practice Judging',
    description: 'Complete your first practice judgment to earn credits',
    icon: '⚖️',
    required: false,
    estimatedTime: '10 min',
    component: 'FirstJudgment'
  },
  {
    id: 'first_submission_completed',
    title: 'First Submission',
    description: 'Create your first feedback request',
    icon: '🚀',
    required: false,
    estimatedTime: '5 min',
    component: 'FirstSubmission'
  }
];

export class OnboardingManager {
  private static instance: OnboardingManager;
  private supabase = createClient();

  static getInstance(): OnboardingManager {
    if (!OnboardingManager.instance) {
      OnboardingManager.instance = new OnboardingManager();
    }
    return OnboardingManager.instance;
  }

  /**
   * Get user's onboarding state
   */
  async getUserOnboardingState(userId: string): Promise<OnboardingState | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single()

      // Handle case where profile doesn't exist yet
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding state:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          error
        });
        return null;
      }

      // Return a default state based on available data
      const onboardingState: OnboardingState = {
        profile_completed: data ? true : false, // False if no profile exists yet
        tutorial_completed: false,
        guidelines_accepted: false,
        first_submission_completed: false,
        first_judgment_completed: false,
        email_verified: data ? true : false, // False if no profile exists yet
        safety_training_completed: false,
        onboarding_completed: (data as any)?.onboarding_completed || false
      };

      return onboardingState;
    } catch (error) {
      console.error('Error in getUserOnboardingState:', error);
      return null;
    }
  }

  /**
   * Update onboarding step completion
   */
  async completeStep(userId: string, stepId: keyof OnboardingState): Promise<boolean> {
    try {
      // For now, only update onboarding_completed if it's the final step
      if (stepId === 'onboarding_completed') {
        const { error } = await (this.supabase
          .from('profiles')
          .update as any)({ 
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error(`Error completing step ${stepId}:`, error);
          return false;
        }
      }

      // For other steps, just return true since we don't store them individually yet
      return true;
    } catch (error) {
      console.error('Error in completeStep:', error);
      return false;
    }
  }

  /**
   * Check if onboarding is complete and update accordingly
   */
  async checkOnboardingCompletion(userId: string): Promise<boolean> {
    try {
      const state = await this.getUserOnboardingState(userId);
      if (!state) return false;

      // Check if all required steps are completed
      const requiredSteps = ONBOARDING_STEPS.filter(step => step.required);
      const allRequiredCompleted = requiredSteps.every(step => 
        state[step.id] === true
      );

      if (allRequiredCompleted && !state.onboarding_completed) {
        // Mark onboarding as completed
        const { error } = await (this.supabase
          .from('profiles')
          .update as any)({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Error marking onboarding complete:', error);
          return false;
        }

        return true;
      }

      return state.onboarding_completed;
    } catch (error) {
      console.error('Error in checkOnboardingCompletion:', error);
      return false;
    }
  }

  /**
   * Get next required step
   */
  getNextRequiredStep(state: OnboardingState): OnboardingStep | null {
    const requiredSteps = ONBOARDING_STEPS.filter(step => step.required);
    
    for (const step of requiredSteps) {
      if (!state[step.id]) {
        return step;
      }
    }

    return null; // All required steps completed
  }

  /**
   * Get next optional step
   */
  getNextOptionalStep(state: OnboardingState): OnboardingStep | null {
    const optionalSteps = ONBOARDING_STEPS.filter(step => !step.required);
    
    for (const step of optionalSteps) {
      if (!state[step.id]) {
        return step;
      }
    }

    return null; // All optional steps completed
  }

  /**
   * Get onboarding progress percentage
   */
  getProgress(state: OnboardingState): { required: number; total: number } {
    const requiredSteps = ONBOARDING_STEPS.filter(step => step.required);
    const allSteps = ONBOARDING_STEPS;

    const requiredCompleted = requiredSteps.filter(step => state[step.id]).length;
    const totalCompleted = allSteps.filter(step => state[step.id]).length;

    return {
      required: (requiredCompleted / requiredSteps.length) * 100,
      total: (totalCompleted / allSteps.length) * 100
    };
  }

  /**
   * Force complete onboarding for admin testing
   */
  async forceCompleteOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase
        .from('profiles')
        .update as any)({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Error in forceCompleteOnboarding:', error);
      return false;
    }
  }
}

// Singleton instance
export const onboardingManager = OnboardingManager.getInstance();

// Convenience functions
export const getUserOnboarding = (userId: string) => 
  onboardingManager.getUserOnboardingState(userId);

export const completeOnboardingStep = (userId: string, stepId: keyof OnboardingState) =>
  onboardingManager.completeStep(userId, stepId);

export const isOnboardingComplete = (userId: string) =>
  onboardingManager.checkOnboardingCompletion(userId);

export const getOnboardingProgress = (state: OnboardingState) =>
  onboardingManager.getProgress(state);

export const getNextStep = (state: OnboardingState) =>
  onboardingManager.getNextRequiredStep(state) || onboardingManager.getNextOptionalStep(state);