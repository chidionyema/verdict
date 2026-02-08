import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { getPricingConfig } from '@/lib/pricing-config';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/submit/payment - Create Stripe checkout for direct submission payment
async function POST_Handler(request: NextRequest) {
  const operationId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();

    log.info('Creating submission payment checkout', {
      operationId,
      timestamp: new Date().toISOString()
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.error('Authentication failed for submission payment', authError, {
        operationId,
        severity: 'medium'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionData } = body;

    log.info('Processing submission payment request', {
      userId: user.id,
      operationId,
      hasSubmissionData: !!submissionData,
      questionLength: submissionData?.question?.length || 0,
      category: submissionData?.category
    });

    if (!submissionData || !submissionData.question) {
      log.error('Invalid submission data provided', null, {
        operationId,
        userId: user.id,
        submissionData: submissionData,
        severity: 'medium'
      });
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    const pricing = getPricingConfig();
    const priceInCents = pricing.private_submission.gbp.amount * 100; // Convert to pence

    // Demo mode - simulate successful payment
    if (isDemoMode() || !stripe) {
      const mode = isDemoMode() ? 'demo mode' : 'Stripe not configured';
      return NextResponse.json({
        demo: true,
        message: `Payment simulated (${mode})`,
        success: true,
        submissionData
      });
    }

    // Real Stripe checkout
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
    if (!origin) {
      log.error('No origin header and NEXT_PUBLIC_APP_URL not configured', null, {
        operationId,
        severity: 'high'
      });
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Private Feedback Submission',
              description: `Get 3 anonymous feedback reports: "${submissionData.question.slice(0, 50)}${submissionData.question.length > 50 ? '...' : ''}"`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        submission_type: 'private',
        submission_question: submissionData.question.slice(0, 100),
        submission_category: submissionData.category || 'general',
        operation_id: operationId,
        created_at: new Date().toISOString()
      },
      success_url: `${origin}/submit-unified?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/submit-unified?step=payment&canceled=true`,
    });

    const processingTime = Date.now() - startTime;
    log.info('Stripe checkout session created successfully', {
      operationId,
      userId: user.id,
      sessionId: session.id,
      amount: priceInCents,
      currency: 'gbp',
      processingTimeMs: processingTime,
      category: submissionData.category
    });

    return NextResponse.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const isError = error instanceof Error;
    const message = isError ? error.message : 'Unknown error';

    log.error('Submission payment creation failed', error, {
      operationId,
      processingTimeMs: processingTime,
      errorMessage: message,
      timestamp: new Date().toISOString(),
      severity: 'high',
      actionRequired: 'Investigate payment creation failure'
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        support_id: operationId, // Provide support ID for user reference
        details: process.env.NODE_ENV === 'production' ? undefined : message,
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to payment endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);