'use client';

import { EconomyOnboarding } from './EconomyOnboarding';
import { useOnboarding } from '@/hooks/useOnboarding';

export function OnboardingTrigger() {
  const { 
    shouldShowOnboarding, 
    userEmail, 
    loading,
    completeOnboarding, 
    skipOnboarding 
  } = useOnboarding();

  if (loading) {
    return null;
  }

  return (
    <EconomyOnboarding
      isOpen={shouldShowOnboarding}
      onClose={skipOnboarding}
      onComplete={completeOnboarding}
      userEmail={userEmail}
    />
  );
}