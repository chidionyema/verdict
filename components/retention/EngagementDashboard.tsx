'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Flame,
  Trophy,
  Users,
  Gift,
  Target,
  Zap,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

import { StreakWidget } from './StreakSystem';
import { ProfileCompletion, JudgeTierProgress, WeeklyCreditsProgress } from './ProgressIndicators';
import { InviteFriendsCTA, CommunityStats, ActivityFeed, SocialProofBanner } from './SocialFeatures';
import { WinBackBanner } from './WinBackSystem';
import { AchievementPrompt, LowCreditsCTA } from './ReEngagementCTAs';

interface EngagementDashboardProps {
  userId: string;
  profile: {
    display_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
    credits?: number;
    bio?: string;
    location?: string;
  };
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalJudgments: number;
    consensusRate: number;
    creditsEarnedThisWeek: number;
    verdictsThisWeek: number;
    judgeTier: 'rookie' | 'judge' | 'magistrate' | 'supreme_court';
    daysSinceLastActivity: number;
  };
  communityStats?: {
    totalUsers: number;
    activeToday: number;
    verdictsThisWeek: number;
  };
  recentActivity?: {
    id: string;
    type: 'verdict' | 'signup' | 'milestone' | 'achievement';
    category?: string;
    timeAgo: string;
    anonymizedUser: string;
  }[];
  nextAchievement?: {
    name: string;
    progress: number;
    total: number;
    reward: string;
  };
  compact?: boolean;
}

export function EngagementDashboard({
  userId,
  profile,
  stats,
  communityStats,
  recentActivity,
  nextAchievement,
  compact = false
}: EngagementDashboardProps) {
  const [showFullDashboard, setShowFullDashboard] = useState(!compact);

  // Calculate engagement score (0-100)
  const calculateEngagementScore = () => {
    let score = 0;

    // Streak contribution (max 30 points)
    score += Math.min(stats.currentStreak * 3, 30);

    // Activity contribution (max 25 points)
    if (stats.daysSinceLastActivity === 0) score += 25;
    else if (stats.daysSinceLastActivity <= 1) score += 20;
    else if (stats.daysSinceLastActivity <= 3) score += 15;
    else if (stats.daysSinceLastActivity <= 7) score += 10;

    // Tier contribution (max 20 points)
    const tierPoints = {
      rookie: 5,
      judge: 10,
      magistrate: 15,
      supreme_court: 20,
    };
    score += tierPoints[stats.judgeTier];

    // Weekly activity (max 15 points)
    score += Math.min(stats.verdictsThisWeek * 1.5, 15);

    // Profile completion (max 10 points)
    const profileFields = [
      profile.display_name,
      profile.avatar_url,
      profile.email_verified,
      profile.bio,
    ];
    const completedFields = profileFields.filter(Boolean).length;
    score += (completedFields / profileFields.length) * 10;

    return Math.round(Math.min(score, 100));
  };

  const engagementScore = calculateEngagementScore();

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: 'Power User', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (score >= 60) return { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 40) return { label: 'Engaged', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 20) return { label: 'Getting Started', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const engagementLevel = getEngagementLevel(engagementScore);

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Win-back banner if needed */}
        {stats.daysSinceLastActivity >= 7 && (
          <WinBackBanner
            userId={userId}
            daysSinceActivity={stats.daysSinceLastActivity}
          />
        )}

        {/* Compact engagement score */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">Your Engagement</span>
            </div>
            <Badge className={`${engagementLevel.bg} ${engagementLevel.color}`}>
              {engagementLevel.label}
            </Badge>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${engagementScore}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{engagementScore}/100</span>
            <button
              onClick={() => setShowFullDashboard(true)}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              See details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{stats.currentStreak}</div>
            <div className="text-xs text-gray-500">Day streak</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Target className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{stats.verdictsThisWeek}</div>
            <div className="text-xs text-gray-500">This week</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <Zap className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{stats.creditsEarnedThisWeek.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Credits</div>
          </div>
        </div>

        {/* Achievement progress if close */}
        {nextAchievement && nextAchievement.progress >= nextAchievement.total * 0.8 && (
          <AchievementPrompt
            achievementName={nextAchievement.name}
            progress={nextAchievement.progress}
            total={nextAchievement.total}
            reward={nextAchievement.reward}
            actionLabel="Complete"
            actionHref="/judge"
          />
        )}

        {/* Low credits warning */}
        {profile.credits !== undefined && profile.credits < 1 && (
          <LowCreditsCTA currentCredits={profile.credits} />
        )}
      </div>
    );
  }

  // Full dashboard view
  return (
    <div className="space-y-6">
      {/* Win-back banner if needed */}
      {stats.daysSinceLastActivity >= 7 && (
        <WinBackBanner
          userId={userId}
          daysSinceActivity={stats.daysSinceLastActivity}
        />
      )}

      {/* Engagement Score Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Engagement Score</h2>
            <p className="text-indigo-100">Based on your activity and progress</p>
          </div>
          <Badge className="bg-white/20 text-white text-lg px-4 py-1">
            {engagementScore}/100
          </Badge>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${engagementScore}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-indigo-100 text-sm">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalJudgments}</div>
            <div className="text-indigo-100 text-sm">Total Verdicts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.consensusRate}%</div>
            <div className="text-indigo-100 text-sm">Consensus</div>
          </div>
          <div className="text-center">
            <Badge className={`${engagementLevel.bg} ${engagementLevel.color}`}>
              {engagementLevel.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Low credits warning */}
      {profile.credits !== undefined && profile.credits < 1 && (
        <LowCreditsCTA currentCredits={profile.credits} />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Streak Widget */}
          <StreakWidget
            userId={userId}
            currentStreak={stats.currentStreak}
            onCheckIn={() => window.location.href = '/judge'}
          />

          {/* Judge Tier Progress */}
          <JudgeTierProgress
            currentTier={stats.judgeTier}
            totalJudgments={stats.totalJudgments}
            consensusRate={stats.consensusRate}
          />

          {/* Weekly Credits Progress */}
          <WeeklyCreditsProgress
            creditsEarned={stats.creditsEarnedThisWeek}
            weeklyGoal={10}
            verdictCount={stats.verdictsThisWeek}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <ProfileCompletion
            userId={userId}
            profile={profile}
          />

          {/* Community Stats */}
          {communityStats && (
            <CommunityStats
              totalUsers={communityStats.totalUsers}
              activeToday={communityStats.activeToday}
              verdictsThisWeek={communityStats.verdictsThisWeek}
            />
          )}

          {/* Invite Friends */}
          <InviteFriendsCTA
            userId={userId}
            compact
          />
        </div>
      </div>

      {/* Achievement progress if close */}
      {nextAchievement && nextAchievement.progress >= nextAchievement.total * 0.8 && (
        <AchievementPrompt
          achievementName={nextAchievement.name}
          progress={nextAchievement.progress}
          total={nextAchievement.total}
          reward={nextAchievement.reward}
          actionLabel="Complete Now"
          actionHref="/judge"
        />
      )}

      {/* Activity Feed */}
      {recentActivity && recentActivity.length > 0 && (
        <ActivityFeed activities={recentActivity} maxItems={5} />
      )}

      {/* Social Proof */}
      {communityStats && (
        <SocialProofBanner
          recentSignups={Math.floor(communityStats.activeToday * 0.1)}
          timeframe="last hour"
        />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/judge">
          <div className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Start Judging</h4>
                <p className="text-sm text-gray-500">Earn credits now</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
            </div>
          </div>
        </Link>

        <Link href="/account">
          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Settings</h4>
                <p className="text-sm text-gray-500">Notifications & more</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Compact sidebar version
export function EngagementSidebar({ userId, stats }: {
  userId: string;
  stats: {
    currentStreak: number;
    verdictsThisWeek: number;
    creditsEarnedThisWeek: number;
  };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-indigo-600" />
        Your Activity
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600">Streak</span>
          </div>
          <span className="font-semibold text-gray-900">{stats.currentStreak} days</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">This week</span>
          </div>
          <span className="font-semibold text-gray-900">{stats.verdictsThisWeek} verdicts</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Earned</span>
          </div>
          <span className="font-semibold text-gray-900">{stats.creditsEarnedThisWeek.toFixed(1)} credits</span>
        </div>
      </div>

      <Link href="/judge">
        <TouchButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          <Target className="h-4 w-4 mr-2" />
          Judge Now
        </TouchButton>
      </Link>
    </div>
  );
}
