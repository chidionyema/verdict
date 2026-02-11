import { ReactNode } from 'react';
import {
  Crown,
  Trophy,
  Medal,
  Star,
  Sparkles,
  Award,
  CheckCircle2,
  Timer,
  Flame,
  Target,
} from 'lucide-react';
import { TIER_CONFIGURATIONS, getTierConfig } from '@/lib/pricing/dynamic-pricing';
import type { JudgeStats, JudgeLevel, Achievement } from './types';

export const DEFAULT_STATS: JudgeStats = {
  verdicts_given: 0,
  total_earnings: 0,
  available_for_payout: 0,
  average_quality_score: null,
  recent_verdicts: 0,
  response_time_avg: 0,
  weekly_earnings: 0,
  completion_rate: 0,
  streak_days: 0,
  next_level_progress: 0,
  daily_earnings: 0,
  monthly_earnings: 0,
  best_category: 'appearance',
  verdicts_today: 0,
  earnings_trend: 'up',
};

export function getJudgeEarningForTier(tier?: string): string {
  const tierKey = tier === 'pro' ? 'expert' : (tier || 'community');
  try {
    const config = getTierConfig(tierKey);
    return (config.judge_payout_cents / 100).toFixed(2);
  } catch {
    return (TIER_CONFIGURATIONS.community.judge_payout_cents / 100).toFixed(2);
  }
}

export function getJudgeLevel(stats: JudgeStats): JudgeLevel {
  const verdicts = stats.verdicts_given || 0;
  const quality = stats.average_quality_score || 0;

  if (verdicts >= 500 && quality >= 9) {
    return { name: 'Master Judge', level: 5, icon: Crown, color: 'from-yellow-500 to-amber-500' };
  }
  if (verdicts >= 200 && quality >= 8.5) {
    return { name: 'Expert Judge', level: 4, icon: Trophy, color: 'from-purple-500 to-violet-500' };
  }
  if (verdicts >= 100 && quality >= 8.5) {
    return { name: 'Trusted Judge', level: 3, icon: Medal, color: 'from-indigo-500 to-blue-500' };
  }
  if (verdicts >= 30 && quality >= 8) {
    return { name: 'Rising Judge', level: 2, icon: Star, color: 'from-green-500 to-emerald-500' };
  }
  if (verdicts >= 5) {
    return { name: 'Getting Started', level: 1, icon: Sparkles, color: 'from-gray-500 to-slate-500' };
  }
  return { name: 'New Judge', level: 0, icon: Award, color: 'from-gray-400 to-gray-500' };
}

export function getAchievements(stats: JudgeStats): Achievement[] {
  return [
    {
      id: 'first_verdict',
      title: 'First Verdict',
      description: 'Submit your first verdict',
      icon: CheckCircle2,
      progress: Math.min(stats.verdicts_given, 1),
      maxProgress: 1,
      unlocked: stats.verdicts_given >= 1,
      reward: '$0.50 bonus',
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Respond in under 5 minutes',
      icon: Timer,
      progress: stats.response_time_avg && stats.response_time_avg < 5 ? 1 : 0,
      maxProgress: 1,
      unlocked: stats.response_time_avg !== null && stats.response_time_avg < 5,
      reward: 'Speed Bonus Unlocked',
    },
    {
      id: 'week_streak',
      title: '7-Day Streak',
      description: 'Judge every day for a week',
      icon: Flame,
      progress: Math.min(stats.streak_days, 7),
      maxProgress: 7,
      unlocked: stats.streak_days >= 7,
      reward: '$5.00 bonus',
    },
    {
      id: 'quality_champion',
      title: 'Quality Champion',
      description: 'Maintain 9.0+ quality score',
      icon: Trophy,
      progress: stats.average_quality_score && stats.average_quality_score >= 9 ? 1 : 0,
      maxProgress: 1,
      unlocked: stats.average_quality_score !== null && stats.average_quality_score >= 9,
      reward: 'Premium Requests',
    },
    {
      id: 'century',
      title: 'Century',
      description: 'Complete 100 verdicts',
      icon: Target,
      progress: Math.min(stats.verdicts_given, 100),
      maxProgress: 100,
      unlocked: stats.verdicts_given >= 100,
      reward: '$10.00 bonus',
    },
  ];
}

export const CATEGORY_CONFIGS = {
  appearance: { color: 'from-pink-500 to-rose-500' },
  profile: { color: 'from-red-500 to-pink-500' },
  writing: { color: 'from-blue-500 to-cyan-500' },
  decision: { color: 'from-green-500 to-emerald-500' },
} as const;
