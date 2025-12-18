import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { getPricingConfig } from '@/lib/pricing-config';
import { log } from '@/lib/logger';

// POST /api/submit/payment - Create Stripe checkout for direct submission payment
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
    const { submissionData } = body;

    if (!submissionData || !submissionData.question) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    const pricing = getPricingConfig();
    const priceInCents = pricing.private_submission.gbp.amount * 100; // Convert to pence

    // Demo mode - simulate successful payment
    if (isDemoMode() || !stripe) {
      const mode = isDemoMode() ? 'demo mode' : 'Stripe not configured';
      return NextResponse.json({
        demo: true,
        message: `Payment simulated (${mode})`,
        success: true,
        submissionData
      });
    }

    // Real Stripe checkout
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Private Feedback Submission',
              description: `Get 3 anonymous feedback reports: "${submissionData.question.slice(0, 50)}${submissionData.question.length > 50 ? '...' : ''}"`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        submission_type: 'private',
        submission_question: submissionData.question.slice(0, 100),
        submission_category: submissionData.category || 'general',
      },
      success_url: `${origin}/submit-unified?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/submit-unified?step=payment&canceled=true`,
    });

    return NextResponse.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    log.error('Submission payment creation failed', error);

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