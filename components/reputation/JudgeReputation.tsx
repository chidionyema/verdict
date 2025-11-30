'use client';

import { useState, useEffect } from 'react';
import { Star, Award, TrendingUp, Target, Flame, Crown, Shield } from 'lucide-react';
import { creditManager, CREDIT_ECONOMY_CONFIG } from '@/lib/credits';
import type { Database } from '@/types/supabase';

type JudgeReputationData = Database['public']['Tables']['judge_reputation']['Row'];

interface JudgeReputationProps {
  userId?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const TIER_CONFIGS = {
  rookie: { 
    icon: Star, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100', 
    borderColor: 'border-gray-300',
    label: 'Rookie Judge',
    description: 'Getting started'
  },
  regular: { 
    icon: Award, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-100', 
    borderColor: 'border-blue-300',
    label: 'Regular Judge',
    description: 'Reliable contributor'
  },
  trusted: { 
    icon: Shield, 
    color: 'text-green-500', 
    bgColor: 'bg-green-100', 
    borderColor: 'border-green-300',
    label: 'Trusted Judge',
    description: 'High consensus rate'
  },
  expert: { 
    icon: Target, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-100', 
    borderColor: 'border-purple-300',
    label: 'Expert Judge',
    description: 'Top-tier accuracy'
  },
  elite: { 
    icon: Crown, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-100', 
    borderColor: 'border-yellow-300',
    label: 'Elite Judge',
    description: 'Legendary status'
  }
};

export function JudgeReputation({ userId, showDetails = false, compact = false }: JudgeReputationProps) {
  const [reputation, setReputation] = useState<JudgeReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchReputation(userId);
    }
  }, [userId]);

  async function fetchReputation(targetUserId: string) {
    try {
      const reputationData = await creditManager.getJudgeReputation(targetUserId);
      setReputation(reputationData);
    } catch (error) {
      console.error('Error fetching reputation:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="text-sm text-gray-500">
        No judging history yet
      </div>
    );
  }

  const tierConfig = TIER_CONFIGS[reputation.tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS.rookie;
  const Icon = tierConfig.icon;
  
  // Calculate progress to next tier
  const currentThreshold = CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS[reputation.tier as keyof typeof CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS];
  const nextTierKey = Object.keys(CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS).find((key, index, arr) => {
    const currentIndex = arr.indexOf(reputation.tier);
    return index === currentIndex + 1;
  }) as keyof typeof CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS;
  
  const nextThreshold = nextTierKey ? CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS[nextTierKey] : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 ${tierConfig.bgColor} rounded-full flex items-center justify-center border ${tierConfig.borderColor}`}>
          <Icon className={`h-3 w-3 ${tierConfig.color}`} />
        </div>
        <span className="text-sm font-medium">{tierConfig.label}</span>
        {reputation.current_streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-orange-600">{reputation.current_streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Tier Display */}
      <div className={`rounded-xl p-6 border-2 ${tierConfig.borderColor} ${tierConfig.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm`}>
              <Icon className={`h-6 w-6 ${tierConfig.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{tierConfig.label}</h3>
              <p className="text-sm text-gray-600">{tierConfig.description}</p>
            </div>
          </div>
          
          {reputation.is_verified && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Verified</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{reputation.total_judgments}</div>
            <div className="text-xs text-gray-500">Judgments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{reputation.consensus_rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Consensus</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{(reputation.helpfulness_score || 0).toFixed(1)}</div>
            <div className="text-xs text-gray-500">Helpful</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{reputation.current_streak}</span>
            </div>
            <div className="text-xs text-gray-500">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {showDetails && nextThreshold && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Progress to {nextTierKey}</h4>
            <span className="text-xs text-gray-500">
              {Math.max(0, nextThreshold.judgments - reputation.total_judgments)} more judgments needed
            </span>
          </div>
          
          {/* Judgments Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Judgments</span>
              <span>{reputation.total_judgments}/{nextThreshold.judgments}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (reputation.total_judgments / nextThreshold.judgments) * 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Consensus Progress */}
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-sm">
              <span>Consensus Rate</span>
              <span>{reputation.consensus_rate.toFixed(1)}%/{nextThreshold.consensus}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (reputation.consensus_rate / nextThreshold.consensus) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {showDetails && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Achievements</h4>
          <div className="space-y-2">
            {reputation.longest_streak >= 7 && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>🔥 {reputation.longest_streak}-day judging streak</span>
              </div>
            )}
            {reputation.consensus_rate >= 80 && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-green-500" />
                <span>🎯 High consensus judge ({reputation.consensus_rate.toFixed(1)}%)</span>
              </div>
            )}
            {reputation.total_judgments >= 100 && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-blue-500" />
                <span>⭐ Century judge (100+ judgments)</span>
              </div>
            )}
            {reputation.is_verified && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>✅ Verified judge</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}