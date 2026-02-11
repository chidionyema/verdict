import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function POST_Handler(request: NextRequest) {
  try {
    // Demo mode - just return a fake client secret
    if (isDemoMode() || !stripe) {
      return NextResponse.json({
        client_secret: 'pi_demo_client_secret',
        demo: true
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { amount, currency, description } = requestBody;

    if (!amount || !currency || !description) {
      return NextResponse.json({
        error: 'Missing required fields: amount, currency, description'
      }, { status: 400 });
    }

    // Validate amount - must be positive integer within reasonable bounds
    // Minimum: $0.50 (50 cents) - Stripe minimum
    // Maximum: $10,000 (1,000,000 cents) - reasonable app limit
    const amountCents = Math.round(amount);
    if (typeof amount !== 'number' || amountCents < 50 || amountCents > 1000000) {
      return NextResponse.json({
        error: 'Amount must be between $0.50 and $10,000'
      }, { status: 400 });
    }

    // Validate currency - whitelist supported currencies
    const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'cad', 'aud'];
    const normalizedCurrency = currency.toLowerCase();
    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return NextResponse.json({
        error: `Unsupported currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`
      }, { status: 400 });
    }

    // Validate description length
    if (typeof description !== 'string' || description.length > 500) {
      return NextResponse.json({
        error: 'Description must be a string of 500 characters or less'
      }, { status: 400 });
    }

    // Create payment intent with validated values and idempotency
    const idempotencyKey = `pi_${user.id}_${amountCents}_${Date.now()}`;

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: normalizedCurrency,
        description,
        metadata: {
          user_id: user.id,
          description: description,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      }, {
        idempotencyKey,
      });
    } catch (stripeError: unknown) {
      const isStripeError = stripeError && typeof stripeError === 'object' && 'type' in stripeError;

      if (isStripeError) {
        const err = stripeError as { type: string; message?: string; code?: string };
        console.error('Stripe payment intent error:', err.type, err.code, err.message);

        if (err.type === 'StripeCardError') {
          return NextResponse.json({
            error: 'Card declined',
            message: err.message || 'Your card was declined.',
          }, { status: 402 });
        }

        if (err.type === 'StripeRateLimitError') {
          return NextResponse.json({
            error: 'Service busy',
            message: 'Please try again in a moment.',
            retry_after: 30,
          }, { status: 503 });
        }
      }

      throw stripeError;
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting to payment intent creation
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);