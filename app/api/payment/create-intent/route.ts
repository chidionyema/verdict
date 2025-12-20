import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';

export async function POST(request: NextRequest) {
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

    const { amount, currency, description } = await request.json();

    if (!amount || !currency || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, currency, description' 
      }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency: currency.toLowerCase(),
      description,
      metadata: {
        user_id: user.id,
        description: description,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

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