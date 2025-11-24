import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const cancelSubscriptionSchema = z.object({
  subscription_id: z.string().uuid(),
  cancel_immediately: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          description,
          features,
          stripe_price_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Get Stripe subscription details for active subscriptions
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        if (sub.status === 'active' || sub.status === 'trialing') {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            return {
              ...sub,
              stripe_details: {
                current_period_start: new Date(stripeSub.current_period_start * 1000),
                current_period_end: new Date(stripeSub.current_period_end * 1000),
                status: stripeSub.status,
                cancel_at_period_end: stripeSub.cancel_at_period_end,
              },
            };
          } catch (stripeError) {
            console.warn('Failed to fetch Stripe subscription details:', stripeError);
            return sub;
          }
        }
        return sub;
      })
    );

    return NextResponse.json({ subscriptions: enrichedSubscriptions });
  } catch (error) {
    console.error('Subscriptions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = cancelSubscriptionSchema.parse(body);

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', validated.subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Cancel subscription in Stripe
    const canceledSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: !validated.cancel_immediately,
      ...(validated.cancel_immediately && { cancel_at: 'now' }),
    });

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: validated.cancel_immediately ? 'canceled' : subscription.status,
        canceled_at: new Date().toISOString(),
        ...(validated.cancel_immediately && { ended_at: new Date().toISOString() }),
      })
      .eq('id', validated.subscription_id);

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: validated.cancel_immediately 
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at the end of the billing period',
      cancels_at: validated.cancel_immediately 
        ? new Date() 
        : new Date(canceledSub.current_period_end * 1000),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, action } = body;

    if (!subscription_id || !action) {
      return NextResponse.json({ error: 'Subscription ID and action required' }, { status: 400 });
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'reactivate':
        if (subscription.status !== 'canceled') {
          return NextResponse.json({ error: 'Subscription is not canceled' }, { status: 400 });
        }

        // Reactivate subscription in Stripe
        result = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        // Update in database
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            canceled_at: null,
          })
          .eq('id', subscription_id);

        return NextResponse.json({
          success: true,
          message: 'Subscription reactivated',
        });

      case 'pause':
        // Pause subscription (this might require custom implementation depending on needs)
        return NextResponse.json({ error: 'Subscription pausing not implemented' }, { status: 501 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}