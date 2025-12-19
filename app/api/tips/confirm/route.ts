import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars aren't set
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

interface ConfirmTipRequest {
  paymentIntentId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId }: ConfirmTipRequest = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
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

    // Retrieve the payment intent from Stripe
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Verify the payment intent belongs to the authenticated user
    if (paymentIntent.metadata.tipper_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized payment intent' },
        { status: 403 }
      );
    }

    // Update the tip status in the database based on payment status
    const paymentStatus = paymentIntent.status === 'succeeded' ? 'succeeded' : 
                         paymentIntent.status === 'canceled' ? 'failed' : 
                         'pending';

    try {
      const { error: updateError } = await (supabase as any)
        .from('tips')
        .update({
          payment_status: paymentStatus,
          stripe_charge_id: paymentIntent.latest_charge,
          processed_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_intent_id', paymentIntentId)
        .eq('tipper_id', user.id);

      if (updateError) {
        console.error('Error updating tip status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update tip status' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.log('Tips table not found, skipping update');
    }

    if (paymentStatus === 'succeeded') {
      // Send notification to reviewer about the tip
      try {
        const { error: notificationError } = await (supabase as any)
          .rpc('send_tip_notification', {
            reviewer_id: paymentIntent.metadata.reviewer_id,
            tipper_id: user.id,
            amount_cents: paymentIntent.amount,
            tip_message: paymentIntent.metadata.tip_message,
          });

        // Don't fail the request if notification fails
        if (notificationError) {
          console.warn('Failed to send tip notification:', notificationError);
        }
      } catch (error) {
        console.log('send_tip_notification RPC not found, skipping notification');
      }

      // Update reviewer's gamification metrics
      try {
        await (supabase as any).rpc('update_reviewer_tip_metrics', {
          p_reviewer_id: paymentIntent.metadata.reviewer_id,
          p_tip_amount: parseInt(paymentIntent.metadata.net_amount_cents),
        });
      } catch (error) {
        console.log('update_reviewer_tip_metrics RPC not found, skipping');
      }
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      tipId: paymentIntent.metadata.tip_id,
      amount: paymentIntent.amount,
    });

  } catch (error) {
    console.error('Error confirming tip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}