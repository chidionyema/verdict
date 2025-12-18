// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { CREDIT_PACKAGES, isValidPackageId } from '@/lib/validations';
import { log } from '@/lib/logger';

// Pricing tier configuration for new model
const TIER_PRICING = {
  standard: {
    price_cents: 300, // £3.00
    name: 'Standard Tier',
    description: 'Faster community feedback + expert routing',
    credits: 1,
    tier: 'standard'
  },
  pro: {
    price_cents: 1200, // £12.00
    name: 'Professional Tier',  
    description: 'Expert-only feedback + LLM synthesis + A/B comparison',
    credits: 1,
    tier: 'pro'
  }
} as const;

type TierId = keyof typeof TIER_PRICING;

function isValidTierId(id: string): id is TierId {
  return id in TIER_PRICING;
}

// POST /api/billing/create-checkout-session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { package_id, tier_id } = body;

    // Support both legacy credit packages and new pricing tiers
    let pkg;
    let isLegacyPackage = false;
    
    if (tier_id && isValidTierId(tier_id)) {
      // New pricing tier model
      pkg = TIER_PRICING[tier_id];
    } else if (package_id && isValidPackageId(package_id)) {
      // Legacy credit packages
      pkg = CREDIT_PACKAGES[package_id];
      isLegacyPackage = true;
    } else {
      return NextResponse.json({ error: 'Invalid package or tier' }, { status: 400 });
    }

    // Demo mode or no Stripe config - just add credits directly
    if (isDemoMode() || !stripe) {
      const serviceClient = createServiceClient();

      // Get current credits
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single() as { data: { credits: number } | null };

      if (isLegacyPackage) {
        // Add credits for legacy packages
        await (serviceClient
          .from('profiles') as ReturnType<typeof serviceClient.from>)
          .update({ credits: (profile?.credits || 0) + pkg.credits } as Record<string, unknown>)
          .eq('id', user.id);

        // Create transaction record
        await (serviceClient.from('transactions') as ReturnType<typeof serviceClient.from>)
          .insert({
            user_id: user.id,
            type: 'purchase',
            credits_delta: pkg.credits,
            amount_cents: pkg.price_cents,
            status: 'completed',
          } as Record<string, unknown>);

        const mode = isDemoMode() ? 'demo mode' : 'Stripe not configured';
        return NextResponse.json({
          demo: true,
          message: `Added ${pkg.credits} credits (${mode})`,
          credits_added: pkg.credits,
        });
      } else {
        // For pricing tiers, update the user's pricing tier
        await (serviceClient
          .from('profiles') as ReturnType<typeof serviceClient.from>)
          .update({ pricing_tier: pkg.tier } as Record<string, unknown>)
          .eq('id', user.id);

        // Create transaction record for tier purchase
        await (serviceClient.from('transactions') as ReturnType<typeof serviceClient.from>)
          .insert({
            user_id: user.id,
            type: 'tier_upgrade',
            credits_delta: 0, // No credits, just tier upgrade
            amount_cents: pkg.price_cents,
            status: 'completed',
            metadata: JSON.stringify({ tier: pkg.tier })
          } as Record<string, unknown>);

        const mode = isDemoMode() ? 'demo mode' : 'Stripe not configured';
        return NextResponse.json({
          demo: true,
          message: `Upgraded to ${pkg.name} (${mode})`,
          tier: pkg.tier,
        });
      }
    }

    // Real Stripe checkout
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe session based on purchase type
    const sessionData: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        is_legacy_package: isLegacyPackage.toString(),
      },
      success_url: `${origin}/account?success=true`,
      cancel_url: `${origin}/account?canceled=true`,
    };

    if (isLegacyPackage) {
      // Legacy credit package
      sessionData.line_items = [{
        price_data: {
          currency: 'gbp', // Changed to GBP
          product_data: {
            name: `${pkg.name} - ${pkg.credits} Credits`,
            description: `Get ${pkg.credits} verdict credits for VERDICT`,
          },
          unit_amount: pkg.price_cents,
        },
        quantity: 1,
      }];
      sessionData.metadata.package_id = package_id;
      sessionData.metadata.credits = pkg.credits.toString();
    } else {
      // New pricing tier
      sessionData.line_items = [{
        price_data: {
          currency: 'gbp', // GBP for UK pricing
          product_data: {
            name: pkg.name,
            description: pkg.description,
          },
          unit_amount: pkg.price_cents,
        },
        quantity: 1,
      }];
      sessionData.metadata.tier_id = tier_id;
      sessionData.metadata.tier = pkg.tier;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    // Create pending transaction
    const serviceClient = createServiceClient();
    const transactionData: any = {
      user_id: user.id,
      stripe_session_id: session.id,
      amount_cents: pkg.price_cents,
      status: 'pending',
    };

    if (isLegacyPackage) {
      transactionData.type = 'purchase';
      transactionData.credits_delta = pkg.credits;
    } else {
      transactionData.type = 'tier_upgrade';
      transactionData.credits_delta = 0;
      transactionData.metadata = JSON.stringify({ tier: pkg.tier });
    }

    await (serviceClient.from('transactions') as ReturnType<typeof serviceClient.from>)
      .insert(transactionData as Record<string, unknown>);

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    // Log full error details server-side for debugging
    log.error('Checkout session creation failed', error);

    // In non-production, expose a concise error message to help diagnose issues.
    const isError = error instanceof Error;
    const message = isError ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'production' ? undefined : message,
      },
      { status: 500 }
    );
  }
}
