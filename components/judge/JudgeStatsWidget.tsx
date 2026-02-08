'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Star,
  TrendingUp,
  MessageSquare,
  Flame,
  Award,
  ChevronRight,
  Clock
} from 'lucide-react';

interface JudgeStats {
  totalEarnings: number;
  pendingEarnings: number;
  weeklyEarnings: number;
  totalVerdicts: number;
  weeklyVerdicts: number;
  averageRating: number;
  currentStreak: number;
  longestStreak: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  weeklyGoal: number;
  weeklyProgress: number;
}

interface JudgeStatsWidgetProps {
  judgeId: string;
  className?: string;
  compact?: boolean;
}

export function JudgeStatsWidget({
  judgeId,
  className = '',
  compact = false
}: JudgeStatsWidgetProps) {
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [judgeId]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/judge/stats?judgeId=${judgeId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Use mock data for display purposes
        setStats({
          totalEarnings: 0,
          pendingEarnings: 0,
          weeklyEarnings: 0,
          totalVerdicts: 0,
          weeklyVerdicts: 0,
          averageRating: 0,
          currentStreak: 0,
          longestStreak: 0,
          tier: 'bronze',
          weeklyGoal: 10,
          weeklyProgress: 0,
        });
      }
    } catch (error) {
      console.error('Error loading judge stats:', error);
      // Set default stats on error
      setStats({
        totalEarnings: 0,
        pendingEarnings: 0,
        weeklyEarnings: 0,
        totalVerdicts: 0,
        weeklyVerdicts: 0,
        averageRating: 0,
        currentStreak: 0,
        longestStreak: 0,
        tier: 'bronze',
        weeklyGoal: 10,
        weeklyProgress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const tierColors = {
    bronze: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    silver: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    gold: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    platinum: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const tierStyle = tierColors[stats.tier];
  const goalProgress = stats.weeklyGoal > 0 ? (stats.weeklyProgress / stats.weeklyGoal) * 100 : 0;

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-white/70 mb-0.5">This Week</p>
              <p className="text-2xl font-bold">${stats.weeklyEarnings.toFixed(2)}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-xs text-white/70 mb-0.5">Verdicts</p>
              <p className="text-2xl font-bold">{stats.weeklyVerdicts}</p>
            </div>
            {stats.currentStreak > 0 && (
              <>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="text-lg font-bold">{stats.currentStreak}</span>
                  <span className="text-xs text-white/70">day streak</span>
                </div>
              </>
            )}
          </div>
          <Link
            href="/judge/performance"
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition"
          >
            View Stats
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with tier badge */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)} Judge
              </span>
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{stats.currentStreak} day streak</span>
              </div>
            )}
          </div>
          <Link
            href="/judge/performance"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Earnings */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-800">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-green-600">Total Earnings</p>
            {stats.pendingEarnings > 0 && (
              <p className="text-xs text-green-500 mt-1">+${stats.pendingEarnings.toFixed(2)} pending</p>
            )}
          </div>

          {/* Weekly Earnings */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-800">${stats.weeklyEarnings.toFixed(2)}</p>
            <p className="text-xs text-blue-600">This Week</p>
          </div>

          {/* Total Verdicts */}
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <MessageSquare className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-800">{stats.totalVerdicts}</p>
            <p className="text-xs text-purple-600">Total Verdicts</p>
            <p className="text-xs text-purple-500 mt-1">+{stats.weeklyVerdicts} this week</p>
          </div>

          {/* Rating */}
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Star className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-800">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
            </p>
            <p className="text-xs text-yellow-600">Avg Rating</p>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        {stats.weeklyGoal > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
              </div>
              <span className="text-sm text-gray-600">
                {stats.weeklyProgress} / {stats.weeklyGoal} verdicts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
            {goalProgress >= 100 && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Goal achieved! Bonus unlocked.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function JudgeQuickStats({ judgeId }: { judgeId: string }) {
  const [stats, setStats] = useState<{ weeklyEarnings: number; weeklyVerdicts: number; streak: number } | null>(null);

  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        const response = await fetch(`/api/judge/stats?judgeId=${judgeId}&quick=true`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            weeklyEarnings: data.weeklyEarnings || 0,
            weeklyVerdicts: data.weeklyVerdicts || 0,
            streak: data.currentStreak || 0,
          });
        }
      } catch (error) {
        console.error('Error loading quick stats:', error);
      }
    };
    loadQuickStats();
  }, [judgeId]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1 text-green-600">
        <DollarSign className="h-4 w-4" />
        ${stats.weeklyEarnings.toFixed(2)}
      </span>
      <span className="flex items-center gap-1 text-purple-600">
        <MessageSquare className="h-4 w-4" />
        {stats.weeklyVerdicts}
      </span>
      {stats.streak > 0 && (
        <span className="flex items-center gap-1 text-orange-600">
          <Flame className="h-4 w-4" />
          {stats.streak}
        </span>
      )}
    </div>
  );
}
