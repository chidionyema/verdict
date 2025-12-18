// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import Stripe from 'stripe';

// POST /api/billing/webhook - Stripe webhook handler
export async function POST(request: NextRequest) {
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
    } catch (err) {
      log.error('Stripe webhook signature verification failed', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

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
      default:
        log.debug('Unhandled Stripe event type', { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('Stripe webhook handler failed', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  const userId = session.metadata?.user_id;
  const isLegacyPackage = session.metadata?.is_legacy_package === 'true';
  const credits = parseInt(session.metadata?.credits || '0');
  const tier = session.metadata?.tier;

  if (!userId) {
    log.error('Missing user_id in checkout session metadata', null, { sessionId: session.id });
    return;
  }

  if (isLegacyPackage && !credits) {
    log.error('Missing credits in legacy package checkout session', null, { sessionId: session.id });
    return;
  }

  if (!isLegacyPackage && !tier) {
    log.error('Missing tier in pricing tier checkout session', null, { sessionId: session.id });
    return;
  }

  // Update transaction status
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('stripe_session_id', session.id);

  if (transactionError) {
    log.error('Failed to update transaction status', transactionError, { sessionId: session.id });
  }

  if (isLegacyPackage) {
    // Handle legacy credit package purchase
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single() as { data: { credits: number } | null };

    if (profile) {
      const { error: creditError } = await (supabase
        .from('profiles') as ReturnType<typeof supabase.from>)
        .update({ credits: profile.credits + credits } as Record<string, unknown>)
        .eq('id', userId);

      if (creditError) {
        log.error('Failed to add credits', creditError, { userId, credits });
      } else {
        log.info('Credits added successfully', { userId, credits, sessionId: session.id });
      }
    }
  } else {
    // Handle pricing tier upgrade
    const { error: tierError } = await (supabase
      .from('profiles') as ReturnType<typeof supabase.from>)
      .update({ pricing_tier: tier } as Record<string, unknown>)
      .eq('id', userId);

    if (tierError) {
      log.error('Failed to upgrade tier', tierError, { userId, tier });
    } else {
      log.info('Tier upgraded successfully', { userId, tier, sessionId: session.id });
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  // Mark transaction as failed
  await supabase
    .from('transactions')
    .update({ status: 'failed' })
    .eq('stripe_session_id', session.id);

  log.info('Checkout session expired', { sessionId: session.id });
}
