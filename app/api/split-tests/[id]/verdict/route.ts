import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: splitTestId } = await params;
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
      .eq('split_test_request_id', splitTestId)
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

    // Create the verdict
    const { data: verdict, error: verdictError } = await supabase
      .from('split_test_verdicts')
      .insert({
        split_test_request_id: splitTestId,
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
      console.error('Error creating split test verdict:', verdictError);
      return NextResponse.json(
        { error: 'Failed to submit verdict' },
        { status: 500 }
      );
    }

    // Award credits to judge for completing the verdict
    const creditAmount = 0.34; // 1/3 credit for split test verdict
    try {
      await (supabase as any).rpc('award_credits', {
        target_user_id: user.id,
        credit_amount: creditAmount,
        transaction_type: 'judgment',
        transaction_source: 'split_test_verdict',
        transaction_source_id: (verdict as any)?.id || splitTestId,
        transaction_description: 'Split Test Judgment Reward',
      });
    } catch (rpcError) {
      // EMERGENCY FIX: Remove dangerous fallback - fail safely instead
      console.error('award_credits RPC failed - credit system temporarily unavailable:', rpcError);
      
      // Log the failure for investigation but don't manipulate credits unsafely
      console.error('CRITICAL: Credit award failed for user', user.id, 'amount:', creditAmount);
      
      // Return error instead of dangerous fallback
      return NextResponse.json(
        { 
          error: 'Credit system temporarily unavailable. Your judgment was recorded but credits will be awarded later.',
          details: 'Please contact support if this persists.'
        }, 
        { status: 503 }
      );
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

    // Get updated split test status (triggers will have updated it)
    const { data: updatedSplitTest } = await supabase
      .from('split_test_requests')
      .select('received_verdict_count, target_verdict_count, status, winning_photo')
      .eq('id', splitTestId)
      .single() as { data: any, error: any };

    return NextResponse.json({
      success: true,
      verdictId: (verdict as any)?.id || 'unknown',
      creditsEarned: creditAmount,
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