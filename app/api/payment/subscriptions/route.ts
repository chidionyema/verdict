import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any,
  });
};

const cancelSubscriptionSchema = z.object({
  subscription_id: z.string().uuid(),
  cancel_immediately: z.boolean().optional(),
});

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscriptions, error } = await (supabase as any)
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
      log.error('Error fetching subscriptions', error, { userId: user.id });
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Get Stripe subscription details for active subscriptions
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub: any) => {
        if (sub.status === 'active' || sub.status === 'trialing') {
          try {
            const stripeSub = await getStripe().subscriptions.retrieve(
              sub.stripe_subscription_id as string
            );
            return {
              ...sub,
              stripe_details: {
                current_period_start: new Date(
                  (stripeSub as any).current_period_start * 1000
                ),
                current_period_end: new Date(
                  (stripeSub as any).current_period_end * 1000
                ),
                status: (stripeSub as any).status,
                cancel_at_period_end: (stripeSub as any).cancel_at_period_end,
              },
            };
          } catch (stripeError) {
            log.warn('Failed to fetch Stripe subscription details', { error: stripeError, subscriptionId: sub.id });
            return sub as any;
          }
        }
        return sub as any;
      })
    );

    return NextResponse.json({ subscriptions: enrichedSubscriptions });
  } catch (error) {
    log.error('Subscriptions error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function DELETE_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = cancelSubscriptionSchema.parse(body);

    // Validate subscription_id as UUID (already validated by zod, but double-check)
    if (!isValidUUID(validated.subscription_id)) {
      return NextResponse.json({ error: 'Invalid subscription ID format' }, { status: 400 });
    }

    // Get subscription details
    const { data: subscription, error: subError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('id', validated.subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if ((subscription as any).status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Cancel subscription in Stripe
    const canceledSub = await getStripe().subscriptions.update(
      (subscription as any).stripe_subscription_id,
      {
        cancel_at_period_end: !validated.cancel_immediately,
        ...(validated.cancel_immediately && { cancel_at: Math.floor(Date.now() / 1000) }),
      }
    );

    // Update subscription in database
    const { error } = await (supabase as any)
      .from('subscriptions')
      .update({
        status: validated.cancel_immediately ? 'canceled' : (subscription as any).status,
        canceled_at: new Date().toISOString(),
        ...(validated.cancel_immediately && { ended_at: new Date().toISOString() }),
      })
      .eq('id', validated.subscription_id);

    if (error) {
      log.error('Error updating subscription', error, { userId: user.id, subscriptionId: validated.subscription_id });
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: validated.cancel_immediately 
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at the end of the billing period',
      cancels_at: validated.cancel_immediately
        ? new Date()
        : new Date((canceledSub as any).current_period_end * 1000),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Subscription cancellation error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function PATCH_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, action } = body;

    if (!subscription_id || !action) {
      return NextResponse.json({ error: 'Subscription ID and action required' }, { status: 400 });
    }

    // Validate subscription_id as UUID
    if (!isValidUUID(subscription_id)) {
      return NextResponse.json({ error: 'Invalid subscription ID format' }, { status: 400 });
    }

    // Get subscription details
    const { data: subscription, error: subError } = await (supabase as any)
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
        if ((subscription as any).status !== 'canceled') {
          return NextResponse.json({ error: 'Subscription is not canceled' }, { status: 400 });
        }

        // Reactivate subscription in Stripe
        result = await getStripe().subscriptions.update(
          (subscription as any).stripe_subscription_id,
          {
            cancel_at_period_end: false,
          }
        );

        // Update in database
        await (supabase as any)
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
    log.error('Subscription update error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to subscription endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const DELETE = withRateLimit(DELETE_Handler, rateLimitPresets.strict);
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);