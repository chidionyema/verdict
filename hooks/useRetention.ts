'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RetentionData {
  // User activity
  lastActivityDate: string | null;
  lastRequestDate: string | null;
  lastJudgmentDate: string | null;
  daysSinceLastActivity: number;

  // Streak data
  currentStreak: number;
  longestStreak: number;
  streakProtectionAvailable: boolean;
  judgmentsToday: number;

  // Progress
  totalRequests: number;
  totalJudgments: number;
  creditsEarned: number;
  creditsSpent: number;

  // Engagement level
  engagementLevel: 'high' | 'medium' | 'low' | 'at_risk' | 'churned';

  // Profile completion
  profileCompletionPercentage: number;
  profileMissingFields: string[];

  // Loading state
  loading: boolean;
}

interface RetentionActions {
  recordActivity: (type: 'request' | 'judgment' | 'login') => Promise<void>;
  useStreakProtection: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const INITIAL_DATA: RetentionData = {
  lastActivityDate: null,
  lastRequestDate: null,
  lastJudgmentDate: null,
  daysSinceLastActivity: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakProtectionAvailable: true,
  judgmentsToday: 0,
  totalRequests: 0,
  totalJudgments: 0,
  creditsEarned: 0,
  creditsSpent: 0,
  engagementLevel: 'medium',
  profileCompletionPercentage: 0,
  profileMissingFields: [],
  loading: true,
};

export function useRetention(userId?: string): [RetentionData, RetentionActions] {
  const [data, setData] = useState<RetentionData>(INITIAL_DATA);

  const calculateEngagementLevel = useCallback((daysSince: number, streak: number, totalActivity: number): RetentionData['engagementLevel'] => {
    if (daysSince > 30) return 'churned';
    if (daysSince > 14) return 'at_risk';
    if (daysSince > 7 || streak === 0) return 'low';
    if (streak >= 7 || totalActivity > 50) return 'high';
    return 'medium';
  }, []);

  const calculateProfileCompletion = useCallback((profile: any): { percentage: number; missing: string[] } => {
    const fields = [
      { key: 'display_name', label: 'Display name' },
      { key: 'avatar_url', label: 'Profile photo' },
      { key: 'email_verified', label: 'Verified email' },
      { key: 'bio', label: 'Bio' },
      { key: 'location', label: 'Location' },
    ];

    const missing: string[] = [];
    let completed = 0;

    fields.forEach(field => {
      if (profile?.[field.key]) {
        completed++;
      } else {
        missing.push(field.label);
      }
    });

    return {
      percentage: Math.round((completed / fields.length) * 100),
      missing,
    };
  }, []);

  const fetchRetentionData = useCallback(async () => {
    if (!userId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch user's requests
      const { data: requests } = await supabase
        .from('verdict_requests')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: { created_at: string }[] | null };

      // Fetch user's judgments
      const { data: judgments } = await supabase
        .from('feedback_responses')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: { created_at: string }[] | null };

      // Calculate dates
      const lastRequestDate = (requests?.[0] as any)?.created_at || null;
      const lastJudgmentDate = (judgments?.[0] as any)?.created_at || null;
      const lastActivityDate = [lastRequestDate, lastJudgmentDate]
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;

      const daysSinceLastActivity = lastActivityDate
        ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate judgments today
      const judgmentsToday = judgments?.filter((j: any) =>
        j.created_at?.startsWith(today)
      ).length || 0;

      // Calculate streak
      let currentStreak = 0;
      if (judgments && judgments.length > 0) {
        const judgmentDates = judgments.map((j: any) => new Date(j.created_at).toDateString());
        const uniqueDates = [...new Set(judgmentDates)];
        const todayStr = new Date().toDateString();
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
          currentStreak = 1;
          let checkDate = uniqueDates.includes(todayStr)
            ? new Date(Date.now() - 24 * 60 * 60 * 1000)
            : new Date(Date.now() - 48 * 60 * 60 * 1000);

          while (currentStreak < uniqueDates.length) {
            const checkDateStr = checkDate.toDateString();
            if (uniqueDates.includes(checkDateStr)) {
              currentStreak++;
              checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
            } else {
              break;
            }
          }
        }
      }

      // Get longest streak from storage or calculate
      const storedLongestStreak = parseInt(localStorage.getItem(`verdict_longest_streak_${userId}`) || '0');
      const longestStreak = Math.max(currentStreak, storedLongestStreak);
      if (currentStreak > storedLongestStreak) {
        localStorage.setItem(`verdict_longest_streak_${userId}`, currentStreak.toString());
      }

      // Check streak protection
      const protectionUsedKey = `verdict_streak_protection_${userId}_${getWeekNumber(new Date())}`;
      const streakProtectionAvailable = !localStorage.getItem(protectionUsedKey);

      // Profile completion
      const { percentage: profileCompletionPercentage, missing: profileMissingFields } =
        calculateProfileCompletion(profile);

      // Calculate engagement level
      const totalActivity = (requests?.length || 0) + (judgments?.length || 0);
      const engagementLevel = calculateEngagementLevel(daysSinceLastActivity, currentStreak, totalActivity);

      setData({
        lastActivityDate,
        lastRequestDate,
        lastJudgmentDate,
        daysSinceLastActivity,
        currentStreak,
        longestStreak,
        streakProtectionAvailable,
        judgmentsToday,
        totalRequests: requests?.length || 0,
        totalJudgments: judgments?.length || 0,
        creditsEarned: (profile as any)?.credits_earned || 0,
        creditsSpent: (profile as any)?.credits_spent || 0,
        engagementLevel,
        profileCompletionPercentage,
        profileMissingFields,
        loading: false,
      });

    } catch (error) {
      console.error('Error fetching retention data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [userId, calculateEngagementLevel, calculateProfileCompletion]);

  // Record activity
  const recordActivity = useCallback(async (type: 'request' | 'judgment' | 'login') => {
    if (!userId) return;

    const now = new Date().toISOString();
    const key = `verdict_last_${type}_${userId}`;
    localStorage.setItem(key, now);

    // Refresh data after recording
    await fetchRetentionData();
  }, [userId, fetchRetentionData]);

  // Use streak protection
  const useStreakProtection = useCallback(async (): Promise<boolean> => {
    if (!userId || !data.streakProtectionAvailable) return false;

    const protectionUsedKey = `verdict_streak_protection_${userId}_${getWeekNumber(new Date())}`;
    localStorage.setItem(protectionUsedKey, 'true');

    setData(prev => ({ ...prev, streakProtectionAvailable: false }));
    return true;
  }, [userId, data.streakProtectionAvailable]);

  // Initial fetch
  useEffect(() => {
    fetchRetentionData();
  }, [fetchRetentionData]);

  // Record login on mount
  useEffect(() => {
    if (userId) {
      recordActivity('login');
    }
  }, [userId]);

  const actions: RetentionActions = {
    recordActivity,
    useStreakProtection,
    refreshData: fetchRetentionData,
  };

  return [data, actions];
}

// Helper to get ISO week number
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

// Hook for checking if user should see win-back content
export function useWinBack(userId?: string): {
  shouldShowWinBack: boolean;
  inactivityLevel: 'active' | 'cooling' | 'inactive' | 'dormant' | 'churned';
  daysSinceActivity: number;
  dismiss: () => void;
} {
  const [retentionData] = useRetention(userId);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(`verdict_winback_dismissed_${userId}`);
    if (dismissedAt) {
      const daysSinceDismissed = Math.floor(
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      );
      setDismissed(daysSinceDismissed < 3);
    }
  }, [userId]);

  const getInactivityLevel = (days: number) => {
    if (days <= 2) return 'active' as const;
    if (days <= 7) return 'cooling' as const;
    if (days <= 14) return 'inactive' as const;
    if (days <= 30) return 'dormant' as const;
    return 'churned' as const;
  };

  const inactivityLevel = getInactivityLevel(retentionData.daysSinceLastActivity);
  const shouldShowWinBack = !dismissed && inactivityLevel !== 'active';

  const dismiss = useCallback(() => {
    if (userId) {
      localStorage.setItem(`verdict_winback_dismissed_${userId}`, Date.now().toString());
      setDismissed(true);
    }
  }, [userId]);

  return {
    shouldShowWinBack,
    inactivityLevel,
    daysSinceActivity: retentionData.daysSinceLastActivity,
    dismiss,
  };
}

// Hook for streak tracking
export function useStreak(userId?: string): {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  protectionAvailable: boolean;
  judgmentsToday: number;
  daysToNextMilestone: number;
  nextMilestone: number;
} {
  const [retentionData] = useRetention(userId);

  const MILESTONES = [3, 7, 14, 30, 60, 100];
  const nextMilestone = MILESTONES.find(m => m > retentionData.currentStreak) || MILESTONES[MILESTONES.length - 1];
  const daysToNextMilestone = nextMilestone - retentionData.currentStreak;

  // Streak is at risk if last activity was 20-24 hours ago
  const isAtRisk = retentionData.currentStreak > 0 &&
    retentionData.daysSinceLastActivity === 0 &&
    retentionData.judgmentsToday === 0;

  return {
    currentStreak: retentionData.currentStreak,
    longestStreak: retentionData.longestStreak,
    isAtRisk,
    protectionAvailable: retentionData.streakProtectionAvailable,
    judgmentsToday: retentionData.judgmentsToday,
    daysToNextMilestone,
    nextMilestone,
  };
}
