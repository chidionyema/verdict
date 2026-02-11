import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';
import { log } from '@/lib/logger';
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

interface SubmitSplitTestVerdictRequest {
  chosenPhoto: 'A' | 'B';
  confidenceScore: number;
  reasoning: string;
  photoAFeedback: string;
  photoAStrengths: string[];
  photoAImprovements: string[];
  photoARating: number;
  photoBFeedback: string;
  photoBStrengths: string[];
  photoBImprovements: string[];
  photoBRating: number;
  timeSpentSeconds: number;
  judgeExpertise: string[];
}

async function POST_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: splitTestId } = await params;

    // Validate splitTestId as UUID
    if (!isValidUUID(splitTestId)) {
      return NextResponse.json({ error: 'Invalid split test ID format' }, { status: 400 });
    }

    const {
      chosenPhoto,
      confidenceScore,
      reasoning,
      photoAFeedback,
      photoAStrengths,
      photoAImprovements,
      photoARating,
      photoBFeedback,
      photoBStrengths,
      photoBImprovements,
      photoBRating,
      timeSpentSeconds,
      judgeExpertise,
    }: SubmitSplitTestVerdictRequest = await request.json();

    // Validate input
    if (!splitTestId || !chosenPhoto || !reasoning) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['A', 'B'].includes(chosenPhoto)) {
      return NextResponse.json(
        { error: 'Chosen photo must be A or B' },
        { status: 400 }
      );
    }

    if (confidenceScore < 1 || confidenceScore > 10) {
      return NextResponse.json(
        { error: 'Confidence score must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (photoARating < 1 || photoARating > 10 || photoBRating < 1 || photoBRating > 10) {
      return NextResponse.json(
        { error: 'Photo ratings must be between 1 and 10' },
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
    if (chosenPhoto === 'A' && photoARating < photoBRating) {
      return NextResponse.json(
        { error: 'If choosing photo A, it should have a higher or equal rating than photo B' },
        { status: 400 }
      );
    }

    if (chosenPhoto === 'B' && photoBRating < photoARating) {
      return NextResponse.json(
        { error: 'If choosing photo B, it should have a higher or equal rating than photo A' },
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

    // Verify split test exists and is open for judgments
    const { data: splitTest, error: splitTestError } = await supabase
      .from('split_test_requests')
      .select('*')
      .eq('id', splitTestId)
      .single();

    if (splitTestError || !splitTest) {
      return NextResponse.json(
        { error: 'Split test not found' },
        { status: 404 }
      );
    }

    const splitTestData = splitTest as any;

    if (splitTestData.status !== 'open' && splitTestData.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Split test is no longer accepting verdicts' },
        { status: 410 }
      );
    }

    if (splitTestData.received_verdict_count >= splitTestData.target_verdict_count) {
      return NextResponse.json(
        { error: 'Split test has already received enough verdicts' },
        { status: 410 }
      );
    }

    // Check if user has already submitted a verdict for this split test
    const { data: existingVerdict } = await supabase
      .from('split_test_verdicts')
      .select('id')
      .eq('split_test_id', splitTestId)
      .eq('judge_id', user.id)
      .single();

    if (existingVerdict) {
      return NextResponse.json(
        { error: 'You have already submitted a verdict for this split test' },
        { status: 409 }
      );
    }

    // Check if user is the creator (can't judge own split test)
    if (splitTestData.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot judge your own split test' },
        { status: 403 }
      );
    }

    // Calculate judge earning based on request tier FIRST
    const earningCents = getJudgeEarningCents(splitTestData.request_tier);
    const earningAmount = earningCents / 100; // Convert to dollars

    // Generate a temporary verdict ID for earnings record (will be updated after verdict creation)
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
            request_type: 'split_test',
            request_id: splitTestId,
            created_at: new Date().toISOString(),
          });

        if (earningsError) {
          throw earningsError;
        }
        earningsCreated = true;
        log.info('Judge earnings pre-created for split test verdict', {
          judgeId: user.id,
          tempVerdictId,
          amount: earningAmount,
          tier: splitTestData.request_tier
        });
      } catch (earningsError) {
        earningsRetryCount++;
        if (earningsRetryCount >= MAX_EARNINGS_RETRIES) {
          // CRITICAL: Could not create earnings record - do not proceed with verdict
          // Judge should not work for free
          log.error('CRITICAL: Failed to create judge_earnings after retries - blocking verdict', {
            error: earningsError,
            judgeId: user.id,
            splitTestId,
            amount: earningAmount,
            retries: earningsRetryCount
          });
          return NextResponse.json(
            { error: 'Payment processing failed. Please try again.' },
            { status: 500 }
          );
        }
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, earningsRetryCount)));
      }
    }

    // Create the verdict
    const { data: verdict, error: verdictError } = await supabase
      .from('split_test_verdicts')
      .insert({
        split_test_id: splitTestId,
        judge_id: user.id,
        chosen_photo: chosenPhoto,
        confidence_score: confidenceScore,
        reasoning: reasoning.trim(),
        photo_a_feedback: photoAFeedback.trim(),
        photo_a_strengths: photoAStrengths,
        photo_a_improvements: photoAImprovements,
        photo_a_rating: photoARating,
        photo_b_feedback: photoBFeedback.trim(),
        photo_b_strengths: photoBStrengths,
        photo_b_improvements: photoBImprovements,
        photo_b_rating: photoBRating,
        judge_expertise: judgeExpertise,
        time_spent_seconds: timeSpentSeconds,
      } as any)
      .select()
      .single();

    if (verdictError) {
      // Verdict failed but earnings were created - mark earnings for review
      log.error('Verdict creation failed after earnings created - needs reconciliation', {
        error: verdictError,
        judgeId: user.id,
        tempVerdictId,
        splitTestId
      });
      // Update earnings to flag for review (don't delete - judge did the work)
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
    let updatedSplitTest;
    try {
      const { data: incrementResult, error: incrementError } = await (supabase as any).rpc(
        'increment_split_test_verdict_count_and_close',
        { p_split_test_id: splitTestId }
      );

      if (incrementError) {
        log.warn('Failed to increment split test verdict count', { error: incrementError, splitTestId });
      } else {
        updatedSplitTest = incrementResult;
      }
    } catch (incrementError) {
      log.warn('RPC call failed for increment_split_test_verdict_count_and_close', { error: incrementError, splitTestId });
    }

    // Award credits to judge (for credit balance - separate from earnings)
    // Note: Verdict already created, so don't fail the request if this fails
    try {
      await (supabase as any).rpc('award_credits', {
        target_user_id: user.id,
        credit_amount: earningAmount,
        transaction_type: 'judgment',
        transaction_source: 'split_test_verdict',
        transaction_source_id: verdictId || splitTestId,
        transaction_description: 'Split Test Judgment Reward',
      });
    } catch (rpcError) {
      // Verdict was already created successfully - log for async recovery but don't fail
      log.error('award_credits RPC failed for split test verdict - needs async recovery', {
        error: rpcError,
        userId: user.id,
        amount: earningAmount,
        verdictId,
        splitTestId
      });
      // Continue - verdict was recorded, credits can be reconciled later
    }

    // Update judge reputation (non-critical, can silently fail)
    try {
      await (supabase as any).rpc('update_judge_reputation', {
        target_user_id: user.id,
        quality_score: Math.round((photoARating + photoBRating) / 2),
      });
    } catch (error) {
      // Reputation update is non-critical, just log
      console.error('update_judge_reputation failed:', error);
    }

    // Log the judgment action (skip if table doesn't exist yet)
    try {
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action: 'split_test_verdict_submitted',
          metadata: {
            split_test_id: splitTestId,
            chosen_photo: chosenPhoto,
            confidence_score: confidenceScore,
            time_spent_seconds: timeSpentSeconds,
          },
        } as any);
    } catch (error) {
      // Table may not exist yet, ignore error
      console.log('user_actions table not found, skipping log');
    }

    // Get updated split test status if not already set by increment RPC
    if (!updatedSplitTest) {
      const { data: fetchedSplitTest } = await supabase
        .from('split_test_requests')
        .select('received_verdict_count, target_verdict_count, status, winning_photo')
        .eq('id', splitTestId)
        .single() as { data: any, error: any };
      updatedSplitTest = fetchedSplitTest;
    }

    return NextResponse.json({
      success: true,
      verdictId: verdictId || 'unknown',
      creditsEarned: earningAmount,
      splitTestStatus: {
        receivedVerdicts: updatedSplitTest?.received_verdict_count || 0,
        targetVerdicts: updatedSplitTest?.target_verdict_count || 0,
        status: updatedSplitTest?.status,
        isComplete: updatedSplitTest?.status === 'closed',
        winningPhoto: updatedSplitTest?.winning_photo,
      },
    });

  } catch (error) {
    console.error('Error submitting split test verdict:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to split test verdict endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);