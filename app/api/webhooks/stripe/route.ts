// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const metadata = session.metadata;
  if (!metadata?.type || !metadata?.user_id) return;

  if (metadata.type === 'credit_purchase') {
    const credits = parseInt(metadata.credits || '0');
    const userId = metadata.user_id;

    // Add credits to user profile
    await supabase
      .from('profiles')
      .update({ credits: supabase.raw(`credits + ${credits}`) })
      .eq('id', userId);

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent,
        credits_delta: credits,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

  } else if (metadata.type === 'subscription') {
    // Subscription will be handled by subscription.created event
    console.log('Subscription checkout completed, waiting for subscription.created event');
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // Update transaction with successful payment
  await supabase
    .from('transactions')
    .update({
      status: 'completed',
      net_amount_cents: paymentIntent.amount_received,
      processing_fee_cents: paymentIntent.application_fee_amount || 0,
      receipt_url: paymentIntent.charges.data[0]?.receipt_url,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  // Handle subscription renewal
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  // Process subscription renewal
  await supabase.rpc('process_subscription_renewal', {
    subscription_id: subscription.metadata?.subscription_db_id,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  // Update subscription status
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      next_payment_attempt: invoice.next_payment_attempt ? 
        new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const planId = subscription.items.data[0]?.price.id;
  
  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', planId)
    .single();

  if (!plan) return;

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_id: planId,
      plan_name: plan.name,
      plan_price_cents: plan.price_cents,
      billing_interval: plan.billing_interval,
      monthly_credits: plan.monthly_credits,
      bonus_features: plan.bonus_features,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start ? 
        new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? 
        new Date(subscription.trial_end * 1000).toISOString() : null,
    });

  // Add initial credits if not in trial
  if (!subscription.trial_start) {
    await supabase
      .from('profiles')
      .update({ credits: supabase.raw(`credits + ${plan.monthly_credits}`) })
      .eq('id', userId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at ? 
        new Date(subscription.canceled_at * 1000).toISOString() : null,
      ended_at: subscription.ended_at ? 
        new Date(subscription.ended_at * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleConnectAccountUpdated(account: Stripe.Account, supabase: any) {
  await supabase
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

async function handleTransferCreated(transfer: Stripe.Transfer, supabase: any) {
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