import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';
import { TIER_CONFIGURATIONS, getTierConfig } from '@/lib/pricing/dynamic-pricing';

// Helper to get judge earning for a request tier
function getJudgeEarningCents(tier?: string): number {
  const tierKey = tier === 'pro' ? 'expert' : (tier || 'community');
  try {
    const config = getTierConfig(tierKey);
    return config.judge_payout_cents;
  } catch {
    return TIER_CONFIGURATIONS.community.judge_payout_cents;
  }
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

interface SubmitComparisonVerdictRequest {
  chosenOption: 'A' | 'B';
  confidenceScore: number;
  reasoning: string;
  optionAFeedback: string;
  optionAStrengths: string[];
  optionAWeaknesses: string[];
  optionARating: number;
  optionBFeedback: string;
  optionBStrengths: string[];
  optionBWeaknesses: string[];
  optionBRating: number;
  budgetConsideration: string;
  timeSpentSeconds: number;
  judgeExpertise: string[];
  decisionScores?: Record<string, { option_a: number; option_b: number }>;
}

async function POST_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: comparisonId } = await params;

    // Validate comparisonId as UUID
    if (!isValidUUID(comparisonId)) {
      return NextResponse.json({ error: 'Invalid comparison ID format' }, { status: 400 });
    }

    const {
      chosenOption,
      confidenceScore,
      reasoning,
      optionAFeedback,
      optionAStrengths,
      optionAWeaknesses,
      optionARating,
      optionBFeedback,
      optionBStrengths,
      optionBWeaknesses,
      optionBRating,
      budgetConsideration,
      timeSpentSeconds,
      judgeExpertise,
      decisionScores,
    }: SubmitComparisonVerdictRequest = await request.json();

    // Validate input
    if (!comparisonId || !chosenOption || !reasoning) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['A', 'B'].includes(chosenOption)) {
      return NextResponse.json(
        { error: 'Chosen option must be A or B' },
        { status: 400 }
      );
    }

    if (confidenceScore < 1 || confidenceScore > 10) {
      return NextResponse.json(
        { error: 'Confidence score must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (optionARating < 1 || optionARating > 10 || optionBRating < 1 || optionBRating > 10) {
      return NextResponse.json(
        { error: 'Option ratings must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (reasoning.trim().length < 20) {
      return NextResponse.json(
        { error: 'Reasoning must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Validate consistency between choice and ratings
    if (chosenOption === 'A' && optionARating < optionBRating) {
      return NextResponse.json(
        { error: 'If choosing option A, it should have a higher or equal rating than option B' },
        { status: 400 }
      );
    }

    if (chosenOption === 'B' && optionBRating < optionARating) {
      return NextResponse.json(
        { error: 'If choosing option B, it should have a higher or equal rating than option A' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CRITICAL: Verify user is a qualified judge
    const { data: judgeProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_judge, judge_qualification_date')
      .eq('id', user.id)
      .single();

    if (profileError || !judgeProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!(judgeProfile as any).is_judge || !(judgeProfile as any).judge_qualification_date) {
      return NextResponse.json(
        { error: 'You must be a qualified judge to submit verdicts' },
        { status: 403 }
      );
    }

    // Verify comparison exists and is open for judgments
    const { data: comparison, error: comparisonError } = await supabase
      .from('comparison_requests')
      .select('*')
      .eq('id', comparisonId)
      .single();

    if (comparisonError || !comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    const comparisonData = comparison as any;

    if (comparisonData.status !== 'open' && comparisonData.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Comparison is no longer accepting verdicts' },
        { status: 410 }
      );
    }

    if (comparisonData.received_verdict_count >= comparisonData.target_verdict_count) {
      return NextResponse.json(
        { error: 'Comparison has already received enough verdicts' },
        { status: 410 }
      );
    }

    // Check if user has already submitted a verdict for this comparison
    const { data: existingVerdict } = await supabase
      .from('comparison_verdicts')
      .select('id')
      .eq('comparison_id', comparisonId)
      .eq('judge_id', user.id)
      .single();

    if (existingVerdict) {
      return NextResponse.json(
        { error: 'You have already submitted a verdict for this comparison' },
        { status: 409 }
      );
    }

    // Check if user is the creator (can't judge own comparison)
    if (comparisonData.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot judge your own comparison' },
        { status: 403 }
      );
    }

    // Calculate judge earning based on request tier FIRST
    const earningCents = getJudgeEarningCents(comparisonData.request_tier);
    const earningAmount = earningCents / 100; // Convert to dollars

    // Generate a temporary verdict ID for earnings record
    const tempVerdictId = crypto.randomUUID();

    // ATOMICITY FIX: Create earnings record FIRST with retry logic
    // This ensures judges get paid for their work even if subsequent steps fail
    let earningsCreated = false;
    let earningsRetryCount = 0;
    const MAX_EARNINGS_RETRIES = 3;

    while (!earningsCreated && earningsRetryCount < MAX_EARNINGS_RETRIES) {
      try {
        const { error: earningsError } = await (supabase as any)
          .from('judge_earnings')
          .insert({
            judge_id: user.id,
            verdict_response_id: tempVerdictId,
            amount: earningAmount,
            currency: 'USD',
            payout_status: 'pending',
            request_type: 'comparison',
            request_id: comparisonId,
            created_at: new Date().toISOString(),
          });

        if (earningsError) {
          throw earningsError;
        }
        earningsCreated = true;
        log.info('Judge earnings pre-created for comparison verdict', {
          judgeId: user.id,
          tempVerdictId,
          amount: earningAmount,
          tier: comparisonData.request_tier
        });
      } catch (earningsError) {
        earningsRetryCount++;
        if (earningsRetryCount >= MAX_EARNINGS_RETRIES) {
          log.error('CRITICAL: Failed to create judge_earnings after retries - blocking verdict', {
            error: earningsError,
            judgeId: user.id,
            comparisonId,
            amount: earningAmount,
            retries: earningsRetryCount
          });
          return NextResponse.json(
            { error: 'Payment processing failed. Please try again.' },
            { status: 500 }
          );
        }
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, earningsRetryCount)));
      }
    }

    // Create the verdict
    const { data: verdict, error: verdictError } = await supabase
      .from('comparison_verdicts')
      .insert({
        comparison_id: comparisonId,
        judge_id: user.id,
        chosen_option: chosenOption,
        confidence_score: confidenceScore,
        reasoning: reasoning.trim(),
        option_a_feedback: optionAFeedback.trim(),
        option_a_strengths: optionAStrengths,
        option_a_weaknesses: optionAWeaknesses,
        option_a_rating: optionARating,
        option_b_feedback: optionBFeedback.trim(),
        option_b_strengths: optionBStrengths,
        option_b_weaknesses: optionBWeaknesses,
        option_b_rating: optionBRating,
        budget_consideration: budgetConsideration.trim(),
        judge_expertise: judgeExpertise,
        time_spent_seconds: timeSpentSeconds,
        decision_scores: decisionScores || null,
      } as any)
      .select()
      .single();

    if (verdictError) {
      log.error('Verdict creation failed after earnings created - needs reconciliation', {
        error: verdictError,
        judgeId: user.id,
        tempVerdictId,
        comparisonId
      });
      await (supabase as any)
        .from('judge_earnings')
        .update({ payout_status: 'needs_review', notes: 'Verdict creation failed' })
        .eq('verdict_response_id', tempVerdictId);

      return NextResponse.json(
        { error: 'Failed to submit verdict. Your earnings have been recorded for review.' },
        { status: 500 }
      );
    }

    // Update earnings record with actual verdict ID
    const verdictId = (verdict as any)?.id;
    if (verdictId && verdictId !== tempVerdictId) {
      await (supabase as any)
        .from('judge_earnings')
        .update({ verdict_response_id: verdictId })
        .eq('verdict_response_id', tempVerdictId);
    }

    // Increment verdict count and auto-close if target reached
    let updatedComparison;
    try {
      const { data: incrementResult, error: incrementError } = await (supabase as any).rpc(
        'increment_comparison_verdict_count_and_close',
        { p_comparison_id: comparisonId }
      );

      if (incrementError) {
        log.warn('Failed to increment comparison verdict count', { error: incrementError, comparisonId });
      } else {
        updatedComparison = incrementResult;
      }
    } catch (incrementError) {
      log.warn('RPC call failed for increment_comparison_verdict_count_and_close', { error: incrementError, comparisonId });
    }

    // Award credits to judge (for credit balance - separate from earnings)
    // Note: Verdict already created, so don't fail the request if this fails
    try {
      await (supabase as any).rpc('award_credits', {
        target_user_id: user.id,
        credit_amount: earningAmount,
        transaction_type: 'judgment',
        transaction_source: 'comparison_verdict',
        transaction_source_id: verdictId || comparisonId,
        transaction_description: 'Comparison Judgment Reward',
      });
    } catch (rpcError) {
      // Verdict was already created successfully - log for async recovery but don't fail
      log.error('award_credits RPC failed for comparison verdict - needs async recovery', {
        error: rpcError,
        userId: user.id,
        amount: earningAmount,
        verdictId,
        comparisonId
      });
      // Continue - verdict was recorded, credits can be reconciled later
    }

    // Update judge reputation (non-critical, can silently fail)
    try {
      await (supabase as any).rpc('update_judge_reputation', {
        target_user_id: user.id,
        quality_score: Math.round((optionARating + optionBRating) / 2),
      });
    } catch (error) {
      // Reputation update is non-critical, just log
      log.warn('update_judge_reputation failed', { error, userId: user.id });
    }

    // Log the judgment action (skip if table doesn't exist yet)
    try {
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action: 'comparison_verdict_submitted',
          metadata: {
            comparison_id: comparisonId,
            chosen_option: chosenOption,
            confidence_score: confidenceScore,
            time_spent_seconds: timeSpentSeconds,
          },
        } as any);
    } catch (error) {
      // Table may not exist yet, ignore error
      console.log('user_actions table not found, skipping log');
    }

    // Get updated comparison status if not already set by increment RPC
    if (!updatedComparison) {
      const { data: fetchedComparison } = await supabase
        .from('comparison_requests')
        .select('received_verdict_count, target_verdict_count, status, winner_option')
        .eq('id', comparisonId)
        .single() as { data: any, error: any };
      updatedComparison = fetchedComparison;
    }

    return NextResponse.json({
      success: true,
      verdictId: verdictId || 'unknown',
      creditsEarned: earningAmount,
      comparisonStatus: {
        receivedVerdicts: updatedComparison?.received_verdict_count || 0,
        targetVerdicts: updatedComparison?.target_verdict_count || 0,
        status: updatedComparison?.status,
        isComplete: updatedComparison?.status === 'closed',
        winningOption: updatedComparison?.winner_option,
      },
    });

  } catch (error) {
    console.error('Error submitting comparison verdict:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to comparison verdict endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);