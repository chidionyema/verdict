'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, Target, Medal, Crown, Flame, ArrowUp } from 'lucide-react';

interface UserStats {
  totalJudgments: number;
  totalSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  reputation: number;
  tier: 'rookie' | 'regular' | 'trusted' | 'expert' | 'elite';
}

interface BenchmarkData {
  category: string;
  userValue: number;
  percentile: number;
  averageValue: number;
  topPerformerValue: number;
  improvement: string;
  nextMilestone: number;
}

interface BenchmarkComparisonsProps {
  userStats: UserStats;
  className?: string;
}

export function BenchmarkComparisons({ userStats, className = '' }: BenchmarkComparisonsProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  const benchmarks: BenchmarkData[] = [
    {
      category: 'Judging Streak',
      userValue: userStats.currentStreak,
      percentile: Math.min(95, Math.max(5, (userStats.currentStreak / 30) * 100)),
      averageValue: 7,
      topPerformerValue: 45,
      improvement: userStats.currentStreak < 7 ? 'Judge daily to beat average' : 'Incredible streak! 🔥',
      nextMilestone: userStats.currentStreak < 7 ? 7 : userStats.currentStreak < 14 ? 14 : userStats.currentStreak < 30 ? 30 : 50
    },
    {
      category: 'Total Judgments',
      userValue: userStats.totalJudgments,
      percentile: Math.min(95, Math.max(5, (userStats.totalJudgments / 1000) * 100)),
      averageValue: 156,
      topPerformerValue: 2340,
      improvement: userStats.totalJudgments < 50 ? 'Judge more to rank up' : userStats.totalJudgments < 200 ? 'You\'re getting good!' : 'Judgment master! 👑',
      nextMilestone: userStats.totalJudgments < 50 ? 50 : userStats.totalJudgments < 100 ? 100 : userStats.totalJudgments < 250 ? 250 : 500
    },
    {
      category: 'Quality Score',
      userValue: userStats.reputation,
      percentile: Math.min(95, Math.max(5, (userStats.reputation / 100) * 100)),
      averageValue: 72,
      topPerformerValue: 96,
      improvement: userStats.reputation < 70 ? 'Focus on detailed feedback' : userStats.reputation < 85 ? 'High quality judge!' : 'Elite quality! 🌟',
      nextMilestone: userStats.reputation < 70 ? 70 : userStats.reputation < 80 ? 80 : userStats.reputation < 90 ? 90 : 95
    },
    {
      category: 'Community Impact',
      userValue: userStats.totalJudgments * (userStats.reputation / 100),
      percentile: Math.min(95, Math.max(5, (userStats.totalJudgments * userStats.reputation / 10000) * 100)),
      averageValue: 112,
      topPerformerValue: 2246,
      improvement: (userStats.totalJudgments * userStats.reputation / 100) < 100 ? 'Help more people' : 'Community champion! 🏆',
      nextMilestone: Math.ceil((userStats.totalJudgments * userStats.reputation / 100) / 100) * 100 + 100
    }
  ];

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const getTierInfo = (tier: string) => {
    const tiers: Record<string, { icon: string; name: string; color: string; next: string }> = {
      rookie: { icon: '🌱', name: 'Rookie', color: 'text-green-600', next: 'Regular' },
      regular: { icon: '⚡', name: 'Regular', color: 'text-blue-600', next: 'Trusted' },
      trusted: { icon: '🎯', name: 'Trusted', color: 'text-purple-600', next: 'Expert' },
      expert: { icon: '👑', name: 'Expert', color: 'text-yellow-600', next: 'Elite' },
      elite: { icon: '💎', name: 'Elite', color: 'text-pink-600', next: 'Legend' }
    };
    return tiers[tier] || tiers.rookie;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-pink-600';
    if (percentile >= 75) return 'text-purple-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const currentBenchmark = benchmarks[selectedBenchmark];
  const tierInfo = getTierInfo(userStats.tier);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Tier Display */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{tierInfo.icon}</div>
            <div>
              <h3 className={`text-xl font-bold ${tierInfo.color}`}>{tierInfo.name} Judge</h3>
              <p className="text-sm text-gray-600">Next: {tierInfo.next}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{userStats.currentStreak}</div>
            <div className="text-sm text-gray-600">day streak 🔥</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{userStats.totalJudgments}</div>
            <div className="text-xs text-gray-600">Judgments</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{userStats.totalSubmissions}</div>
            <div className="text-xs text-gray-600">Submissions</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{userStats.reputation}%</div>
            <div className="text-xs text-gray-600">Quality</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{userStats.longestStreak}</div>
            <div className="text-xs text-gray-600">Best Streak</div>
          </div>
        </div>
      </div>

      {/* Benchmark Selector */}
      <div className="grid grid-cols-4 gap-2">
        {benchmarks.map((benchmark, index) => (
          <button
            key={index}
            onClick={() => setSelectedBenchmark(index)}
            className={`p-3 rounded-xl text-sm font-medium transition-all ${
              selectedBenchmark === index
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {benchmark.category}
          </button>
        ))}
      </div>

      {/* Selected Benchmark Details */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900">{currentBenchmark.category}</h4>
          <div className={`text-2xl font-bold ${getPercentileColor(currentBenchmark.percentile)}`}>
            {currentBenchmark.percentile.toFixed(0)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Bottom 25%</span>
            <span>Average</span>
            <span>Top 10%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, currentBenchmark.percentile)}%` }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-yellow-500" />
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{currentBenchmark.userValue}</div>
            <div className="text-xs text-gray-600">Your Score</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-xl font-bold text-yellow-600">{currentBenchmark.averageValue}</div>
            <div className="text-xs text-gray-600">Average</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-xl font-bold text-pink-600">{currentBenchmark.topPerformerValue}</div>
            <div className="text-xs text-gray-600">Top 1%</div>
          </div>
        </div>

        {/* Improvement Suggestion */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Next Goal</span>
          </div>
          <p className="text-green-700 mb-2">{currentBenchmark.improvement}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600">
              {currentBenchmark.nextMilestone - currentBenchmark.userValue} to reach {currentBenchmark.nextMilestone}
            </span>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>

      {/* Addiction Hook - Daily Challenge */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-6 w-6 text-orange-600" />
          <div>
            <h4 className="font-bold text-orange-900">Daily Challenge</h4>
            <p className="text-sm text-orange-700">Keep your streak alive!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">5</div>
            <div className="text-xs text-gray-600">Judgments Left</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">+1</div>
            <div className="text-xs text-gray-600">Streak Bonus</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">+XP</div>
            <div className="text-xs text-gray-600">Quality Bonus</div>
          </div>
        </div>
      </div>
    </div>
  );
}