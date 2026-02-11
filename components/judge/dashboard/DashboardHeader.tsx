'use client';

import Link from 'next/link';
import { DollarSign, Trophy, ToggleLeft, ToggleRight, Flame } from 'lucide-react';
import { RoleIndicator } from '@/components/ui/RoleIndicator';
import type { Profile } from '@/lib/database.types';
import type { JudgeStats, JudgeLevel, Achievement } from './types';

interface DashboardHeaderProps {
  profile: Profile;
  stats: JudgeStats;
  judgeLevel: JudgeLevel;
  achievements: Achievement[];
  toggling: boolean;
  onToggleJudge: () => void;
  onShowAchievements: () => void;
}

export function DashboardHeader({
  profile,
  stats,
  judgeLevel,
  achievements,
  toggling,
  onToggleJudge,
  onShowAchievements,
}: DashboardHeaderProps) {
  const LevelIcon = judgeLevel.icon;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${judgeLevel.color} p-3 text-white shadow-lg animate-pulse`}
            >
              <LevelIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Earn by Reviewing
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${judgeLevel.color} text-white text-sm font-semibold shadow-lg`}
                >
                  <LevelIcon className="h-4 w-4" />
                  <span>{judgeLevel.name}</span>
                  <span className="text-white/80">• Level {judgeLevel.level}</span>
                </span>
                {stats.streak_days > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-semibold shadow-lg animate-pulse">
                    <Flame className="h-4 w-4" />
                    {stats.streak_days} day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Level {judgeLevel.level} Progress</span>
              <span className="text-indigo-600 font-bold">
                {stats.next_level_progress}% to Level {judgeLevel.level + 1}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${judgeLevel.color} shadow-lg transition-all duration-1000 ease-out relative overflow-hidden`}
                style={{ width: `${stats.next_level_progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoleIndicator role="reviewer" className="mr-2" />

          <Link
            href="/judge/earnings"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <DollarSign className="h-5 w-5" />
            ${stats.available_for_payout.toFixed(2)}
          </Link>

          <button
            onClick={onShowAchievements}
            className="relative bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Trophy className="h-5 w-5 inline mr-2" />
            Achievements
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce">
              {achievements.filter((a) => !a.unlocked).length}
            </span>
          </button>

          <button
            onClick={onToggleJudge}
            disabled={toggling}
            className={`relative flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
              profile?.is_judge
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
            }`}
          >
            {profile?.is_judge ? (
              <>
                <ToggleRight className="h-5 w-5 mr-2" />
                Available to Judge
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 mr-2" />
                Not Available
              </>
            )}
            {profile?.is_judge && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
