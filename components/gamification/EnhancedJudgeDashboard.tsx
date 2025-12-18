'use client';

import { useState, useEffect } from 'react';
import { Crown, Trophy, Target, TrendingUp, DollarSign, Award, Flame, Star, Clock, Heart, Zap } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { JUDGE_TIER_SYSTEM, type JudgeTier, GamificationManager } from '@/lib/gamification';

interface JudgeStats {
  tier: JudgeTier;
  totalJudgments: number;
  consensusRate: number;
  creditsEarned: number;
  helpfulnessRate: number;
  avgResponseTime: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
}

interface TierProgressProps {
  currentTier: JudgeTier;
  stats: JudgeStats;
  onPayoutRequest?: () => void;
}

export function EnhancedJudgeDashboard({ currentTier, stats, onPayoutRequest }: TierProgressProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const gamification = new GamificationManager();
  
  const tierInfo = JUDGE_TIER_SYSTEM.TIERS[currentTier];
  const nextTierInfo = gamification.getNextTier(currentTier);
  const progress = gamification.calculateProgressToNextTier({
    total_judgments: stats.totalJudgments,
    consensus_rate: stats.consensusRate,
  } as any);

  const unlockedAchievements = Object.entries(JUDGE_TIER_SYSTEM.ACHIEVEMENTS)
    .filter(([key]) => stats.achievements.includes(key))
    .map(([key, achievement]) => ({ key, ...achievement }));

  const availableAchievements = Object.entries(JUDGE_TIER_SYSTEM.ACHIEVEMENTS)
    .filter(([key]) => !stats.achievements.includes(key))
    .map(([key, achievement]) => ({ key, ...achievement }));

  return (
    <div className="space-y-6">
      {/* Tier Status Card */}
      <div className="bg-white rounded-3xl shadow-xl border p-8 relative overflow-hidden">
        {/* Tier Badge */}
        <div className="absolute top-6 right-6">
          <Badge className={`${tierInfo.badgeColor} px-4 py-2 text-lg font-bold`}>
            {tierInfo.icon} {tierInfo.name}
          </Badge>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Judge Tier Status</h2>
          <p className="text-gray-600">Your current rank and progression in the judge hierarchy</p>
        </div>

        {/* Current Tier Benefits */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Current Tier Benefits
          </h3>
          <ul className="space-y-2">
            {tierInfo.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress to Next Tier */}
        {nextTierInfo && progress.nextTier && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Progress to {JUDGE_TIER_SYSTEM.TIERS[progress.nextTier].name}</h3>
              <span className="text-sm text-gray-600">
                {JUDGE_TIER_SYSTEM.TIERS[progress.nextTier].icon}
              </span>
            </div>
            
            {/* Judgments Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Judgments: {stats.totalJudgments} / {JUDGE_TIER_SYSTEM.TIERS[progress.nextTier].requirements.judgments}</span>
                <span>{progress.judgmentProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${progress.judgmentProgress}%` }}
                />
              </div>
            </div>

            {/* Consensus Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consensus Rate: {stats.consensusRate}% / {JUDGE_TIER_SYSTEM.TIERS[progress.nextTier].requirements.consensus}%</span>
                <span>{progress.consensusProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${progress.consensusProgress}%` }}
                />
              </div>
            </div>
            
            {(progress.judgmentsNeeded > 0 || progress.consensusNeeded > 0) && (
              <div className="text-sm text-gray-600 bg-indigo-50 p-4 rounded-xl">
                <strong>To reach {JUDGE_TIER_SYSTEM.TIERS[progress.nextTier].name}:</strong>
                <ul className="mt-2 space-y-1">
                  {progress.judgmentsNeeded > 0 && (
                    <li>• Complete {progress.judgmentsNeeded} more judgments</li>
                  )}
                  {progress.consensusNeeded > 0 && (
                    <li>• Improve consensus rate by {progress.consensusNeeded.toFixed(1)}%</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* At Highest Tier */}
        {!nextTierInfo && (
          <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200">
            <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-yellow-900 mb-2">Maximum Tier Achieved!</h3>
            <p className="text-yellow-800">You've reached the highest judge tier. Continue judging to maintain your status and earn premium rewards.</p>
          </div>
        )}

        {/* Cash Payout Section */}
        {tierInfo.cashoutEnabled && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cash Payouts Available
                </h4>
                <p className="text-sm text-green-700">
                  Convert your credits to cash • ${JUDGE_TIER_SYSTEM.PAYOUT_RATES[currentTier as 'magistrate' | 'supreme_court']?.creditToCash || 0.75} per credit
                </p>
              </div>
              <TouchButton
                onClick={() => setShowPayoutModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Request Payout
              </TouchButton>
            </div>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Target}
          label="Total Judgments"
          value={stats.totalJudgments}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={TrendingUp}
          label="Consensus Rate"
          value={`${stats.consensusRate}%`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard 
          icon={Clock}
          label="Avg Response"
          value={`${stats.avgResponseTime}min`}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard 
          icon={Heart}
          label="Helpfulness"
          value={`${stats.helpfulnessRate}%`}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-3xl shadow-xl border p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Achievements
          </h3>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showAchievements ? 'Show Less' : 'View All'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Unlocked Achievements */}
          {unlockedAchievements.slice(0, showAchievements ? unlockedAchievements.length : 6).map((achievement) => (
            <AchievementCard
              key={achievement.key}
              achievement={achievement}
              unlocked={true}
            />
          ))}
          
          {/* Available Achievements (if showing all) */}
          {showAchievements && availableAchievements.slice(0, 3).map((achievement) => (
            <AchievementCard
              key={achievement.key}
              achievement={achievement}
              unlocked={false}
            />
          ))}
        </div>
      </div>

      {/* Streak Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-full p-4">
            <Flame className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {stats.currentStreak > 0 ? `${stats.currentStreak} Day Streak!` : 'Start Your Streak'}
            </h3>
            <p className="text-orange-100">
              {stats.currentStreak > 0 
                ? `Your longest streak: ${stats.longestStreak} days`
                : 'Judge daily to build your streak and earn bonus credits'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6">
      <div className={`${bgColor} rounded-full p-3 w-fit mb-4`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function AchievementCard({ achievement, unlocked }: {
  achievement: { key: string; name: string; description: string; icon: string; reward: string };
  unlocked: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      unlocked 
        ? 'bg-yellow-50 border-yellow-200 shadow-lg'
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="text-center">
        <div className="text-2xl mb-2">{achievement.icon}</div>
        <h4 className="font-bold text-gray-900 mb-1">{achievement.name}</h4>
        <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
        <Badge className={`text-xs ${unlocked ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
          {achievement.reward}
        </Badge>
      </div>
    </div>
  );
}