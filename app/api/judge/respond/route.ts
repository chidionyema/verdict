import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateFeedback, validateQuickFeedback, validateRating, validateTone } from '@/lib/validations';
import { getTierConfig, TIER_CONFIGURATIONS } from '@/lib/pricing/dynamic-pricing';
import { addJudgeVerdict } from '@/lib/verdicts';
import { verdictRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { sendRequestLifecycleEmail } from '@/lib/notifications';
import { sendJudgeEarningEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/judge/respond - Submit a verdict
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

    // SECURITY: Require email verification before submitting verdicts
    // This ensures we can contact judges for payouts and platform communications
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: 'Email verification required',
          message: 'Please verify your email address before submitting verdicts. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      );
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

    // Auto-enable judging for authenticated users
    // The is_judge flag is for verified/expert judges, not required for basic reviewing
    // Anyone can review submissions and earn credits
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    // If user isn't marked as judge yet, mark them (first-time reviewer)
    if (profile && !profile.is_judge) {
      await (supabase as any)
        .from('profiles')
        .update({ is_judge: true })
        .eq('id', user.id);
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

    // First, get the request to check its type (public vs private)
    const { data: targetRequest, error: requestCheckError } = await (supabase as any)
      .from('verdict_requests')
      .select('visibility, request_tier')
      .eq('id', request_id)
      .single();

    if (requestCheckError || !targetRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Use quick validation for public/community requests, strict for private/paid
    const isQuickFeedbackAllowed = targetRequest.visibility === 'public' ||
                                    targetRequest.request_tier === 'community';
    const feedbackValidation = isQuickFeedbackAllowed
      ? validateQuickFeedback(feedback)
      : validateFeedback(feedback);

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

    // Determine earning based on request's tier (stored on request, not calculated)
    // Use request_tier if available, fallback to community tier
    const requestTier = (updatedRequest as any).request_tier || 'community';
    let tierConfig;
    try {
      tierConfig = getTierConfig(requestTier);
    } catch {
      // Fallback to community if tier not found
      tierConfig = TIER_CONFIGURATIONS.community;
    }

    // Calculate judge payout (convert cents to dollars)
    const baseEarning = tierConfig.judge_payout_cents / 100;

    // Only create earnings if amount is positive
    let earningsData = null;
    let earningsError = null;
    let isNewEarning = false;

    if (baseEarning <= 0) {
      log.warn('Zero earning calculated for verdict - skipping earnings record', {
        verdictId: verdict.id,
        requestTier,
        tierConfig: tierConfig.id,
        judge_payout_cents: tierConfig.judge_payout_cents
      });
    } else {
      // Create earnings record for the judge - use upsert to prevent duplicate earnings
      // The verdict_response_id should be unique, preventing race condition duplicates
      const result = await (supabase as any)
        .from('judge_earnings')
        .upsert({
          judge_id: user.id,
          verdict_response_id: verdict.id,
          amount: baseEarning,
          currency: 'USD',
          payout_status: 'pending',
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'verdict_response_id', // Prevent duplicate earnings for same verdict
          ignoreDuplicates: true
        })
        .select()
        .single();

      earningsData = result.data;
      earningsError = result.error;
      isNewEarning = !earningsError && earningsData;
    }

    if (earningsError) {
      // Check if it's a duplicate - that's OK (idempotent)
      if (!earningsError.message?.includes('duplicate') &&
          earningsError.code !== '23505') {
        log.error('Error creating earnings record', earningsError);
      }
      // Don't fail the request if earnings creation fails
    } else {
      log.info('Judge earnings created', {
        judgeId: user.id,
        verdictId: verdict.id,
        amount: baseEarning,
        tier: requestTier
      });
    }

    // Update verdict response with earning amount (for display purposes)
    await (supabase as any)
      .from('verdict_responses')
      .update({
        judge_earning: baseEarning,
      })
      .eq('id', verdict.id);

    // Create notification for the JUDGE about their earnings (only if new earning)
    if (isNewEarning && baseEarning > 0) {
      try {
        await (supabase.rpc as any)('create_notification', {
          p_user_id: user.id,
          p_type: 'earning_credited',
          p_title: 'Earnings Added!',
          p_message: `You earned $${baseEarning.toFixed(2)} for your verdict on a ${updatedRequest.category} request.`,
          p_metadata: JSON.stringify({
            amount: baseEarning,
            verdict_id: verdict.id,
            request_id: request_id,
            category: updatedRequest.category,
            action_url: '/judge/earnings'
          })
        });
      } catch (judgeNotifError) {
        log.warn('Failed to create judge earnings notification', { error: judgeNotifError, judgeId: user.id });
        // Don't fail if notification creation fails
      }

      // Send email notification to judge about earnings (best-effort)
      try {
        const { data: judgeProfile } = await (supabase as any)
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        const judgeEmail = (judgeProfile as any)?.email as string | undefined;
        if (judgeEmail) {
          void sendJudgeEarningEmail(
            judgeEmail,
            `$${baseEarning.toFixed(2)}`,
            updatedRequest.category,
            verdict.id
          );
        }
      } catch (emailErr) {
        log.warn('Failed to send judge earnings email', { error: emailErr, judgeId: user.id });
        // Don't fail if email fails
      }
    }

    // Create notification for the SEEKER about new verdict
    const receivedCount = updatedRequest.received_verdict_count ?? 0;
    const targetCount = updatedRequest.target_verdict_count ?? 0;
    const isComplete = receivedCount >= targetCount && targetCount > 0;

    try {
      if (isComplete) {
        // Send celebration notification for completion
        await (supabase.rpc as any)('create_notification', {
          p_user_id: updatedRequest.user_id,
          p_type: 'all_verdicts_complete',
          p_title: 'All verdicts are in!',
          p_message: `Great news! All ${targetCount} verdicts for your ${updatedRequest.category} request are ready. View your complete results now!`,
          p_metadata: JSON.stringify({
            request_id: request_id,
            action_url: `/requests/${request_id}`,
            action_label: 'View Results',
            priority: 'high',
            celebration: true
          })
        });
      } else {
        // Send regular new verdict notification
        await (supabase.rpc as any)('create_notification', {
          p_user_id: updatedRequest.user_id,
          p_type: 'new_verdict',
          p_title: 'New verdict received!',
          p_message: `You've received verdict ${receivedCount} of ${targetCount} for your ${updatedRequest.category} request.`,
          p_metadata: JSON.stringify({
            request_id: request_id,
            action_url: `/requests/${request_id}`,
            action_label: 'View Verdict',
            priority: 'normal'
          })
        });
      }
    } catch (notifError) {
      log.error('Error creating seeker notification', notifError);
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

export const POST = withRateLimit(POST_Handler, rateLimitPresets.judge);
