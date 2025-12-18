'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalJudgments: number;
  judgmentsToday: number;
  streakMultiplier: number;
  nextMilestone: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function useStreakTracking(userId?: string) {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    totalJudgments: 0,
    judgmentsToday: 0,
    streakMultiplier: 1,
    nextMilestone: 7
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  // Achievement definitions
  const achievementTemplates: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
    {
      id: 'first_judgment',
      name: 'First Steps',
      description: 'Made your first judgment',
      icon: '🌱'
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: '7-day judgment streak',
      icon: '⚡'
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      description: '30-day judgment streak',
      icon: '🔥'
    },
    {
      id: 'judgments_100',
      name: 'Century Club',
      description: '100 total judgments',
      icon: '💯'
    },
    {
      id: 'judgments_500',
      name: 'Judgment Machine',
      description: '500 total judgments',
      icon: '🤖'
    },
    {
      id: 'quality_expert',
      name: 'Quality Expert',
      description: 'Maintain 90%+ quality score',
      icon: '⭐'
    },
    {
      id: 'community_champion',
      name: 'Community Champion',
      description: 'Help 1000+ people with feedback',
      icon: '🏆'
    }
  ];

  // Fetch streak data and calculate current status
  const fetchStreakData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get user's judgment history
      const { data: judgments } = await supabase
        .from('feedback_responses')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: { created_at: string }[] | null };

      if (!judgments) {
        setLoading(false);
        return;
      }

      // Calculate streak data
      const now = new Date();
      const today = now.toDateString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
      
      const judgmentDates = judgments.map(j => new Date(j.created_at).toDateString());
      const uniqueDates = [...new Set(judgmentDates)];
      
      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(now);
      
      // If user judged today, start from today, otherwise from yesterday
      if (uniqueDates.includes(today)) {
        currentStreak = 1;
        checkDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (uniqueDates.includes(yesterday)) {
        currentStreak = 1;
        checkDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      } else {
        currentStreak = 0;
      }
      
      // Continue counting backwards
      while (currentStreak > 0) {
        const checkDateStr = checkDate.toDateString();
        if (uniqueDates.includes(checkDateStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
      
      // Calculate longest streak (simplified)
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;
      
      for (const dateStr of uniqueDates) {
        const date = new Date(dateStr);
        if (lastDate && (lastDate.getTime() - date.getTime()) <= 24 * 60 * 60 * 1000) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = date;
      }
      
      const judgmentsToday = judgmentDates.filter(d => d === today).length;
      const totalJudgments = judgments.length;
      
      setStreakData({
        currentStreak,
        longestStreak,
        lastActivityDate: judgments[0]?.created_at || null,
        totalJudgments,
        judgmentsToday,
        streakMultiplier: Math.floor(currentStreak / 7) + 1,
        nextMilestone: currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : (Math.floor(currentStreak / 100) + 1) * 100
      });

      // Check for new achievements
      checkAchievements(currentStreak, longestStreak, totalJudgments);
      
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has unlocked new achievements
  const checkAchievements = (currentStreak: number, longestStreak: number, totalJudgments: number) => {
    const unlockedAchievements: Achievement[] = [];
    
    achievementTemplates.forEach(template => {
      const existing = achievements.find(a => a.id === template.id);
      let shouldUnlock = false;
      
      switch (template.id) {
        case 'first_judgment':
          shouldUnlock = totalJudgments >= 1;
          break;
        case 'streak_7':
          shouldUnlock = longestStreak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = longestStreak >= 30;
          break;
        case 'judgments_100':
          shouldUnlock = totalJudgments >= 100;
          break;
        case 'judgments_500':
          shouldUnlock = totalJudgments >= 500;
          break;
        default:
          shouldUnlock = false;
      }
      
      if (shouldUnlock && (!existing || !existing.unlocked)) {
        const newAchievement = {
          ...template,
          unlocked: true,
          unlockedAt: new Date()
        };
        unlockedAchievements.push(newAchievement);
        
        // Show achievement notification for the first new one
        if (unlockedAchievements.length === 1) {
          setNewAchievement(newAchievement);
          setTimeout(() => setNewAchievement(null), 5000);
        }
      }
    });
    
    setAchievements(prev => {
      const updated = [...prev];
      unlockedAchievements.forEach(newAch => {
        const existingIndex = updated.findIndex(a => a.id === newAch.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = newAch;
        } else {
          updated.push(newAch);
        }
      });
      return updated;
    });
  };

  // Record a new judgment activity
  const recordJudgmentActivity = async () => {
    if (!userId) return;
    
    // Refresh streak data after recording activity
    await fetchStreakData();
    
    // Trigger streak celebration if appropriate
    if (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0) {
      const event = new CustomEvent('streak_milestone', {
        detail: { streak: streakData.currentStreak, milestone: true }
      });
      window.dispatchEvent(event);
    }
  };

  // Get motivational message based on streak
  const getMotivationalMessage = (): string => {
    const { currentStreak, judgmentsToday } = streakData;
    
    if (judgmentsToday === 0) {
      return "Start your daily streak! Judge your first submission today.";
    }
    
    if (currentStreak === 0) {
      return "Great start! Keep judging to build your streak.";
    }
    
    if (currentStreak < 7) {
      return `${7 - currentStreak} more days to reach your first weekly milestone!`;
    }
    
    if (currentStreak < 30) {
      return `Amazing ${currentStreak}-day streak! ${30 - currentStreak} days to monthly master!`;
    }
    
    return `Incredible ${currentStreak}-day streak! You're a judgment legend! 🏆`;
  };

  useEffect(() => {
    fetchStreakData();
  }, [userId]);

  return {
    streakData,
    achievements,
    loading,
    newAchievement,
    recordJudgmentActivity,
    getMotivationalMessage,
    refreshData: fetchStreakData
  };
}