'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileCompletionStatus {
  display_name: boolean;
  age_range: boolean;
  interests: boolean;
  profile_completed: boolean;
}

interface UseProgressiveProfileReturn {
  shouldShow: boolean;
  triggerType: 'signup' | 'first_submit' | 'credits_earned' | 'manual';
  completionStatus: ProfileCompletionStatus;
  dismiss: () => void;
  checkTrigger: (event: string) => void;
}

export function useProgressiveProfile(): UseProgressiveProfileReturn {
  const [shouldShow, setShouldShow] = useState(false);
  const [triggerType, setTriggerType] = useState<'signup' | 'first_submit' | 'credits_earned' | 'manual'>('signup');
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus>({
    display_name: false,
    age_range: false,
    interests: false,
    profile_completed: false
  });
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadUserAndStatus();
  }, []);

  const loadUserAndStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, age_range, interests, profile_completed, created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        const status = {
          display_name: !!(profile as any).display_name,
          age_range: !!(profile as any).age_range,
          interests: (profile as any).interests && (profile as any).interests.length > 0,
          profile_completed: !!(profile as any).profile_completed
        };
        
        setCompletionStatus(status);

        // Determine if we should show progressive profile
        const accountAge = Date.now() - new Date((profile as any).created_at).getTime();
        const isNewUser = accountAge < 24 * 60 * 60 * 1000; // 24 hours

        // Show for new users who haven't completed basic info
        if (isNewUser && !status.display_name) {
          setTriggerType('signup');
          setShouldShow(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile status:', error);
    }
  };

  const checkTrigger = async (event: string) => {
    if (!userId || completionStatus.profile_completed) return;

    try {
      if (event === 'first_submit' && !completionStatus.age_range) {
        // User is submitting their first request - ask for age range
        setTriggerType('first_submit');
        setShouldShow(true);
      } else if (event === 'credits_earned' && !completionStatus.interests) {
        // User earned credits - ask for interests to improve matching
        setTriggerType('credits_earned');
        setShouldShow(true);
      } else if (event === 'manual') {
        // Manual trigger from profile page
        setTriggerType('manual');
        setShouldShow(true);
      }
    } catch (error) {
      console.error('Error checking trigger:', error);
    }
  };

  const dismiss = () => {
    setShouldShow(false);
  };

  return {
    shouldShow,
    triggerType,
    completionStatus,
    dismiss,
    checkTrigger
  };
}