import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

interface CreateTipRequest {
  reviewerId: string;
  verdictResponseId: string;
  amountCents: number;
  tipMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for payment endpoints
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitCheck = await checkRateLimit(paymentRateLimiter, clientIP);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.error,
          retryAfter: rateLimitCheck.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter || 60)
          }
        }
      );
    }

    const { reviewerId, verdictResponseId, amountCents, tipMessage }: CreateTipRequest = 
      await request.json();

    // Validate input
    if (!reviewerId || !verdictResponseId || !amountCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amountCents < 100 || amountCents > 5000) {
      return NextResponse.json(
        { error: 'Tip amount must be between $1.00 and $50.00' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the verdict response exists and belongs to the reviewer
    const { data: verdictResponse, error: verdictError } = await supabase
      .from('verdict_responses')
      .select('id, judge_id, verdict_request_id')
      .eq('id', verdictResponseId)
      .eq('judge_id', reviewerId)
      .single();

    if (verdictError || !verdictResponse) {
      return NextResponse.json(
        { error: 'Invalid verdict response' },
        { status: 404 }
      );
    }

    // Check if user has already tipped this reviewer for this verdict
    const { data: existingTip } = await supabase
      .from('tips')
      .select('id')
      .eq('tipper_id', user.id)
      .eq('verdict_response_id', verdictResponseId)
      .single();

    if (existingTip) {
      return NextResponse.json(
        { error: 'You have already tipped this reviewer for this feedback' },
        { status: 409 }
      );
    }

    // Prevent self-tipping
    if (user.id === reviewerId) {
      return NextResponse.json(
        { error: 'You cannot tip yourself' },
        { status: 400 }
      );
    }

    // Get reviewer profile for verification boost
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', reviewerId)
      .single();

    if (!reviewerProfile) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    // Create Stripe payment intent
    const processingFee = Math.ceil(amountCents * 0.029 + 30); // 2.9% + $0.30
    const netAmount = amountCents - processingFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'tip',
        tipper_id: user.id,
        reviewer_id: reviewerId,
        verdict_response_id: verdictResponseId,
        tip_message: tipMessage || '',
        processing_fee_cents: processingFee.toString(),
        net_amount_cents: netAmount.toString(),
      },
      description: `Tip for excellent feedback - $${(amountCents / 100).toFixed(2)}`,
    });

    // Create tip record in database
    let tip, tipError;
    try {
      const result = await (supabase as any).rpc('process_tip_payment', {
        p_tipper_id: user.id,
        p_reviewer_id: reviewerId,
        p_verdict_response_id: verdictResponseId,
        p_amount_cents: amountCents,
        p_tip_message: tipMessage,
        p_payment_intent_id: paymentIntent.id,
      });
      tip = result.data;
      tipError = result.error;
    } catch (error) {
      tipError = error;
    }

    if (tipError) {
      // Cancel the payment intent if database operation failed
      await stripe.paymentIntents.cancel(paymentIntent.id);
      
      return NextResponse.json(
        { error: tipError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tipId: tip,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      processingFee,
      netAmount,
    });

  } catch (error) {
    console.error('Error creating tip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}