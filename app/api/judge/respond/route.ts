// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateFeedback, validateRating, validateTone } from '@/lib/validations';

// POST /api/judge/respond - Submit a verdict
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a judge
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json(
        { error: 'Must be a judge to submit verdicts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { request_id, rating, feedback, tone } = body;

    // Validate request_id
    if (!request_id) {
      return NextResponse.json(
        { error: 'request_id is required' },
        { status: 400 }
      );
    }

    // Validate feedback
    const feedbackValidation = validateFeedback(feedback);
    if (!feedbackValidation.valid) {
      return NextResponse.json(
        { error: feedbackValidation.error },
        { status: 400 }
      );
    }

    // Validate rating
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.valid) {
      return NextResponse.json(
        { error: ratingValidation.error },
        { status: 400 }
      );
    }

    // Validate tone
    if (!validateTone(tone)) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
    }

    // Fetch the request
    const { data: verdictRequest, error: requestError } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Validate request state
    if (verdictRequest.status !== 'in_progress' && verdictRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is no longer accepting verdicts' },
        { status: 400 }
      );
    }

    if (verdictRequest.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot judge your own request' },
        { status: 400 }
      );
    }

    // Check if judge already responded
    const { data: existingResponse } = await supabase
      .from('verdict_responses')
      .select('id')
      .eq('request_id', request_id)
      .eq('judge_id', user.id)
      .single();

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already submitted a verdict for this request' },
        { status: 400 }
      );
    }

    // Create the verdict response
    const { data: verdict, error: createError } = await supabase
      .from('verdict_responses')
      .insert({
        request_id,
        judge_id: user.id,
        rating: rating || null,
        feedback,
        tone,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create verdict error:', createError);
      return NextResponse.json(
        { error: 'Failed to submit verdict' },
        { status: 500 }
      );
    }

    // Increment received_verdict_count
    const newCount = verdictRequest.received_verdict_count + 1;
    const newStatus =
      newCount >= verdictRequest.target_verdict_count ? 'closed' : 'in_progress';

    await supabase
      .from('verdict_requests')
      .update({
        received_verdict_count: newCount,
        status: newStatus,
      })
      .eq('id', request_id);

    // Create earnings record for the judge
    const baseEarning = 0.50; // Base earning per verdict
    const { error: earningsError } = await supabase
      .from('judge_earnings')
      .insert({
        judge_id: user.id,
        verdict_response_id: verdict.id,
        amount: baseEarning,
        payout_status: 'pending',
      });

    if (earningsError) {
      console.error('Error creating earnings record:', earningsError);
      // Don't fail the request if earnings creation fails, but log it
    }

    // Update verdict response with earning amount
    await supabase
      .from('verdict_responses')
      .update({
        judge_earning: baseEarning,
      })
      .eq('id', verdict.id);

    // Create notification for the seeker
    try {
      await (supabase.rpc as any)('create_notification', {
        target_user_id: verdictRequest.user_id,
        notification_type: 'new_verdict',
        notification_title: 'New verdict received!',
        notification_message: `You've received a new verdict for your ${verdictRequest.category} request.`,
        related_type: 'verdict_request',
        related_id: request_id,
        action_label: 'View Verdict',
        action_url: `/requests/${request_id}`,
        notification_priority: 'normal',
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail if notification creation fails
    }

    return NextResponse.json({ verdict }, { status: 201 });
  } catch (error) {
    console.error('POST /api/judge/respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
