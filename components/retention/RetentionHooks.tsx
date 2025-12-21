'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Award,
  Calendar,
  TrendingUp,
  CheckCircle,
  Crown,
  Heart,
  MessageSquare,
  Zap,
  Gift,
  Users,
  Medal
} from 'lucide-react';

interface RetentionHooksProps {
  userId: string;
  userStats: {
    total_reviews: number;
    total_submissions: number;
    current_streak: number;
    longest_streak: number;
    credits: number;
    signup_date: string;
    last_activity_date?: string;
  };
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  type: 'reviews' | 'submissions' | 'streak' | 'community' | 'special';
  requirement: number;
  reward?: {
    credits?: number;
    badge?: string;
    title?: string;
  };
  unlocked: boolean;
  progress: number;
  unlockedDate?: string;
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress' | 'unlockedDate'>[] = [
  // Review Achievements
  {
    id: 'first_review',
    title: 'First Feedback',
    description: 'Complete your first review',
    icon: Heart,
    color: 'pink',
    type: 'reviews',
    requirement: 1,
    reward: { credits: 1 }
  },
  {
    id: 'helpful_reviewer',
    title: 'Helpful Reviewer',
    description: 'Complete 10 reviews',
    icon: Star,
    color: 'blue',
    type: 'reviews',
    requirement: 10,
    reward: { credits: 2, badge: 'Helper' }
  },
  {
    id: 'expert_reviewer',
    title: 'Expert Reviewer',
    description: 'Complete 50 reviews',
    icon: Crown,
    color: 'purple',
    type: 'reviews',
    requirement: 50,
    reward: { credits: 5, title: 'Expert Judge' }
  },
  {
    id: 'master_reviewer',
    title: 'Master Reviewer',
    description: 'Complete 100 reviews',
    icon: Trophy,
    color: 'gold',
    type: 'reviews',
    requirement: 100,
    reward: { credits: 10, title: 'Master Judge' }
  },
  
  // Submission Achievements
  {
    id: 'first_submission',
    title: 'First Request',
    description: 'Submit your first request',
    icon: MessageSquare,
    color: 'green',
    type: 'submissions',
    requirement: 1,
    reward: { credits: 1 }
  },
  {
    id: 'active_seeker',
    title: 'Active Seeker',
    description: 'Submit 5 requests',
    icon: Target,
    color: 'orange',
    type: 'submissions',
    requirement: 5,
    reward: { credits: 2 }
  },
  {
    id: 'feedback_lover',
    title: 'Feedback Lover',
    description: 'Submit 20 requests',
    icon: Zap,
    color: 'yellow',
    type: 'submissions',
    requirement: 20,
    reward: { credits: 5, badge: 'Enthusiast' }
  },
  
  // Streak Achievements
  {
    id: 'streak_3',
    title: 'Getting Warmed Up',
    description: 'Review for 3 days in a row',
    icon: Flame,
    color: 'red',
    type: 'streak',
    requirement: 3,
    reward: { credits: 2 }
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Review for 7 days in a row',
    icon: Calendar,
    color: 'indigo',
    type: 'streak',
    requirement: 7,
    reward: { credits: 5, badge: 'Consistent' }
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Review for 30 days in a row',
    icon: Medal,
    color: 'emerald',
    type: 'streak',
    requirement: 30,
    reward: { credits: 15, title: 'Dedication Master' }
  },
  
  // Community Achievements
  {
    id: 'community_champion',
    title: 'Community Champion',
    description: 'Help 25 different people with feedback',
    icon: Users,
    color: 'teal',
    type: 'community',
    requirement: 25,
    reward: { credits: 8, title: 'Community Champion' }
  },
  
  // Special Achievements
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join during the first month of launch',
    icon: Gift,
    color: 'rose',
    type: 'special',
    requirement: 1,
    reward: { credits: 5, badge: 'Pioneer' }
  }
];

export function RetentionHooks({ userId, userStats, onAchievementUnlocked }: RetentionHooksProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const [showProgressToast, setShowProgressToast] = useState<Achievement | null>(null);
  const [streakData, setStreakData] = useState({
    current: userStats.current_streak || 0,
    longest: userStats.longest_streak || 0,
    isOnFire: false
  });

  useEffect(() => {
    calculateAchievements();
    calculateStreakStatus();
  }, [userStats]);

  const calculateAchievements = () => {
    const savedAchievements = localStorage.getItem(`verdict_achievements_${userId}`);
    let previousAchievements: Achievement[] = [];
    
    if (savedAchievements) {
      try {
        previousAchievements = JSON.parse(savedAchievements);
      } catch (e) {
        // Ignore errors
      }
    }

    const updatedAchievements = ACHIEVEMENTS.map(template => {
      const previous = previousAchievements.find(a => a.id === template.id);
      let progress = 0;
      let unlocked = previous?.unlocked || false;

      // Calculate progress based on type
      switch (template.type) {
        case 'reviews':
          progress = Math.min(userStats.total_reviews, template.requirement);
          break;
        case 'submissions':
          progress = Math.min(userStats.total_submissions, template.requirement);
          break;
        case 'streak':
          progress = Math.min(userStats.longest_streak, template.requirement);
          break;
        case 'community':
          // For now, use reviews as proxy for helping different people
          progress = Math.min(Math.floor(userStats.total_reviews / 2), template.requirement);
          break;
        case 'special':
          if (template.id === 'early_adopter') {
            const signupDate = new Date(userStats.signup_date);
            const launchDate = new Date('2024-01-01'); // Adjust this to actual launch date
            const monthAfterLaunch = new Date(launchDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            progress = signupDate <= monthAfterLaunch ? 1 : 0;
          }
          break;
      }

      // Check if newly unlocked
      const shouldUnlock = progress >= template.requirement && !unlocked;
      if (shouldUnlock) {
        unlocked = true;
        
        // Show unlock notification
        const newAchievement = { ...template, unlocked, progress, unlockedDate: new Date().toISOString() };
        setRecentUnlock(newAchievement);
        onAchievementUnlocked?.(newAchievement);
        
        // Award credits if applicable
        if (template.reward?.credits) {
          // In a real app, this would call an API to award credits
          console.log(`Awarded ${template.reward.credits} credits for ${template.title}`);
        }
      }

      // Show progress toast for achievements close to completion
      if (!unlocked && progress >= template.requirement * 0.8 && progress < template.requirement) {
        const shouldShowToast = !previous || previous.progress < template.requirement * 0.8;
        if (shouldShowToast) {
          setTimeout(() => {
            setShowProgressToast({ ...template, unlocked, progress });
          }, 2000);
        }
      }

      return {
        ...template,
        unlocked,
        progress,
        unlockedDate: previous?.unlockedDate || (unlocked ? new Date().toISOString() : undefined)
      };
    });

    setAchievements(updatedAchievements);
    
    // Save to localStorage
    localStorage.setItem(`verdict_achievements_${userId}`, JSON.stringify(updatedAchievements));
  };

  const calculateStreakStatus = () => {
    const isOnFire = userStats.current_streak >= 3;
    setStreakData({
      current: userStats.current_streak || 0,
      longest: userStats.longest_streak || 0,
      isOnFire
    });
  };

  const getNextMilestone = () => {
    const unlockedAchievements = achievements.filter(a => !a.unlocked);
    if (unlockedAchievements.length === 0) return null;
    
    // Find the closest achievement to completion
    return unlockedAchievements.reduce((closest, current) => {
      const currentProgress = current.progress / current.requirement;
      const closestProgress = closest.progress / closest.requirement;
      return currentProgress > closestProgress ? current : closest;
    });
  };

  const dismissRecentUnlock = () => {
    setRecentUnlock(null);
  };

  const dismissProgressToast = () => {
    setShowProgressToast(null);
  };

  return (
    <>
      {/* Achievement Unlock Modal */}
      <AnimatePresence>
        {recentUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={dismissRecentUnlock}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-r ${
                recentUnlock.color === 'gold' ? 'from-yellow-400 to-yellow-600' :
                recentUnlock.color === 'purple' ? 'from-purple-500 to-purple-700' :
                recentUnlock.color === 'blue' ? 'from-blue-500 to-blue-700' :
                'from-green-500 to-green-700'
              } text-white p-6 text-center`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                >
                  <recentUnlock.icon className="h-8 w-8" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Achievement Unlocked!</h3>
                <h4 className="text-lg font-semibold">{recentUnlock.title}</h4>
              </div>
              
              <div className="p-6 text-center">
                <p className="text-gray-700 mb-4">{recentUnlock.description}</p>
                
                {recentUnlock.reward && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Reward</h5>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      {recentUnlock.reward.credits && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span>{recentUnlock.reward.credits} credits</span>
                        </div>
                      )}
                      {recentUnlock.reward.badge && (
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-purple-600" />
                          <span>{recentUnlock.reward.badge} badge</span>
                        </div>
                      )}
                      {recentUnlock.reward.title && (
                        <div className="flex items-center gap-1">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <span>{recentUnlock.reward.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={dismissRecentUnlock}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Toast */}
      <AnimatePresence>
        {showProgressToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-4 left-1/2 transform bg-white rounded-xl shadow-lg border p-4 z-40 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-${showProgressToast.color}-100 flex items-center justify-center`}>
                <showProgressToast.icon className={`h-5 w-5 text-${showProgressToast.color}-600`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{showProgressToast.title}</h4>
                <p className="text-xs text-gray-600">
                  {showProgressToast.progress}/{showProgressToast.requirement} - Almost there!
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className={`h-1 rounded-full bg-${showProgressToast.color}-500 transition-all`}
                    style={{ width: `${(showProgressToast.progress / showProgressToast.requirement) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={dismissProgressToast}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Progress Widget */}
      <div className="space-y-4">
        {/* Streak Status */}
        {streakData.current > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-gradient-to-r ${
              streakData.isOnFire 
                ? 'from-orange-100 to-red-100 border-orange-300' 
                : 'from-blue-100 to-indigo-100 border-blue-300'
            } border rounded-xl p-4`}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={streakData.isOnFire ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-10 h-10 rounded-full ${
                  streakData.isOnFire 
                    ? 'bg-orange-500' 
                    : 'bg-blue-500'
                } flex items-center justify-center`}
              >
                <Flame className={`h-5 w-5 text-white ${streakData.isOnFire ? 'animate-pulse' : ''}`} />
              </motion.div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {streakData.current} Day Streak! {streakData.isOnFire && '🔥'}
                </h4>
                <p className="text-sm text-gray-600">
                  Personal best: {streakData.longest} days
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Milestone */}
        {getNextMilestone() && (
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">Next Goal</h4>
                <p className="text-xs text-gray-600 mb-2">{getNextMilestone()?.title}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ 
                      width: `${(getNextMilestone()!.progress / getNextMilestone()!.requirement) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getNextMilestone()!.progress}/{getNextMilestone()!.requirement}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Hook for using retention data
export function useRetentionHooks(userId: string) {
  const [retentionData, setRetentionData] = useState({
    showWidget: true,
    unlockedAchievements: 0,
    currentStreak: 0,
    totalPoints: 0
  });

  useEffect(() => {
    const savedData = localStorage.getItem(`verdict_retention_${userId}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setRetentionData(data);
      } catch (e) {
        // Ignore errors
      }
    }
  }, [userId]);

  const updateRetentionData = (updates: Partial<typeof retentionData>) => {
    const newData = { ...retentionData, ...updates };
    setRetentionData(newData);
    localStorage.setItem(`verdict_retention_${userId}`, JSON.stringify(newData));
  };

  return { retentionData, updateRetentionData };
}