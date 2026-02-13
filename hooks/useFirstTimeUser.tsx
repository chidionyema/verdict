'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FirstTimeUserState {
  isNewUser: boolean;
  hasSubmittedRequest: boolean;
  hasJudgedRequest: boolean;
  hasEarnedMoney: boolean;
  hasVerifiedEmail: boolean;
  totalSubmissions: number;
  totalVerdicts: number;
  totalEarnings: number;
  accountAgeInDays: number;
  isLoading: boolean;
  // Tour state
  hasSeenSubmitTour: boolean;
  hasSeenJudgeTour: boolean;
  hasSeenDashboardTour: boolean;
}

const TOUR_STORAGE_KEYS = {
  submit: 'verdict_submit_tour_completed',
  judge: 'verdict_judge_tour_completed',
  dashboard: 'verdict_dashboard_tour_completed',
};

export function useFirstTimeUser() {
  const [state, setState] = useState<FirstTimeUserState>({
    isNewUser: false,
    hasSubmittedRequest: false,
    hasJudgedRequest: false,
    hasEarnedMoney: false,
    hasVerifiedEmail: false,
    totalSubmissions: 0,
    totalVerdicts: 0,
    totalEarnings: 0,
    accountAgeInDays: 0,
    isLoading: true,
    hasSeenSubmitTour: false,
    hasSeenJudgeTour: false,
    hasSeenDashboardTour: false,
  });

  const checkUserState = useCallback(async () => {
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check localStorage for tour completion
      const hasSeenSubmitTour = localStorage.getItem(TOUR_STORAGE_KEYS.submit) === 'true';
      const hasSeenJudgeTour = localStorage.getItem(`${TOUR_STORAGE_KEYS.judge}_${user.id}`) === 'true' ||
                               localStorage.getItem(`${TOUR_STORAGE_KEYS.judge}_${user.id}`) === 'skipped';
      const hasSeenDashboardTour = localStorage.getItem(TOUR_STORAGE_KEYS.dashboard) === 'true';

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, email_verified, total_submissions, total_reviews, total_earnings')
        .eq('id', user.id)
        .single() as { data: {
          created_at?: string;
          email_verified?: boolean;
          total_submissions?: number;
          total_reviews?: number;
          total_earnings?: number;
        } | null };

      // Calculate account age
      const accountAgeInDays = profile?.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const totalSubmissions = profile?.total_submissions || 0;
      const totalVerdicts = profile?.total_reviews || 0;
      const totalEarnings = profile?.total_earnings || 0;

      setState({
        isNewUser: accountAgeInDays < 7 && totalSubmissions === 0 && totalVerdicts === 0,
        hasSubmittedRequest: totalSubmissions > 0,
        hasJudgedRequest: totalVerdicts > 0,
        hasEarnedMoney: totalEarnings > 0,
        hasVerifiedEmail: Boolean(profile?.email_verified),
        totalSubmissions,
        totalVerdicts,
        totalEarnings,
        accountAgeInDays,
        isLoading: false,
        hasSeenSubmitTour,
        hasSeenJudgeTour,
        hasSeenDashboardTour,
      });
    } catch (error) {
      console.error('Error checking first-time user state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkUserState();
  }, [checkUserState]);

  // Functions to mark tours as completed
  const completeSubmitTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEYS.submit, 'true');
    setState(prev => ({ ...prev, hasSeenSubmitTour: true }));
  }, []);

  const completeJudgeTour = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`${TOUR_STORAGE_KEYS.judge}_${user.id}`, 'true');
    }
    setState(prev => ({ ...prev, hasSeenJudgeTour: true }));
  }, []);

  const completeDashboardTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEYS.dashboard, 'true');
    setState(prev => ({ ...prev, hasSeenDashboardTour: true }));
  }, []);

  // Reset functions for testing
  const resetTours = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    localStorage.removeItem(TOUR_STORAGE_KEYS.submit);
    localStorage.removeItem(TOUR_STORAGE_KEYS.dashboard);
    if (user) {
      localStorage.removeItem(`${TOUR_STORAGE_KEYS.judge}_${user.id}`);
    }
    setState(prev => ({
      ...prev,
      hasSeenSubmitTour: false,
      hasSeenJudgeTour: false,
      hasSeenDashboardTour: false,
    }));
  }, []);

  return {
    ...state,
    refresh: checkUserState,
    completeSubmitTour,
    completeJudgeTour,
    completeDashboardTour,
    resetTours,
  };
}

// Context for sharing first-time user state across components
const FirstTimeUserContext = createContext<ReturnType<typeof useFirstTimeUser> | null>(null);

export function FirstTimeUserProvider({ children }: { children: ReactNode }) {
  const value = useFirstTimeUser();
  return (
    <FirstTimeUserContext.Provider value={value}>
      {children}
    </FirstTimeUserContext.Provider>
  );
}

export function useFirstTimeUserContext() {
  const context = useContext(FirstTimeUserContext);
  if (!context) {
    throw new Error('useFirstTimeUserContext must be used within FirstTimeUserProvider');
  }
  return context;
}
