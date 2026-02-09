'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Clock,
  Star,
  TrendingUp,
  Eye,
  EyeOff,
  Award,
  Shield,
  Crown,
  ArrowRight
} from 'lucide-react';
import { creditManager, CREDIT_ECONOMY_CONFIG } from '@/lib/credits';

interface ProgressiveFeedDashboardProps {
  user: any;
  judgeStats: {
    today: number;
    streak: number;
    totalJudgments: number;
  };
  currentIndex: number;
  totalItems: number;
  className?: string;
}

const TIER_CONFIGS = {
  rookie: { icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Rookie' },
  regular: { icon: Award, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Regular' },
  trusted: { icon: Shield, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Trusted' },
  expert: { icon: Target, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Expert' },
  elite: { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Elite' }
};

export function ProgressiveFeedDashboard({
  user,
  judgeStats,
  currentIndex,
  totalItems,
  className = ''
}: ProgressiveFeedDashboardProps) {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [tierInfo, setTierInfo] = useState<{
    tier: string;
    nextTier: string | null;
    judgmentsToNext: number;
    consensusRate: number;
  } | null>(null);

  const remainingItems = totalItems - currentIndex - 1;
  const progressPercent = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0;

  // Calculate session goals
  const sessionTarget = 5; // Target judgments per session
  const progressToTarget = Math.min((judgeStats.today / sessionTarget) * 100, 100);

  // Fetch tier info
  useEffect(() => {
    if (user?.id) {
      creditManager.getJudgeReputation(user.id).then((reputation) => {
        if (reputation) {
          const tierOrder = ['rookie', 'regular', 'trusted', 'expert', 'elite'];
          const currentIndex = tierOrder.indexOf(reputation.tier);
          const nextTierKey = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
          const nextThreshold = nextTierKey
            ? CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS[nextTierKey as keyof typeof CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS]
            : null;

          setTierInfo({
            tier: reputation.tier,
            nextTier: nextTierKey,
            judgmentsToNext: nextThreshold ? Math.max(0, nextThreshold.judgments - reputation.total_judgments) : 0,
            consensusRate: reputation.consensus_rate
          });
        }
      });
    }
  }, [user?.id, judgeStats.totalJudgments]);

  if (focusMode) {
    return (
      <div className={`bg-white ${className}`}>
        {/* Minimal focus mode header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-2 bg-indigo-600 rounded-full" style={{ width: `${progressPercent}%` }}></div>
              <span className="text-sm font-medium text-gray-700">
                {currentIndex + 1} of {totalItems}
              </span>
            </div>
            <button
              onClick={() => setFocusMode(false)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <Eye className="h-3 w-3" />
              <span>Show details</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Main header - always visible */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Judge Feed</h1>
            <p className="text-sm text-gray-500">Review submissions to earn credits</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <EyeOff className="h-3 w-3" />
              <span>Focus mode</span>
            </button>
          </div>
        </div>

        {/* Essential progress info */}
        <div className="space-y-3">
          {/* Session progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Session Progress</span>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {judgeStats.today}/{sessionTarget}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressToTarget}%` }}
            ></div>
          </div>

          {/* Queue progress */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{currentIndex + 1} of {totalItems} submissions</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {remainingItems} remaining
            </span>
          </div>
        </div>

        {/* Expandable detailed stats */}
        <div className="mt-3">
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 w-full justify-center py-1 hover:bg-gray-50 rounded"
          >
            <span>{showDetailedStats ? 'Hide details' : 'Show detailed stats'}</span>
            {showDetailedStats ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Detailed stats - progressively disclosed */}
      {showDetailedStats && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          {/* Tier Progression - Most important */}
          {tierInfo && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = TIER_CONFIGS[tierInfo.tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS.rookie;
                    const Icon = config.icon;
                    return (
                      <>
                        <div className={`w-7 h-7 ${config.bgColor} rounded-full flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <span className="font-semibold text-gray-900">{config.label} Judge</span>
                      </>
                    );
                  })()}
                </div>
                {tierInfo.nextTier && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>{tierInfo.judgmentsToNext} to</span>
                    {(() => {
                      const nextConfig = TIER_CONFIGS[tierInfo.nextTier as keyof typeof TIER_CONFIGS];
                      const NextIcon = nextConfig?.icon || Star;
                      return (
                        <div className="flex items-center gap-1">
                          <div className={`w-5 h-5 ${nextConfig?.bgColor || 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                            <NextIcon className={`h-3 w-3 ${nextConfig?.color || 'text-gray-500'}`} />
                          </div>
                          <span className="font-medium">{nextConfig?.label || 'Next'}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {tierInfo.nextTier && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, 100 - (tierInfo.judgmentsToNext / (tierInfo.judgmentsToNext + judgeStats.totalJudgments)) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500 text-center">
                    {tierInfo.consensusRate.toFixed(0)}% consensus rate
                  </p>
                </div>
              )}
              {!tierInfo.nextTier && (
                <p className="text-xs text-center text-yellow-600 font-medium mt-1">
                  Maximum tier achieved!
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-orange-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{judgeStats.streak}</div>
              <div className="text-xs text-gray-500">Day streak</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-3 w-3 text-yellow-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{judgeStats.totalJudgments}</div>
              <div className="text-xs text-gray-500">Total reviews</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {judgeStats.today > 0 ? Math.round((judgeStats.today / sessionTarget) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500">Goal progress</div>
            </div>
          </div>

          {/* Motivational message based on progress */}
          <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-center text-gray-600">
              {judgeStats.today === 0 && "Start judging to earn credits and level up your tier!"}
              {judgeStats.today > 0 && judgeStats.today < sessionTarget && `${sessionTarget - judgeStats.today} more to reach today's goal!`}
              {judgeStats.today >= sessionTarget && "Session goal achieved! Keep going to rank up faster."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}