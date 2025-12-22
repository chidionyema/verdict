import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type JudgeReputation = Database['public']['Tables']['judge_reputation']['Row'];

// Enhanced tier system matching war room feedback
export const JUDGE_TIER_SYSTEM = {
  TIERS: {
    rookie: {
      name: 'Rookie Judge',
      icon: '🥉',
      color: 'from-gray-500 to-slate-500',
      requirements: { judgments: 0, consensus: 0 },
      benefits: [
        'Basic credit earning (1 point per judgment)',
        'Access to public feed',
        'Standard response time'
      ],
      creditMultiplier: 1.0,
      cashoutEnabled: false,
      badgeColor: 'bg-gray-100 text-gray-800',
    },
    judge: {
      name: 'Judge',
      icon: '⚖️',
      color: 'from-blue-500 to-indigo-500',
      requirements: { judgments: 25, consensus: 55 },
      benefits: [
        '10% credit bonus (1.1 points per judgment)',
        'Priority in relevant categories',
        'Basic streak bonuses'
      ],
      creditMultiplier: 1.1,
      cashoutEnabled: false,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    magistrate: {
      name: 'Magistrate',
      icon: '👨‍⚖️',
      color: 'from-purple-500 to-indigo-600',
      requirements: { judgments: 100, consensus: 70 },
      benefits: [
        '25% credit bonus (0.42 per judgment)',
        'Cash payout option available',
        'Featured as expert reviewer',
        'Access to premium submissions'
      ],
      creditMultiplier: 1.25,
      cashoutEnabled: true,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    supreme_court: {
      name: 'Supreme Court',
      icon: '👩‍⚖️',
      color: 'from-yellow-500 to-amber-500',
      requirements: { judgments: 500, consensus: 85 },
      benefits: [
        '50% credit bonus (0.51 per judgment)',
        'Premium cash payout rates',
        'Influence platform policies',
        'VIP reviewer status',
        'Early access to new features'
      ],
      creditMultiplier: 1.5,
      cashoutEnabled: true,
      badgeColor: 'bg-yellow-100 text-yellow-800',
    },
  },
  
  ACHIEVEMENTS: {
    first_judgment: {
      name: 'First Steps',
      description: 'Completed your first judgment',
      icon: '🎯',
      reward: '+0.5 credits',
      unlockCondition: (stats: any) => stats.total_judgments >= 1,
    },
    streak_week: {
      name: 'Week Warrior',
      description: '7-day judging streak',
      icon: '🔥',
      reward: '+2 credits',
      unlockCondition: (stats: any) => stats.longest_streak >= 7,
    },
    quality_master: {
      name: 'Quality Master',
      description: 'Maintain 90%+ consensus rate',
      icon: '⭐',
      reward: '+3 credits',
      unlockCondition: (stats: any) => stats.consensus_rate >= 90 && stats.total_judgments >= 50,
    },
    speed_demon: {
      name: 'Speed Demon',
      description: 'Average response time under 5 minutes',
      icon: '⚡',
      reward: '+2 credits',
      unlockCondition: (stats: any) => stats.avg_response_time <= 5 && stats.total_judgments >= 20,
    },
    helpful_hero: {
      name: 'Helpful Hero',
      description: '95% of reviews marked as helpful',
      icon: '❤️',
      reward: '+3 credits',
      unlockCondition: (stats: any) => stats.helpfulness_rate >= 95 && stats.total_judgments >= 30,
    },
    magistrate_promotion: {
      name: 'Magistrate Promotion',
      description: 'Reached Magistrate tier - cash payouts unlocked!',
      icon: '💰',
      reward: 'Cash payout access',
      unlockCondition: (stats: any) => stats.tier === 'magistrate' || stats.tier === 'supreme_court',
    },
    supreme_justice: {
      name: 'Supreme Justice',
      description: 'Reached the highest tier',
      icon: '👑',
      reward: 'VIP status + $10 bonus',
      unlockCondition: (stats: any) => stats.tier === 'supreme_court',
    },
  },

  PAYOUT_RATES: {
    magistrate: {
      creditToCash: 0.75, // $0.75 per credit
      minimumPayout: 10, // 10 credits minimum ($7.50)
      processingFee: 0.10, // 10% processing fee
    },
    supreme_court: {
      creditToCash: 1.00, // $1.00 per credit
      minimumPayout: 5, // 5 credits minimum ($5.00)
      processingFee: 0.05, // 5% processing fee
    },
  },
} as const;

export type JudgeTier = keyof typeof JUDGE_TIER_SYSTEM.TIERS;

export class GamificationManager {
  private supabase = createClient();

  determineJudgeTier(reputation: JudgeReputation): JudgeTier {
    const { total_judgments, consensus_rate } = reputation;
    const tiers = JUDGE_TIER_SYSTEM.TIERS;
    
    // Check from highest to lowest tier
    if (total_judgments >= tiers.supreme_court.requirements.judgments &&
        consensus_rate >= tiers.supreme_court.requirements.consensus) {
      return 'supreme_court';
    }
    
    if (total_judgments >= tiers.magistrate.requirements.judgments &&
        consensus_rate >= tiers.magistrate.requirements.consensus) {
      return 'magistrate';
    }
    
    if (total_judgments >= tiers.judge.requirements.judgments &&
        consensus_rate >= tiers.judge.requirements.consensus) {
      return 'judge';
    }
    
    return 'rookie';
  }

  getTierInfo(tier: JudgeTier) {
    return JUDGE_TIER_SYSTEM.TIERS[tier];
  }

  getNextTier(currentTier: JudgeTier): JudgeTier | null {
    const tierOrder: JudgeTier[] = ['rookie', 'judge', 'magistrate', 'supreme_court'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1];
    }
    
    return null; // Already at highest tier
  }

  calculateProgressToNextTier(reputation: JudgeReputation): {
    nextTier: JudgeTier | null;
    judgmentProgress: number;
    consensusProgress: number;
    judgmentsNeeded: number;
    consensusNeeded: number;
  } {
    const currentTier = this.determineJudgeTier(reputation);
    const nextTier = this.getNextTier(currentTier);
    
    if (!nextTier) {
      return {
        nextTier: null,
        judgmentProgress: 100,
        consensusProgress: 100,
        judgmentsNeeded: 0,
        consensusNeeded: 0,
      };
    }

    const nextTierReq = JUDGE_TIER_SYSTEM.TIERS[nextTier].requirements;
    const judgmentProgress = Math.min(100, (reputation.total_judgments / nextTierReq.judgments) * 100);
    const consensusProgress = Math.min(100, (reputation.consensus_rate / nextTierReq.consensus) * 100);
    
    return {
      nextTier,
      judgmentProgress,
      consensusProgress,
      judgmentsNeeded: Math.max(0, nextTierReq.judgments - reputation.total_judgments),
      consensusNeeded: Math.max(0, nextTierReq.consensus - reputation.consensus_rate),
    };
  }

  async checkAchievements(userId: string, stats: any): Promise<string[]> {
    const newAchievements: string[] = [];
    
    // Get existing achievements
    const { data: existingAchievements } = await this.supabase
      .from('judge_achievements')
      .select('achievement_key')
      .eq('user_id', userId);

    const unlockedKeys = existingAchievements?.map(a => (a as any).achievement_key) || [];

    // Check each achievement
    for (const [key, achievement] of Object.entries(JUDGE_TIER_SYSTEM.ACHIEVEMENTS)) {
      if (!unlockedKeys.includes(key) && achievement.unlockCondition(stats)) {
        newAchievements.push(key);
        
        // Insert new achievement
        try {
          await (this.supabase as any)
            .from('judge_achievements')
            .insert({
              user_id: userId,
              achievement_key: key,
              unlocked_at: new Date().toISOString(),
            });
        } catch (error) {
          console.log('judge_achievements table not found, skipping');
        }
      }
    }

    return newAchievements;
  }

  async calculatePayout(userId: string, credits: number): Promise<{
    cashAmount: number;
    processingFee: number;
    netAmount: number;
    tier: JudgeTier;
    eligible: boolean;
    error?: string;
  }> {
    // Get user's tier
    const { data: reputation } = await this.supabase
      .from('judge_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!reputation) {
      return {
        cashAmount: 0,
        processingFee: 0,
        netAmount: 0,
        tier: 'rookie',
        eligible: false,
        error: 'No reputation data found',
      };
    }

    const tier = this.determineJudgeTier(reputation);
    const tierInfo = JUDGE_TIER_SYSTEM.TIERS[tier];

    if (!tierInfo.cashoutEnabled) {
      return {
        cashAmount: 0,
        processingFee: 0,
        netAmount: 0,
        tier,
        eligible: false,
        error: `Cash payouts require ${JUDGE_TIER_SYSTEM.TIERS.magistrate.name} tier or higher`,
      };
    }

    const payoutRates = JUDGE_TIER_SYSTEM.PAYOUT_RATES[tier as 'magistrate' | 'supreme_court'];
    
    if (credits < payoutRates.minimumPayout) {
      return {
        cashAmount: 0,
        processingFee: 0,
        netAmount: 0,
        tier,
        eligible: false,
        error: `Minimum payout is ${payoutRates.minimumPayout} credits`,
      };
    }

    const cashAmount = credits * payoutRates.creditToCash;
    const processingFee = cashAmount * payoutRates.processingFee;
    const netAmount = cashAmount - processingFee;

    return {
      cashAmount,
      processingFee,
      netAmount,
      tier,
      eligible: true,
    };
  }

  async requestPayout(userId: string, credits: number): Promise<{
    success: boolean;
    payoutId?: string;
    error?: string;
  }> {
    const payoutCalculation = await this.calculatePayout(userId, credits);
    
    if (!payoutCalculation.eligible) {
      return {
        success: false,
        error: payoutCalculation.error,
      };
    }

    // Check user has sufficient credits
    const { data: userCredits } = await this.supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!userCredits || (userCredits as any).balance < credits) {
      return {
        success: false,
        error: 'Insufficient credits',
      };
    }

    // Create payout request
    let payout, error;
    try {
      const result = await (this.supabase as any)
        .from('payout_requests')
        .insert({
          user_id: userId,
          credits_amount: credits,
          cash_amount: payoutCalculation.cashAmount,
          processing_fee: payoutCalculation.processingFee,
          net_amount: payoutCalculation.netAmount,
          tier: payoutCalculation.tier,
          status: 'pending',
        })
        .select('id')
        .single();
      payout = result.data;
      error = result.error;
    } catch (err) {
      error = err;
    }

    if (error) {
      return {
        success: false,
        error: 'Failed to create payout request',
      };
    }

    // EMERGENCY FIX: Use safe credit deduction instead of legacy spend_credits
    try {
      const { safeDeductCredits } = require('./credit-guard');
      
      const requestId = `payout_${(payout as any)?.id || Date.now()}_${userId}`;
      const result = await safeDeductCredits(userId, credits, requestId);
      
      if (!result.success) {
        console.error('Failed to deduct credits for payout:', result.message);
        // Consider failing the payout if credits can't be deducted
        return {
          success: false,
          error: `Failed to deduct credits: ${result.message}`,
        };
      }
    } catch (error) {
      console.error('Error deducting credits for payout:', error);
      return {
        success: false,
        error: 'Credit deduction failed',
      };
    }

    return {
      success: true,
      payoutId: (payout as any)?.id,
    };
  }
}

export const gamificationManager = new GamificationManager();