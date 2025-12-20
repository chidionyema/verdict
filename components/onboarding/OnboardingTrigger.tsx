'use client';

import { OnboardingFlow } from './OnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export function OnboardingTrigger() {
  const [user, setUser] = useState<any>(null);
  const { 
    shouldShowOnboarding, 
    loading,
    completeOnboarding, 
    skipOnboarding 
  } = useOnboarding();

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  if (loading || !user) {
    return null;
  }

  if (!shouldShowOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()}>
        <OnboardingFlow
          user={user}
          onComplete={completeOnboarding}
          allowSkip={true}
        />
      </div>
    </div>
  );
}