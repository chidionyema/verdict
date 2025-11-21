import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { CREDIT_PACKAGES, isValidPackageId } from '@/lib/validations';

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
    const { package_id } = body;

    if (!isValidPackageId(package_id)) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const pkg = CREDIT_PACKAGES[package_id];

    // Demo mode - just add credits directly
    if (isDemoMode()) {
      const serviceClient = createServiceClient();

      // Get current credits
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single() as { data: { credits: number } | null };

      // Add credits
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

      return NextResponse.json({
        demo: true,
        message: `Added ${pkg.credits} credits (demo mode)`,
        credits_added: pkg.credits,
      });
    }

    // Real Stripe checkout
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.name} - ${pkg.credits} Credits`,
              description: `Get ${pkg.credits} verdict credits for VERDICT`,
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        package_id,
        credits: pkg.credits.toString(),
      },
      success_url: `${origin}/account?success=true`,
      cancel_url: `${origin}/account?canceled=true`,
    });

    // Create pending transaction
    const serviceClient = createServiceClient();
    await (serviceClient.from('transactions') as ReturnType<typeof serviceClient.from>)
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        type: 'purchase',
        credits_delta: pkg.credits,
        amount_cents: pkg.price_cents,
        status: 'pending',
      } as Record<string, unknown>);

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('POST /api/billing/create-checkout-session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
