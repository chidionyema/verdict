// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { trackPaymentWebhook, trackCriticalPaymentError, trackTransactionUpdate } from '@/lib/monitoring';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';
import Stripe from 'stripe';

// POST /api/billing/webhook - Stripe webhook handler
const POST_Handler = async (request: NextRequest) => {
  const startTime = Date.now();
  let eventType = 'unknown';
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      eventType = event.type;
    } catch (err) {
      const processingTime = Date.now() - startTime;
      log.error('Stripe webhook signature verification failed', err);
      trackPaymentWebhook('signature_verification', processingTime, false, { error: 'Invalid signature' });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Add detailed event logging
    log.info('Stripe webhook event received', {
      eventType: event.type,
      eventId: event.id,
      eventCreated: event.created,
      livemode: event.livemode
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.info('Payment intent succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        });
        break;
      }
      default:
        log.debug('Unhandled Stripe event type', { eventType: event.type });
    }

    const processingTime = Date.now() - startTime;
    log.info('Stripe webhook event processed successfully', {
      eventType: event.type,
      eventId: event.id,
      processingTimeMs: processingTime
    });

    trackPaymentWebhook(eventType, processingTime, true, {
      eventId: event.id,
      livemode: event.livemode
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    log.error('Stripe webhook handler failed', error, {
      eventType: eventType,
      eventId: event?.id,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

    trackPaymentWebhook(eventType, processingTime, false, {
      eventId: event?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    trackCriticalPaymentError('webhook_processing', error, {
      eventType,
      eventId: event?.id
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  // Idempotency check: Has this checkout session already been processed?
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('id, status')
    .eq('stripe_session_id', session.id)
    .single();

  if (existingTransaction?.status === 'completed') {
    log.info('Checkout session already processed, skipping', {
      sessionId: session.id,
      transactionId: existingTransaction.id
    });
    return; // Already processed successfully
  }

  const userId = session.metadata?.user_id;
  const isLegacyPackage = session.metadata?.is_legacy_package === 'true';
  const credits = parseInt(session.metadata?.credits || '0');
  const tier = session.metadata?.tier;
  const submissionType = session.metadata?.submission_type;

  // Enhanced logging for checkout completion
  log.info('Processing checkout completion', {
    sessionId: session.id,
    userId,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    isLegacyPackage,
    credits,
    tier,
    submissionType,
    paymentIntent: session.payment_intent,
    metadata: session.metadata
  });

  if (!userId) {
    log.error('Missing user_id in checkout session metadata', null, { 
      sessionId: session.id,
      metadata: session.metadata,
      severity: 'critical'
    });
    return;
  }

  if (isLegacyPackage && !credits) {
    log.error('Missing credits in legacy package checkout session', null, { 
      sessionId: session.id,
      severity: 'high'
    });
    return;
  }

  if (!isLegacyPackage && !tier && submissionType !== 'private') {
    log.error('Missing tier in pricing tier checkout session', null, { 
      sessionId: session.id,
      submissionType,
      severity: 'high'
    });
    return;
  }

  // Update transaction status
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      completed_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id);

  if (transactionError) {
    log.error('Failed to update transaction status', transactionError, { 
      sessionId: session.id,
      paymentIntent: session.payment_intent,
      severity: 'high'
    });
  } else {
    log.info('Transaction status updated successfully', {
      sessionId: session.id,
      paymentIntent: session.payment_intent
    });
    
    trackTransactionUpdate(session.id, userId, 'completed', {
      paymentIntent: session.payment_intent,
      amount: session.amount_total
    });
  }

  if (isLegacyPackage) {
    // Handle legacy credit package purchase using atomic function with full idempotency
    const { data: purchaseResult, error: purchaseError } = await (supabase.rpc as any)('process_credit_purchase', {
      p_user_id: userId,
      p_credits: credits,
      p_stripe_session_id: session.id,
      p_amount_cents: session.amount_total || 0,
      p_description: `Credit purchase: ${credits} credits`
    });

    const result = (purchaseResult as any)?.[0];
    if (purchaseError || !result?.success) {
      // CRITICAL: Payment received but credits not added - this MUST be retried
      log.error('CRITICAL: Failed to add credits after payment', purchaseError || result?.message, {
        userId,
        credits,
        sessionId: session.id,
        paymentAmount: session.amount_total,
        severity: 'critical',
        actionRequired: 'Manual credit reconciliation needed'
      });

      trackCriticalPaymentError('credit_addition_failed', purchaseError || new Error(result?.message), {
        userId,
        credits,
        sessionId: session.id,
        paymentAmount: session.amount_total
      });

      // Throw to signal Stripe to retry this webhook
      throw new Error(`Credit addition failed for session ${session.id}: ${purchaseError?.message || result?.message}`);
    } else if (result?.already_processed) {
      log.info('Credits already processed (idempotent)', {
        userId,
        credits,
        currentBalance: result.new_balance,
        sessionId: session.id
      });
    } else {
      log.info('Credits added successfully', {
        userId,
        credits,
        newBalance: result.new_balance,
        sessionId: session.id,
        paymentAmount: session.amount_total
      });

      // Create notification for user
      try {
        await (supabase.rpc as any)('create_notification', {
          p_user_id: userId,
          p_type: 'credit_purchase',
          p_title: 'Credits Added!',
          p_message: `${credits} credits have been added to your account.`,
          p_metadata: JSON.stringify({
            credits,
            new_balance: result.new_balance,
            stripe_session_id: session.id
          })
        });
      } catch (notifError) {
        log.warn('Failed to create credit purchase notification', { error: notifError, userId });
      }
    }
  } else if (submissionType === 'private') {
    // Handle private submission payment - no tier upgrade needed
    log.info('Private submission payment completed', {
      userId,
      sessionId: session.id,
      paymentAmount: session.amount_total,
      submissionQuestion: session.metadata?.submission_question
    });
  } else {
    // Handle pricing tier upgrade
    const { error: tierError } = await (supabase
      .from('profiles') as ReturnType<typeof supabase.from>)
      .update({ pricing_tier: tier } as Record<string, unknown>)
      .eq('id', userId);

    if (tierError) {
      log.error('Failed to upgrade tier', tierError, { 
        userId, 
        tier, 
        sessionId: session.id,
        severity: 'high'
      });
    } else {
      log.info('Tier upgraded successfully', { 
        userId, 
        tier, 
        sessionId: session.id,
        paymentAmount: session.amount_total
      });
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  // Mark transaction as failed
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: 'failed',
      failure_reason: 'checkout_session_expired',
      failed_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id);

  if (updateError) {
    log.error('Failed to mark transaction as expired', updateError, {
      sessionId: session.id,
      severity: 'medium'
    });
  }

  log.info('Checkout session expired', { 
    sessionId: session.id,
    userId: session.metadata?.user_id,
    amountTotal: session.amount_total,
    expiresAt: session.expires_at
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServiceClient();

  // Find and update transaction by payment intent
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message || 'payment_failed',
      failed_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  log.error('Payment intent failed', paymentIntent.last_payment_error, {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    failureCode: paymentIntent.last_payment_error?.code,
    failureMessage: paymentIntent.last_payment_error?.message,
    severity: 'high',
    updateError: updateError || null
  });
}

export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
