import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: comparisonId } = await params;
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

    if (comparisonData.status !== 'pending' && comparisonData.status !== 'active') {
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
      .from('comparison_responses')
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

    // Create the verdict
    const { data: verdict, error: verdictError } = await supabase
      .from('comparison_responses')
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
      } as any)
      .select()
      .single();

    if (verdictError) {
      console.error('Error creating comparison verdict:', verdictError);
      return NextResponse.json(
        { error: 'Failed to submit verdict' },
        { status: 500 }
      );
    }

    // Award credits to judge for completing the verdict
    const creditAmount = comparisonData.request_tier === 'pro' ? 1.0 : 0.5; // More for pro tier comparisons
    try {
      await (supabase as any).rpc('award_credits', {
        target_user_id: user.id,
        credit_amount: creditAmount,
        transaction_type: 'judgment',
        transaction_source: 'comparison_verdict',
        transaction_source_id: (verdict as any)?.id || comparisonId,
        transaction_description: 'Comparison Judgment Reward',
      });
    } catch (error) {
      console.log('award_credits RPC not found, skipping');
    }

    // Update judge reputation and gamification metrics
    try {
      await (supabase as any).rpc('update_judge_reputation', {
        target_user_id: user.id,
        quality_score: Math.round((optionARating + optionBRating) / 2), // Average rating as quality indicator
      });
    } catch (error) {
      console.log('update_judge_reputation RPC not found, skipping');
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

    // Get updated comparison status (triggers will have updated it)
    const { data: updatedComparison } = await supabase
      .from('comparison_requests')
      .select('received_verdict_count, target_verdict_count, status, winning_option')
      .eq('id', comparisonId)
      .single() as { data: any, error: any };

    return NextResponse.json({
      success: true,
      verdictId: (verdict as any)?.id || 'unknown',
      creditsEarned: creditAmount,
      comparisonStatus: {
        receivedVerdicts: updatedComparison?.received_verdict_count || 0,
        targetVerdicts: updatedComparison?.target_verdict_count || 0,
        status: updatedComparison?.status,
        isComplete: updatedComparison?.status === 'completed',
        winningOption: updatedComparison?.winning_option,
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