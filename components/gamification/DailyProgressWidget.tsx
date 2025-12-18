'use client';

import { useState, useEffect } from 'react';
import { Flame, Target, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { useStreakTracking } from '@/hooks/useStreakTracking';

interface DailyProgressWidgetProps {
  userId?: string;
  compact?: boolean;
  className?: string;
}

interface DailyGoal {
  id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  icon: React.ElementType;
  color: string;
  reward: string;
}

export function DailyProgressWidget({ userId, compact = false, className = '' }: DailyProgressWidgetProps) {
  const { streakData, getMotivationalMessage } = useStreakTracking(userId);
  const [showCelebration, setShowCelebration] = useState(false);

  // Define daily goals
  const dailyGoals: DailyGoal[] = [
    {
      id: 'judgments',
      name: 'Daily Judgments',
      description: 'Judge 3 submissions',
      current: streakData.judgmentsToday,
      target: 3,
      icon: Target,
      color: 'text-blue-600',
      reward: '+1 Streak Day'
    },
    {
      id: 'streak',
      name: 'Maintain Streak',
      description: `${streakData.currentStreak} day streak`,
      current: streakData.judgmentsToday > 0 ? 1 : 0,
      target: 1,
      icon: Flame,
      color: 'text-orange-600',
      reward: `${streakData.streakMultiplier}x Bonus`
    },
    {
      id: 'quality',
      name: 'Quality Focus',
      description: 'Detailed feedback',
      current: Math.min(streakData.judgmentsToday, 3), // Simplified
      target: 3,
      icon: TrendingUp,
      color: 'text-purple-600',
      reward: '+XP Boost'
    }
  ];

  const completedGoals = dailyGoals.filter(goal => goal.current >= goal.target).length;
  const totalGoals = dailyGoals.length;
  const overallProgress = (completedGoals / totalGoals) * 100;

  // Trigger celebration when goals are completed
  useEffect(() => {
    if (completedGoals === totalGoals && totalGoals > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [completedGoals, totalGoals]);

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakData.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className="font-semibold text-gray-900">{streakData.currentStreak} day streak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-sm font-bold text-indigo-600">
              {streakData.judgmentsToday}/5
            </div>
            <span className="text-xs text-gray-500">today</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (streakData.judgmentsToday / 5) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Streak Display */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 relative overflow-hidden">
        {showCelebration && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 animate-pulse" />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${streakData.currentStreak > 0 ? 'bg-orange-500' : 'bg-gray-400'}`}>
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {streakData.currentStreak} Day Streak
                </h3>
                <p className="text-sm text-gray-600">
                  {getMotivationalMessage()}
                </p>
              </div>
            </div>
            
            {streakData.streakMultiplier > 1 && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                {streakData.streakMultiplier}x Bonus!
              </div>
            )}
          </div>

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Daily Progress</span>
              <span className="text-sm font-bold text-orange-600">
                {completedGoals}/{totalGoals} Goals
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Individual Goals */}
      <div className="grid gap-3">
        {dailyGoals.map((goal) => {
          const progress = Math.min(100, (goal.current / goal.target) * 100);
          const isCompleted = goal.current >= goal.target;
          
          return (
            <div 
              key={goal.id} 
              className={`bg-white rounded-xl p-4 border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <goal.icon className={`h-5 w-5 ${isCompleted ? 'text-green-600' : goal.color}`} />
                  <div>
                    <h4 className={`font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                      {goal.name}
                    </h4>
                    <p className="text-xs text-gray-600">{goal.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="text-lg font-bold text-gray-900">
                      {goal.current}/{goal.target}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Reward: {goal.reward}
                </span>
                {isCompleted && (
                  <span className="text-xs font-bold text-green-600">
                    ✓ COMPLETED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      {completedGoals < totalGoals && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-5 w-5" />
            <span className="font-bold">Keep Going!</span>
          </div>
          <p className="text-sm text-indigo-100 mb-3">
            Complete {totalGoals - completedGoals} more {totalGoals - completedGoals === 1 ? 'goal' : 'goals'} to earn today's bonus
          </p>
          <button
            onClick={() => window.location.href = '/feed'}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Judging
          </button>
        </div>
      )}

      {/* Celebration Message */}
      {showCelebration && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center animate-bounce">
          <div className="text-2xl mb-2">🎉 All Goals Complete! 🎉</div>
          <div className="font-bold">
            Bonus XP Earned! Come back tomorrow for more!
          </div>
        </div>
      )}
    </div>
  );
}