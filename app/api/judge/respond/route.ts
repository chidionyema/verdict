import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateFeedback, validateRating, validateTone, getTierConfigByVerdictCount } from '@/lib/validations';
import { addJudgeVerdict } from '@/lib/verdicts';
import { verdictRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { sendRequestLifecycleEmail } from '@/lib/notifications';
import { log } from '@/lib/logger';

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

    // Rate limiting for verdict submission
    const rateLimitCheck = await checkRateLimit(verdictRateLimiter, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
        }
      );
    }

    // Check if user is a judge
    const { data: profile } = await (supabase as any)
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
    const { request_id, rating, feedback, tone, voice_url } = body;

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

    // Domain logic: add verdict and update request atomically at the app layer
    let verdict, updatedRequest;
    try {
      const result = await addJudgeVerdict(supabase, {
        requestId: request_id,
        judgeId: user.id,
        rating,
        feedback,
        tone,
        voiceUrl: voice_url,
      });
      verdict = result.verdict;
      updatedRequest = result.updatedRequest;
    } catch (err: any) {
      if (err?.code === 'REQUEST_NOT_FOUND') {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      if (err?.code === 'REQUEST_CLOSED') {
        return NextResponse.json(
          { error: 'Request is no longer accepting verdicts' },
          { status: 400 }
        );
      }
      if (err?.code === 'ALREADY_RESPONDED') {
        return NextResponse.json(
          { error: 'You have already submitted a verdict for this request' },
          { status: 400 }
        );
      }
      if (err?.code === 'CANNOT_JUDGE_OWN_REQUEST') {
        return NextResponse.json(
          { error: 'You cannot judge your own request' },
          { status: 400 }
        );
      }
      log.error('Create verdict error', err);
      return NextResponse.json(
        { error: 'Failed to submit verdict', details: err?.message },
        { status: 500 }
      );
    }

    // Determine earning based on request's target_verdict_count (tier)
    const tierConfig = getTierConfigByVerdictCount(
      (updatedRequest as any).target_verdict_count
    );
    const baseEarning = tierConfig.judgePayout;

    // Create earnings record for the judge
    const { error: earningsError } = await (supabase as any)
      .from('judge_earnings')
      .insert({
        judge_id: user.id,
        verdict_response_id: verdict.id,
        amount: baseEarning,
        payout_status: 'pending',
      });

    if (earningsError) {
      log.error('Error creating earnings record', earningsError);
      // Don't fail the request if earnings creation fails, but log it
    }

    // Update verdict response with earning amount
    await (supabase as any)
      .from('verdict_responses')
      .update({
        judge_earning: baseEarning,
      })
      .eq('id', verdict.id);

    // Create notification for the seeker
    try {
      await (supabase.rpc as any)('create_notification', {
        target_user_id: updatedRequest.user_id,
        notification_type: 'new_verdict',
        notification_title: 'New verdict received!',
        notification_message: `You've received a new verdict for your ${updatedRequest.category} request.`,
        related_type: 'verdict_request',
        related_id: request_id,
        action_label: 'View Verdict',
        action_url: `/requests/${request_id}`,
        notification_priority: 'normal',
      });
    } catch (notifError) {
      log.error('Error creating notification', notifError);
      // Don't fail if notification creation fails
    }

    // Best-effort email to seeker about verdict progress / completion
    try {
      const { data: seekerProfile } = await (supabase as any)
        .from('profiles')
        .select('email')
        .eq('id', updatedRequest.user_id)
        .single();

      const seekerEmail = (seekerProfile as any)?.email as string | undefined;
      if (seekerEmail) {
        const receivedCount = updatedRequest.received_verdict_count ?? 0;
        const targetCount = updatedRequest.target_verdict_count ?? 0;
        const emailType =
          receivedCount >= targetCount && targetCount > 0
            ? 'verdict_completed'
            : 'verdict_progress';

        void sendRequestLifecycleEmail(emailType, {
          to: seekerEmail,
          requestId: updatedRequest.id,
          title: updatedRequest.context?.slice(0, 80),
          category: updatedRequest.category,
          receivedCount,
          targetCount,
        } as any);
      }
    } catch (emailErr) {
      log.error('sendRequestLifecycleEmail error', emailErr);
    }

    return NextResponse.json({ verdict }, { status: 201 });
  } catch (error) {
    log.error('POST /api/judge/respond error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
