import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
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
      console.error('Webhook signature verification failed:', err);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('POST /api/billing/webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  const userId = session.metadata?.user_id;
  const credits = parseInt(session.metadata?.credits || '0');

  if (!userId || !credits) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update transaction status
  const { error: txError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('stripe_session_id', session.id);

  if (txError) {
    console.error('Failed to update transaction:', txError);
  }

  // Add credits to user
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profile) {
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits + credits })
      .eq('id', userId);

    if (creditError) {
      console.error('Failed to add credits:', creditError);
    }
  }

  console.log(`Added ${credits} credits to user ${userId}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  // Mark transaction as failed
  await supabase
    .from('transactions')
    .update({ status: 'failed' })
    .eq('stripe_session_id', session.id);

  console.log(`Checkout expired: ${session.id}`);
}
