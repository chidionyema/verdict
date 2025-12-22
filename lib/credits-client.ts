import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];
type UserCredits = Database['public']['Tables']['user_credits']['Row'];
type JudgeReputation = Database['public']['Tables']['judge_reputation']['Row'];

export const CREDIT_ECONOMY_CONFIG = {
  JUDGMENTS_PER_CREDIT: 3, // Judge 3 submissions = earn 1 credit
  CREDIT_VALUE_PER_JUDGMENT: 1, // 1 full point per judgment (3 points = 1 credit)
  STREAK_BONUS_THRESHOLD: 7, // 7 days in a row
  STREAK_BONUS_CREDITS: 1, // Bonus credit for streak
  
  // Reputation tier thresholds
  TIER_THRESHOLDS: {
    rookie: { judgments: 0, consensus: 0 },
    regular: { judgments: 50, consensus: 60 },
    trusted: { judgments: 200, consensus: 70 },
    expert: { judgments: 500, consensus: 80 },
    elite: { judgments: 1000, consensus: 90 },
  },
  
  // Privacy pricing (in credits or cash)
  PRIVACY_COST: 1, // 1 credit to keep submission private
  EXPERT_JUDGE_COST: 2, // 2 credits for expert-tier judges only
  PRIORITY_COST: 1, // 1 credit for priority queue
} as const;

export class CreditManagerClient {
  private supabase = createClient();

  async getUserCredits(userId: string): Promise<UserCredits | null> {
    const { data, error } = await this.supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    return data;
  }

  async getJudgeReputation(userId: string): Promise<JudgeReputation | null> {
    const { data, error } = await this.supabase
      .from('judge_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    return data;
  }

  async awardCreditsForJudging(
    judgeId: string, 
    judgmentId: string,
    consensusMatch?: boolean,
    helpfulnessRating?: number
  ): Promise<boolean> {
    try {
      // Award judgment points (3 points = 1 credit)
      const { error: creditError } = await (this.supabase.rpc as any)('award_judgment_points', {
        target_user_id: judgeId,
        points_amount: CREDIT_ECONOMY_CONFIG.CREDIT_VALUE_PER_JUDGMENT, // 1 point per judgment
        transaction_source_id: judgmentId,
        transaction_description: `Earned ${CREDIT_ECONOMY_CONFIG.CREDIT_VALUE_PER_JUDGMENT} point for judging`
      });

      if (creditError) throw creditError;

      // Update reputation
      const { error: repError } = await (this.supabase.rpc as any)('update_judge_reputation', {
        target_user_id: judgeId,
        consensus_match: consensusMatch,
        helpfulness_rating: helpfulnessRating
      });

      if (repError) throw repError;

      // Check for streak bonus
      await this.checkStreakBonus(judgeId);

      return true;
    } catch (error) {
      console.error('Error awarding credits for judging:', error);
      return false;
    }
  }

  async canAfford(userId: string, creditsNeeded: number): Promise<boolean> {
    const credits = await this.getUserCredits(userId);
    return credits ? credits.balance >= creditsNeeded : false;
  }

  async calculateSubmissionCost(options: {
    isPrivate: boolean;
    expertJudgesOnly: boolean;
    priorityQueue: boolean;
  }): Promise<{ credits: number; description: string[] }> {
    let credits = 0;
    const features: string[] = [];

    if (options.isPrivate) {
      credits += CREDIT_ECONOMY_CONFIG.PRIVACY_COST;
      features.push('Private submission');
    }

    if (options.expertJudgesOnly) {
      credits += CREDIT_ECONOMY_CONFIG.EXPERT_JUDGE_COST;
      features.push('Expert judges only');
    }

    if (options.priorityQueue) {
      credits += CREDIT_ECONOMY_CONFIG.PRIORITY_COST;
      features.push('Priority queue');
    }

    return {
      credits,
      description: features.length > 0 ? features : ['Public submission (free)']
    };
  }

  private async checkStreakBonus(judgeId: string): Promise<void> {
    // Get current reputation to check streak
    const reputation = await this.getJudgeReputation(judgeId);
    if (!reputation) return;

    const today = new Date().toISOString().split('T')[0];
    const lastJudgment = reputation.last_judgment_date;

    // Update streak
    let newStreak = 1;
    if (lastJudgment) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastJudgment).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        newStreak = reputation.current_streak + 1;
      } else if (daysDiff === 0) {
        return; // Already judged today
      }
    }

    // Award streak bonus
    if (newStreak >= CREDIT_ECONOMY_CONFIG.STREAK_BONUS_THRESHOLD && 
        newStreak % CREDIT_ECONOMY_CONFIG.STREAK_BONUS_THRESHOLD === 0) {
      
      await (this.supabase.rpc as any)('award_credits', {
        target_user_id: judgeId,
        credit_amount: CREDIT_ECONOMY_CONFIG.STREAK_BONUS_CREDITS,
        transaction_type: 'bonus',
        transaction_source: 'streak_bonus',
        transaction_description: `${newStreak}-day judging streak bonus`
      });
    }

    // Update streak in reputation
    await (this.supabase
      .from('judge_reputation') as any)
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, reputation.longest_streak || 0),
        last_judgment_date: today
      })
      .eq('user_id', judgeId);
  }

  async getRecentTransactions(userId: string, limit = 10): Promise<CreditTransaction[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getLeaderboard(limit = 50): Promise<JudgeReputation[]> {
    const { data, error } = await this.supabase
      .from('judge_reputation')
      .select('*')
      .order('total_judgments', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  determineJudgeTier(reputation: JudgeReputation): keyof typeof CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS {
    const { total_judgments, consensus_rate } = reputation;
    
    if (total_judgments >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.elite.judgments &&
        consensus_rate >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.elite.consensus) {
      return 'elite';
    }
    
    if (total_judgments >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.expert.judgments &&
        consensus_rate >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.expert.consensus) {
      return 'expert';
    }
    
    if (total_judgments >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.trusted.judgments &&
        consensus_rate >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.trusted.consensus) {
      return 'trusted';
    }
    
    if (total_judgments >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.regular.judgments &&
        consensus_rate >= CREDIT_ECONOMY_CONFIG.TIER_THRESHOLDS.regular.consensus) {
      return 'regular';
    }
    
    return 'rookie';
  }
}

export const creditManagerClient = new CreditManagerClient();