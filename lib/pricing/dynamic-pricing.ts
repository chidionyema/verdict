/**
 * Dynamic Pricing System
 * 
 * Unified pricing configuration that eliminates hardcoded values
 * and provides flexible tier-based pricing with dynamic judge selection
 */

export interface TierConfiguration {
  id: string;
  name: string;
  description: string;
  default_judges: number;
  min_judges: number;
  max_judges: number;
  base_price_cents: number; // Price for default judge count
  judge_price_cents: number; // Additional cost per extra judge
  credits_required: number;
  features: string[];
  expert_routing: boolean;
  priority_queue: boolean;
  response_time_hours: number;
  judge_payout_cents: number; // How much we pay judges per verdict
}

export const TIER_CONFIGURATIONS: Record<string, TierConfiguration> = {
  community: {
    id: 'community',
    name: 'Community',
    description: 'Fast feedback from verified community members',
    default_judges: 3,
    min_judges: 3,
    max_judges: 10,
    base_price_cents: 0, // Free with credits
    judge_price_cents: 50, // $0.50 per additional judge
    credits_required: 1,
    features: [
      'Anonymous feedback',
      'Community reviewers',
      '24-48 hour response'
    ],
    expert_routing: false,
    priority_queue: false,
    response_time_hours: 48,
    judge_payout_cents: 25, // $0.25 per verdict
  },
  
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Quality feedback with expert routing',
    default_judges: 3,
    min_judges: 3,
    max_judges: 15,
    base_price_cents: 300, // $3.00 for 3 judges
    judge_price_cents: 100, // $1.00 per additional judge
    credits_required: 0, // Direct payment
    features: [
      'Expert routing',
      'Quality filtering',
      'Priority queue',
      '12-24 hour response'
    ],
    expert_routing: true,
    priority_queue: true,
    response_time_hours: 24,
    judge_payout_cents: 50, // $0.50 per verdict
  },
  
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'Premium feedback from verified experts',
    default_judges: 3,
    min_judges: 3,
    max_judges: 20,
    base_price_cents: 1200, // $12.00 for 3 experts
    judge_price_cents: 400, // $4.00 per additional expert
    credits_required: 0, // Direct payment
    features: [
      'Verified experts only',
      'Detailed analysis',
      'Same-day response',
      'Expert categories',
      'Quality guarantee'
    ],
    expert_routing: true,
    priority_queue: true,
    response_time_hours: 12,
    judge_payout_cents: 200, // $2.00 per verdict
  },
};

/**
 * Calculate total price for a tier with specific judge count
 */
export function calculateTierPrice(tierId: string, judgeCount: number): {
  total_cents: number;
  base_price_cents: number;
  additional_judges_price_cents: number;
  judge_payout_total_cents: number;
  gross_margin_cents: number;
} {
  const config = TIER_CONFIGURATIONS[tierId];
  if (!config) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }

  if (judgeCount < config.min_judges || judgeCount > config.max_judges) {
    throw new Error(`Judge count ${judgeCount} outside allowed range ${config.min_judges}-${config.max_judges} for tier ${tierId}`);
  }

  const additionalJudges = Math.max(0, judgeCount - config.default_judges);
  const additionalPrice = additionalJudges * config.judge_price_cents;
  const totalPrice = config.base_price_cents + additionalPrice;
  const judgePayoutTotal = judgeCount * config.judge_payout_cents;
  const grossMargin = totalPrice - judgePayoutTotal;

  return {
    total_cents: totalPrice,
    base_price_cents: config.base_price_cents,
    additional_judges_price_cents: additionalPrice,
    judge_payout_total_cents: judgePayoutTotal,
    gross_margin_cents: grossMargin,
  };
}

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tierId: string): TierConfiguration {
  const config = TIER_CONFIGURATIONS[tierId];
  if (!config) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }
  return config;
}

/**
 * Validate tier and judge count combination
 */
export function validateTierRequest(tierId: string, judgeCount: number): {
  valid: boolean;
  error?: string;
  config?: TierConfiguration;
} {
  try {
    const config = getTierConfig(tierId);
    
    if (judgeCount < config.min_judges) {
      return {
        valid: false,
        error: `Minimum ${config.min_judges} judges required for ${config.name} tier`
      };
    }
    
    if (judgeCount > config.max_judges) {
      return {
        valid: false,
        error: `Maximum ${config.max_judges} judges allowed for ${config.name} tier`
      };
    }
    
    return { valid: true, config };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid tier configuration'
    };
  }
}

/**
 * Get all available tiers for UI
 */
export function getAllTiers(): TierConfiguration[] {
  return Object.values(TIER_CONFIGURATIONS);
}

/**
 * Credit earning logic
 */
export interface CreditEarningRule {
  type: 'judgments' | 'private_completion_cycle' | 'referral' | 'bonus';
  requirement: number; // Number of total requests completed in the cycle
  credits_earned: number;
  description: string;
  cycle_requirements?: {
    private_paid_requests: number;
    additional_requests: number;
  };
}

export const CREDIT_EARNING_RULES: Record<string, CreditEarningRule> = {
  community_judgments: {
    type: 'judgments',
    requirement: 3, // Complete 3 judgments
    credits_earned: 1,
    description: 'Complete 3 quality judgments to earn 1 credit'
  },
  
  private_completion: {
    type: 'private_completion_cycle',
    requirement: 3, // Total requests in cycle
    credits_earned: 1,
    description: 'Complete 2 private requests + pay + complete 1 more request = 1 bonus credit',
    cycle_requirements: {
      private_paid_requests: 2, // Must have 2 private paid requests
      additional_requests: 1,   // Plus 1 more request of any type
    }
  },
  
  referral_signup: {
    type: 'referral',
    requirement: 1, // 1 successful referral
    credits_earned: 2,
    description: 'Refer a friend who makes their first submission'
  },
};

/**
 * Check if user qualifies for credit earning
 */
export function checkCreditEarning(
  userId: string,
  rule: string,
  userStats: {
    completed_judgments?: number;
    completed_private_requests?: number;
    completed_total_requests?: number;
    successful_referrals?: number;
  }
): {
  qualified: boolean;
  credits_to_award: number;
  progress: number;
  requirement: number;
  cycle_progress?: {
    private_requests: number;
    additional_requests: number;
    cycle_complete: boolean;
  };
} {
  const earningRule = CREDIT_EARNING_RULES[rule];
  if (!earningRule) {
    return { qualified: false, credits_to_award: 0, progress: 0, requirement: 0 };
  }

  let progress = 0;
  let qualified = false;
  let cycleProgress;
  
  switch (earningRule.type) {
    case 'judgments':
      progress = userStats.completed_judgments || 0;
      qualified = progress >= earningRule.requirement;
      break;
      
    case 'private_completion_cycle':
      const privateRequests = userStats.completed_private_requests || 0;
      const totalRequests = userStats.completed_total_requests || 0;
      const additionalRequests = Math.max(0, totalRequests - privateRequests);
      
      const cycleReqs = earningRule.cycle_requirements!;
      const privateQualified = privateRequests >= cycleReqs.private_paid_requests;
      const additionalQualified = additionalRequests >= cycleReqs.additional_requests;
      
      progress = Math.min(
        privateRequests + Math.min(additionalRequests, cycleReqs.additional_requests),
        earningRule.requirement
      );
      
      qualified = privateQualified && additionalQualified;
      
      cycleProgress = {
        private_requests: privateRequests,
        additional_requests: additionalRequests,
        cycle_complete: qualified,
      };
      break;
      
    case 'referral':
      progress = userStats.successful_referrals || 0;
      qualified = progress >= earningRule.requirement;
      break;
  }
  
  return {
    qualified,
    credits_to_award: qualified ? earningRule.credits_earned : 0,
    progress,
    requirement: earningRule.requirement,
    cycle_progress: cycleProgress,
  };
}

/**
 * Business metrics for monitoring
 */
export function calculateBusinessMetrics(tierId: string, judgeCount: number) {
  const pricing = calculateTierPrice(tierId, judgeCount);
  const config = getTierConfig(tierId);
  
  const grossMarginPercent = pricing.total_cents > 0 
    ? (pricing.gross_margin_cents / pricing.total_cents) * 100 
    : 0;
    
  return {
    tier: config.name,
    judge_count: judgeCount,
    revenue_cents: pricing.total_cents,
    costs_cents: pricing.judge_payout_total_cents,
    gross_margin_cents: pricing.gross_margin_cents,
    gross_margin_percent: grossMarginPercent,
    profitable: pricing.gross_margin_cents > 0,
    response_time_hours: config.response_time_hours,
  };
}