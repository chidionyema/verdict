import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCreditEarning, CREDIT_EARNING_RULES } from '@/lib/pricing/dynamic-pricing';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/credits/check-earning - Check and award credits based on user activity
const POST_Handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current activity stats
    const [judgmentsResult, privateRequestsResult, totalRequestsResult, referralsResult] = await Promise.all([
      // Count completed judgments
      supabase
        .from('verdict_responses')
        .select('id', { count: 'exact' })
        .eq('judge_id', user.id)
        .not('submitted_at', 'is', null),

      // Count completed private requests where user paid
      supabase
        .from('verdict_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('visibility', 'private')
        .eq('status', 'completed'),

      // Count ALL completed requests (private + community)
      supabase
        .from('verdict_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed'),

      // Count successful referrals (placeholder - implement referral tracking)
      Promise.resolve({ count: 0 })
    ]);

    const userStats = {
      completed_judgments: judgmentsResult.count || 0,
      completed_private_requests: privateRequestsResult.count || 0,
      completed_total_requests: totalRequestsResult.count || 0,
      successful_referrals: referralsResult.count || 0,
    };

    // Check each earning rule
    const earningResults = Object.entries(CREDIT_EARNING_RULES).map(([ruleId, rule]) => {
      const result = checkCreditEarning(user.id, ruleId, userStats);
      return {
        rule_id: ruleId,
        rule_name: rule.description,
        ...result,
      };
    });

    // Check for special case: Complete 2 private requests + pay + complete 1 more request = 1 credit
    const privateCompletionRule = earningResults.find(r => r.rule_id === 'private_completion');
    
    if (privateCompletionRule?.qualified && privateCompletionRule.cycle_progress?.cycle_complete) {
      // Check if user has already received this bonus for this cycle
      const cycleId = `cycle_${Math.floor(userStats.completed_total_requests / 3)}`; // Group by cycles of 3
      
      const { data: existingAward } = await supabase
        .from('credit_awards')
        .select('id')
        .eq('user_id', user.id)
        .eq('reason', 'private_completion_cycle')
        .eq('cycle_id', cycleId)
        .single();

      if (!existingAward) {
        // Award the bonus credit
        const { error: awardError } = await (supabase as any)
          .from('credit_awards')
          .insert({
            user_id: user.id,
            credits_awarded: 1,
            reason: 'private_completion_cycle',
            cycle_id: cycleId,
            description: `Bonus credit for completing cycle: ${privateCompletionRule.cycle_progress.private_requests} private + ${privateCompletionRule.cycle_progress.additional_requests} additional requests`,
          });

        if (!awardError) {
          // Add credit to user's balance
          const { error: creditError } = await (supabase as any).rpc('add_credits', {
            p_user_id: user.id,
            p_credits: 1,
          });

          if (creditError) {
            log.error('Failed to add cycle completion credit to user balance', creditError);
          } else {
            log.info('Awarded private completion cycle credit', {
              userId: user.id,
              creditsAwarded: 1,
              cycleId,
              privateRequests: privateCompletionRule.cycle_progress.private_requests,
              additionalRequests: privateCompletionRule.cycle_progress.additional_requests,
            });
          }
        }
      }
    }

    // Check judgment-based credit earning
    const judgmentRule = earningResults.find(r => r.rule_id === 'community_judgments');
    
    if (judgmentRule?.qualified) {
      // Calculate how many credits they should have earned from judgments
      const expectedCredits = Math.floor(userStats.completed_judgments / 3);
      
      // Check how many they've already received
      const { data: judgmentAwards } = await supabase
        .from('credit_awards')
        .select('credits_awarded', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('reason', 'judgment_completion');

      const receivedCredits = judgmentAwards?.reduce((total, award) => 
        total + ((award as any).credits_awarded || 0), 0) || 0;

      const creditsToAward = expectedCredits - receivedCredits;

      if (creditsToAward > 0) {
        // Award the earned credits
        const { error: awardError } = await (supabase as any)
          .from('credit_awards')
          .insert({
            user_id: user.id,
            credits_awarded: creditsToAward,
            reason: 'judgment_completion',
            description: `Credits earned for completing judgments (${userStats.completed_judgments} total)`,
          });

        if (!awardError) {
          // Add credits to user's balance
          const { error: creditError } = await (supabase as any).rpc('add_credits', {
            p_user_id: user.id,
            p_credits: creditsToAward,
          });

          if (creditError) {
            log.error('Failed to add judgment credits to user balance', creditError);
          } else {
            log.info('Awarded judgment completion credits', {
              userId: user.id,
              creditsAwarded: creditsToAward,
              totalJudgments: userStats.completed_judgments,
            });
          }
        }
      }
    }

    // Get updated user balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user_stats: userStats,
      earning_results: earningResults,
      current_credits: (profile as any)?.credits || 0,
      message: 'Credit earning check completed',
    });

  } catch (error) {
    log.error('Credit earning check failed', error);
    return NextResponse.json(
      { error: 'Failed to check credit earning' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(POST_Handler, rateLimitPresets.standard);

// GET /api/credits/check-earning - Get user's credit earning progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get earning rules and user progress
    const [judgmentsResult, privateRequestsResult, totalRequestsResult] = await Promise.all([
      supabase
        .from('verdict_responses')
        .select('id', { count: 'exact' })
        .eq('judge_id', user.id)
        .not('submitted_at', 'is', null),

      supabase
        .from('verdict_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('visibility', 'private')
        .eq('status', 'completed'),

      supabase
        .from('verdict_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
    ]);

    const userStats = {
      completed_judgments: judgmentsResult.count || 0,
      completed_private_requests: privateRequestsResult.count || 0,
      completed_total_requests: totalRequestsResult.count || 0,
      successful_referrals: 0,
    };

    const progressData = Object.entries(CREDIT_EARNING_RULES).map(([ruleId, rule]) => {
      const result = checkCreditEarning(user.id, ruleId, userStats);
      return {
        rule_id: ruleId,
        description: rule.description,
        progress: result.progress,
        requirement: result.requirement,
        qualified: result.qualified,
        credits_to_earn: rule.credits_earned,
        percentage: Math.min(100, (result.progress / result.requirement) * 100),
      };
    });

    return NextResponse.json({
      earning_rules: progressData,
      user_stats: userStats,
    });

  } catch (error) {
    log.error('Failed to get credit earning progress', error);
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}