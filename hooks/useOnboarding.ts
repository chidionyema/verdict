'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OnboardingState {
  shouldShowOnboarding: boolean;
  hasSeenOnboarding: boolean;
  userEmail?: string;
  isNewUser: boolean;
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    shouldShowOnboarding: false,
    hasSeenOnboarding: false,
    isNewUser: false
  });

  const [loading, setLoading] = useState(true);

  // Check if user should see onboarding
  const checkOnboardingStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check localStorage first (faster)
      const hasSeenOnboarding = localStorage.getItem('onboarding_completed') === 'true' || 
                               localStorage.getItem('onboarding_skipped') === 'true';

      if (hasSeenOnboarding) {
        setOnboardingState({
          shouldShowOnboarding: false,
          hasSeenOnboarding: true,
          userEmail: user.email,
          isNewUser: false
        });
        setLoading(false);
        return;
      }

      // Check if user has made any judgments (indicates they understand the system)
      const { data: judgments, count: judgmentCount } = await supabase
        .from('feedback_responses')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has any submissions (indicates they've used the platform)
      const { data: submissions, count: submissionCount } = await supabase
        .from('feedback_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(1);

      // Check how old the account is
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single() as { data: { created_at: string } | null };

      const accountAge = profile?.created_at ? 
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;

      // Show onboarding if:
      // 1. No judgments made AND no submissions made AND account less than 3 days old
      // 2. Or if they explicitly haven't seen it
      const isNewUser = accountAge < 3;
      const hasNoActivity = (judgmentCount || 0) === 0 && (submissionCount || 0) === 0;
      const shouldShow = isNewUser && hasNoActivity && !hasSeenOnboarding;

      setOnboardingState({
        shouldShowOnboarding: shouldShow,
        hasSeenOnboarding,
        userEmail: user.email,
        isNewUser
      });

    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingState({
        shouldShowOnboarding: false,
        hasSeenOnboarding: false,
        isNewUser: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark onboarding as completed
  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setOnboardingState(prev => ({
      ...prev,
      shouldShowOnboarding: false,
      hasSeenOnboarding: true
    }));

    // Track completion for analytics
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('onboarding_completed', {
        detail: { timestamp: Date.now(), userEmail: onboardingState.userEmail }
      });
      window.dispatchEvent(event);
    }
  };

  // Skip onboarding
  const skipOnboarding = () => {
    localStorage.setItem('onboarding_skipped', 'true');
    setOnboardingState(prev => ({
      ...prev,
      shouldShowOnboarding: false,
      hasSeenOnboarding: true
    }));

    // Track skip for analytics
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('onboarding_skipped', {
        detail: { timestamp: Date.now(), userEmail: onboardingState.userEmail }
      });
      window.dispatchEvent(event);
    }
  };

  // Force show onboarding (for testing or help)
  const showOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      shouldShowOnboarding: true
    }));
  };

  // Reset onboarding (for testing)
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_skipped');
    checkOnboardingStatus();
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkOnboardingStatus();
      } else if (event === 'SIGNED_OUT') {
        setOnboardingState({
          shouldShowOnboarding: false,
          hasSeenOnboarding: false,
          isNewUser: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...onboardingState,
    loading,
    completeOnboarding,
    skipOnboarding,
    showOnboarding,
    resetOnboarding
  };
}