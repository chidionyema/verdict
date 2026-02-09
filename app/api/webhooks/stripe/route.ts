import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { log } from '@/lib/logger';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any,
  });
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Database-level webhook replay protection (serverless-safe)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = (await headers()).get('stripe-signature');

    if (!sig) {
      log.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!endpointSecret) {
      log.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      log.error('Webhook signature verification failed', err, { 
        message: err.message,
        signature: sig.substring(0, 20) + '...' // Log partial signature for debugging
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    // Database-level replay protection (atomic operation)
    const { data: isNewEvent } = await (supabase as any).rpc('process_webhook_event', {
      p_event_id: event.id,
      p_event_type: event.type
    });

    if (!isNewEvent) {
      log.warn('Webhook replay attack detected', { eventId: event.id, type: event.type });
      return NextResponse.json({ error: 'Event already processed' }, { status: 200 }); // Return 200 to prevent retries
    }

    // Validate event timestamp (prevent old event replay)
    const eventTime = event.created * 1000; // Convert to milliseconds
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (now - eventTime > maxAge) {
      log.warn('Webhook event too old', { eventId: event.id, age: now - eventTime });
      return NextResponse.json({ error: 'Event too old' }, { status: 400 });
    }

    // Process webhook with timeout protection (prevent hanging operations)
    const WEBHOOK_TIMEOUT = 25000; // 25 seconds (Vercel has 30s limit)
    
    try {
      await Promise.race([
        processWebhookEvent(event, supabase),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Webhook processing timeout')), WEBHOOK_TIMEOUT)
        )
      ]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Webhook processing timeout') {
        log.error('Webhook processing timeout', null, { 
          eventId: event.id, 
          eventType: event.type,
          timeout: WEBHOOK_TIMEOUT 
        });
        return NextResponse.json({ error: 'Processing timeout' }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('Webhook processing failed', error, { eventId: (event as any)?.id });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhookEvent(event: any, supabase: any) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'account.updated':
        await handleConnectAccountUpdated(event.data.object as Stripe.Account, supabase);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer, supabase);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object as Stripe.Transfer, supabase);
        break;

      default:
        log.info('Unhandled webhook event type', { eventType: event.type });
    }
  }

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const metadata = session.metadata;

  // Determine if this is a credit purchase (support both metadata patterns)
  // Pattern 1: type: 'credit_purchase' (from /api/payment/checkout)
  // Pattern 2: is_legacy_package: 'true' (from /api/billing/create-checkout-session)
  const isCreditPurchase = metadata?.type === 'credit_purchase' ||
                           metadata?.is_legacy_package === 'true';
  const credits = parseInt(metadata?.credits || '0');
  const userId = metadata?.user_id;

  // Handle credit purchases
  if (isCreditPurchase && userId && credits > 0) {
    log.info('Processing credit purchase', {
      sessionId: session.id,
      userId,
      credits,
      amountCents: session.amount_total,
      metadataPattern: metadata?.type ? 'type' : 'is_legacy_package'
    });

    // Use atomic RPC that handles idempotency, credit addition, and audit logging
    const { data: purchaseResult, error: purchaseError } = await supabase.rpc('process_credit_purchase', {
      p_user_id: userId,
      p_credits: credits,
      p_stripe_session_id: session.id,
      p_amount_cents: session.amount_total || 0,
      p_description: `Credit purchase: ${credits} credits`
    });

    if (purchaseError) {
      log.error('CRITICAL: Credit purchase processing failed', purchaseError, {
        sessionId: session.id,
        userId,
        credits,
        amount: session.amount_total
      });
      // Throw to signal Stripe to retry this webhook
      throw new Error(`Credit purchase failed for session ${session.id}: ${purchaseError.message}`);
    }

    const result = purchaseResult?.[0];
    if (!result?.success) {
      log.error('Credit purchase failed', null, {
        message: result?.message,
        sessionId: session.id,
        userId,
        credits
      });
      throw new Error(`Credit purchase failed: ${result?.message}`);
    }

    if (result?.already_processed) {
      log.info('Credit purchase already processed (idempotent)', {
        sessionId: session.id,
        userId,
        currentBalance: result?.new_balance
      });
    } else {
      log.info('Credits added successfully', {
        sessionId: session.id,
        userId,
        credits,
        newBalance: result?.new_balance,
        amount: session.amount_total
      });

      // Create notification for user
      try {
        await supabase.rpc('create_notification', {
          p_user_id: userId,
          p_type: 'credit_purchase',
          p_title: 'Credits Added!',
          p_message: `${credits} credits have been added to your account.`,
          p_metadata: JSON.stringify({
            credits,
            new_balance: result?.new_balance,
            stripe_session_id: session.id
          })
        });
      } catch (notifError) {
        // Non-critical - log but don't fail
        log.warn('Failed to create credit purchase notification', { error: notifError, userId });
      }
    }
    return;
  }

  // Handle subscription checkouts
  if (metadata?.type === 'subscription') {
    log.info('Subscription checkout completed, waiting for subscription.created event', { sessionId: session.id });
    return;
  }

  // Handle private submission payments (no credits, just payment confirmation)
  if (metadata?.submission_type === 'private' && userId) {
    log.info('Private submission payment completed', {
      sessionId: session.id,
      userId,
      amount: session.amount_total
    });
    return;
  }

  // Log unhandled checkout sessions for debugging
  if (metadata) {
    log.warn('Unhandled checkout session type', {
      sessionId: session.id,
      metadata,
      paymentStatus: session.payment_status
    });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  // Update transaction with successful payment (CRITICAL: Must succeed for financial reconciliation)
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      net_amount_cents: paymentIntent.amount_received,
      processing_fee_cents: paymentIntent.application_fee_amount || 0,
      receipt_url: (paymentIntent as any).charges.data[0]?.receipt_url,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
    
  if (updateError) {
    log.error('CRITICAL: Payment intent transaction update failed', updateError, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount_received
    });
    // This could lead to reconciliation issues - alert immediately
    throw new Error(`Payment transaction update failed: ${updateError.message}`);
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  // Update transaction with failure
  await supabase
    .from('transactions')
    .update({
      status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  if (!(invoice as any).subscription) return;

  // Handle subscription renewal
  const subscription = await getStripe().subscriptions.retrieve(
    (invoice as any).subscription as string
  );

  if (!subscription.metadata?.subscription_db_id) {
    log.error('Subscription missing database ID in metadata', null, { subscriptionId: subscription.id });
    return;
  }

  // Process subscription renewal atomically
  const { data: renewalResult, error: renewalError } = await supabase.rpc('process_subscription_renewal', {
    p_subscription_id: subscription.metadata.subscription_db_id,
  });

  if (renewalError) {
    log.error('Failed to process subscription renewal', renewalError, { subscriptionDbId: subscription.metadata.subscription_db_id });
    return;
  }

  const result = renewalResult?.[0];
  if (!result?.success) {
    log.error('Subscription renewal failed', null, { message: result?.message, subscriptionDbId: subscription.metadata.subscription_db_id });
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  if (!(invoice as any).subscription) return;

  // Update subscription status
  const subscription = await getStripe().subscriptions.retrieve(
    (invoice as any).subscription as string
  );
  
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      next_payment_attempt: invoice.next_payment_attempt ? 
        new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const planId = subscription.items.data[0]?.price.id;
  
  // Get plan details
  const { data: plan } = await (supabase as any)
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', planId)
    .single();

  if (!plan) return;

  // Create subscription record
  await (supabase as any)
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_id: planId,
      plan_name: (plan as any).name,
      plan_price_cents: (plan as any).price_cents,
      billing_interval: (plan as any).billing_interval,
      monthly_credits: (plan as any).monthly_credits,
      bonus_features: (plan as any).bonus_features,
      status: subscription.status,
      current_period_start: new Date(
        (subscription as any).current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      trial_start: subscription.trial_start ? 
        new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? 
        new Date(subscription.trial_end * 1000).toISOString() : null,
    });

  // Add initial credits atomically if not in trial
  if (!subscription.trial_start && (plan as any).monthly_credits > 0) {
    const { data: addResult, error: addError } = await (supabase as any).rpc(
      'add_credits',
      {
        p_user_id: userId,
        p_credits: (plan as any).monthly_credits,
      }
    );

    if (addError) {
      log.error('Failed to add subscription credits', addError, { userId, credits: (plan as any).monthly_credits });
    } else {
      const result = (addResult as any)?.[0];
      if (!result?.success) {
        log.error('Subscription credit addition failed', null, { message: result?.message, userId, credits: (plan as any).monthly_credits });
      }
    }
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  await (supabase as any)
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(
        (subscription as any).current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      ended_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleConnectAccountUpdated(
  account: Stripe.Account,
  supabase: any
) {
  await (supabase as any)
    .from('judge_payout_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      verification_status: account.details_submitted ? 'verified' : 'pending',
    })
    .eq('stripe_account_id', account.id);
}

async function handleTransferCreated(
  transfer: Stripe.Transfer,
  supabase: any
) {
  const payoutId = transfer.metadata?.payout_id;
  if (!payoutId) return;

  await supabase
    .from('payouts')
    .update({
      stripe_transfer_id: transfer.id,
      status: 'processing',
      processing_started_at: new Date().toISOString(),
    })
    .eq('id', payoutId);
}

async function handleTransferUpdated(transfer: Stripe.Transfer, supabase: any) {
  let status = 'processing';
  let completedAt = null;
  let failedAt = null;
  let failureReason = null;

  if (transfer.reversed) {
    status = 'reversed';
    failedAt = new Date().toISOString();
    failureReason = 'Transfer was reversed';
  } else if (transfer.amount_reversed > 0) {
    status = 'reversed';
    failedAt = new Date().toISOString();
    failureReason = 'Partial reversal occurred';
  } else {
    // For successful transfers, we need to check if it's been processed
    // This is a simplified check - in practice you might want to verify with Stripe
    status = 'paid';
    completedAt = new Date().toISOString();
  }

  await supabase
    .from('payouts')
    .update({
      status,
      completed_at: completedAt,
      failed_at: failedAt,
      failure_reason: failureReason,
    })
    .eq('stripe_transfer_id', transfer.id);
}