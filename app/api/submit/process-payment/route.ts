import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { createVerdictRequest } from '@/lib/verdicts';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/submit/process-payment - Process submission after successful payment
async function POST_Handler(request: NextRequest) {
  const startTime = Date.now();
  const operationId = Math.random().toString(36).substring(2, 15);

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { session_id } = body;

    log.info('Processing payment submission', {
      sessionId: session_id,
      operationId,
      timestamp: new Date().toISOString()
    });

    if (!session_id) {
      log.error('Missing session ID in payment processing request', null, {
        operationId,
        body: body,
        severity: 'medium'
      });
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // In demo mode, just return success
    if (isDemoMode() || !stripe) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo mode - submission would be processed'
      });
    }

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    log.info('Stripe session retrieved', {
      sessionId: session_id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      operationId
    });

    if (session.payment_status !== 'paid') {
      log.error('Payment not completed for session', null, {
        sessionId: session_id,
        paymentStatus: session.payment_status,
        operationId,
        severity: 'high'
      });
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      log.error('User ID not found in session metadata', null, {
        sessionId: session_id,
        metadata: session.metadata,
        operationId,
        severity: 'critical'
      });
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Get user details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      log.error('Authorization failed for payment processing', authError, {
        sessionId: session_id,
        requestedUserId: userId,
        actualUserId: user?.id,
        operationId,
        severity: 'high'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract submission data from session metadata
    const submissionQuestion = session.metadata?.submission_question || 'Private submission';
    const submissionCategory = (session.metadata?.submission_category as 'appearance' | 'profile' | 'writing' | 'decision') || 'decision';

    // IDEMPOTENCY CHECK: Check if this session already has a processed request
    if (session.metadata?.processed_request_id) {
      log.info('Session already processed - returning existing request', {
        sessionId: session_id,
        existingRequestId: session.metadata.processed_request_id,
        operationId
      });
      return NextResponse.json({
        success: true,
        request_id: session.metadata.processed_request_id,
        message: 'Submission already exists',
        idempotent: true
      });
    }

    // Additional idempotency: Check if a request exists for this session in our database
    const { data: existingRequest } = await (supabase as any)
      .from('verdict_requests')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingRequest) {
      log.info('Found existing request for session in database', {
        sessionId: session_id,
        existingRequestId: existingRequest.id,
        operationId
      });
      return NextResponse.json({
        success: true,
        request_id: existingRequest.id,
        message: 'Submission already exists',
        idempotent: true
      });
    }

    log.info('Creating verdict request for paid submission', {
      sessionId: session_id,
      userId: user.id,
      category: submissionCategory,
      questionLength: submissionQuestion.length,
      operationId
    });

    // Create the verdict request with retry logic
    let createdRequest;
    let lastError;
    const maxRetries = 3;

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        const result = await createVerdictRequest(
          supabase as any,
          {
            userId: user.id,
            email: user.email || null,
            category: submissionCategory,
            subcategory: null,
            media_type: 'text',
            media_url: null,
            text_content: submissionQuestion,
            context: submissionQuestion,
            requestedTone: 'honest',
            roastMode: false,
            visibility: 'private',
            creditsToCharge: 0, // No credits charged for paid submissions
            targetVerdictCount: 3,
          }
        );
        createdRequest = result.request;
        break; // Success, exit retry loop
      } catch (err) {
        lastError = err;
        log.error('Verdict request creation attempt failed', err, {
          sessionId: session_id,
          retryCount,
          maxRetries,
          operationId
        });

        // Wait before retrying (exponential backoff)
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
    }

    // If all retries failed, initiate refund
    if (!createdRequest) {
      log.error('All retry attempts failed - initiating refund', lastError, {
        sessionId: session_id,
        operationId,
        severity: 'critical',
        actionRequired: 'Automatic refund initiated'
      });

      // Attempt automatic refund
      try {
        const paymentIntentId = session.payment_intent as string;
        if (paymentIntentId) {
          await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              reason: 'submission_creation_failed',
              operation_id: operationId,
              session_id: session_id
            }
          });

          log.info('Automatic refund issued successfully', {
            sessionId: session_id,
            paymentIntentId,
            operationId
          });

          return NextResponse.json({
            error: 'Submission failed but your payment has been refunded automatically.',
            refunded: true,
            support_id: operationId
          }, { status: 500 });
        }
      } catch (refundError) {
        log.error('Automatic refund failed - manual intervention required', refundError, {
          sessionId: session_id,
          operationId,
          severity: 'critical',
          actionRequired: 'Manual refund required'
        });
      }

      return NextResponse.json({
        error: 'Submission failed. Please contact support for a refund.',
        support_id: operationId
      }, { status: 500 });
    }

    // Store the request ID in Stripe session metadata for future idempotency
    try {
      await stripe.checkout.sessions.update(session_id, {
        metadata: {
          ...session.metadata,
          processed_request_id: createdRequest.id
        }
      } as any);
    } catch (updateError) {
      // Non-critical - just log and continue
      log.error('Failed to update session metadata with request ID', updateError, {
        sessionId: session_id,
        requestId: createdRequest.id,
        operationId
      });
    }

    // Store session ID in the request for database-level idempotency
    try {
      await (supabase as any)
        .from('verdict_requests')
        .update({ stripe_session_id: session_id })
        .eq('id', createdRequest.id);
    } catch (updateError) {
      // Non-critical - just log
      log.error('Failed to store session ID in request', updateError, {
        sessionId: session_id,
        requestId: createdRequest.id,
        operationId
      });
    }

    const processingTime = Date.now() - startTime;
    log.info('Payment processing completed successfully', {
      sessionId: session_id,
      userId: user.id,
      requestId: createdRequest.id,
      processingTimeMs: processingTime,
      operationId
    });

    return NextResponse.json({
      success: true,
      request_id: createdRequest.id,
      message: 'Submission created successfully'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log.error('Payment processing failed', error, {
      operationId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      actionRequired: 'Investigate payment processing failure'
    });

    return NextResponse.json(
      {
        error: 'Failed to process submission',
        support_id: operationId
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to payment processing endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
