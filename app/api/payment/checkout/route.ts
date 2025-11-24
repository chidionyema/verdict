// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import Stripe from 'stripe';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
};

const checkoutSchema = z.object({
  type: z.enum(['credit_purchase', 'subscription']),
  package_id: z.string().uuid().optional(),
  plan_id: z.string().optional(),
  payment_method_id: z.string().uuid().optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId: string;
    
    const existingCustomers = await getStripe().customers.list({
      email: profile.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await getStripe().customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (validated.type === 'credit_purchase') {
      if (!validated.package_id) {
        return NextResponse.json({ error: 'Package ID required for credit purchase' }, { status: 400 });
      }

      // Get credit package details
      const { data: creditPackage, error: packageError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', validated.package_id)
        .eq('is_active', true)
        .single();

      if (packageError || !creditPackage) {
        return NextResponse.json({ error: 'Credit package not found' }, { status: 404 });
      }

      sessionConfig = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: creditPackage.name,
                description: creditPackage.description || `${creditPackage.credits} verdict credits`,
                metadata: {
                  type: 'credit_package',
                  package_id: creditPackage.id,
                  credits: creditPackage.credits.toString(),
                },
              },
              unit_amount: creditPackage.price_cents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'credit_purchase',
          user_id: user.id,
          package_id: creditPackage.id,
          credits: creditPackage.credits.toString(),
        },
        success_url: validated.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancel_url: validated.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      };

    } else if (validated.type === 'subscription') {
      if (!validated.plan_id) {
        return NextResponse.json({ error: 'Plan ID required for subscription' }, { status: 400 });
      }

      // Get subscription plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('stripe_price_id', validated.plan_id)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
      }

      sessionConfig = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: plan.stripe_price_id,
            quantity: 1,
          },
        ],
        metadata: {
          type: 'subscription',
          user_id: user.id,
          plan_id: plan.stripe_price_id,
          monthly_credits: plan.monthly_credits.toString(),
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan_id: plan.stripe_price_id,
          },
        },
        success_url: validated.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        cancel_url: validated.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
      };

      // Add trial if available
      if (plan.trial_period_days > 0) {
        sessionConfig.subscription_data!.trial_period_days = plan.trial_period_days;
      }
    }

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create(sessionConfig);

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: validated.type,
        stripe_payment_intent_id: session.payment_intent as string || null,
        status: 'pending',
        amount_cents: validated.type === 'credit_purchase' ? 
          (sessionConfig.line_items![0].price_data!.unit_amount) : 
          (sessionConfig.line_items![0].price ? 0 : 0), // Will be updated by webhook
        currency: 'usd',
        description: `${validated.type === 'credit_purchase' ? 'Credit purchase' : 'Subscription'} - Session ${session.id}`,
        metadata: {
          stripe_session_id: session.id,
          checkout_type: validated.type,
        },
      });

    return NextResponse.json({
      session_id: session.id,
      url: session.url,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Checkout creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}