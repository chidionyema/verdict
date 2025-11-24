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

const createPayoutSchema = z.object({
  amount_cents: z.number().min(1000), // Minimum $10 payout
  payout_method: z.enum(['stripe_express', 'bank_transfer', 'paypal']).default('stripe_express'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get payouts
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: payouts, error, count } = await supabase
      .from('payouts')
      .select('*')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    // Get available amount for new payout
    const { data: availableAmount } = await supabase.rpc('get_available_payout_amount', {
      target_judge_id: user.id,
    });

    // Get payout account status
    const { data: payoutAccount } = await supabase
      .from('judge_payout_accounts')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      available_amount: availableAmount || 0,
      payout_account: payoutAccount,
      minimum_payout: 1000, // $10.00 minimum
    });

  } catch (error) {
    console.error('Payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createPayoutSchema.parse(body);

    // Check available amount
    const { data: availableAmount } = await supabase.rpc('get_available_payout_amount', {
      target_judge_id: user.id,
    });

    if (!availableAmount || availableAmount < validated.amount_cents) {
      return NextResponse.json({ 
        error: 'Insufficient available balance', 
        available: availableAmount || 0,
        requested: validated.amount_cents,
      }, { status: 400 });
    }

    // Get payout account
    const { data: payoutAccount, error: accountError } = await supabase
      .from('judge_payout_accounts')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (accountError || !payoutAccount) {
      return NextResponse.json({ 
        error: 'Payout account not found. Please set up your payout account first.',
        setup_required: true,
      }, { status: 400 });
    }

    if (!payoutAccount.payouts_enabled) {
      return NextResponse.json({ 
        error: 'Payout account not verified. Please complete verification.',
        verification_required: true,
      }, { status: 400 });
    }

    // Calculate fees (Stripe Express accounts typically have ~2.9% + 30¢)
    const platformFeePercentage = 0.029; // 2.9%
    const platformFeeFixed = 30; // 30¢
    const feeAmount = Math.round(validated.amount_cents * platformFeePercentage) + platformFeeFixed;
    const netAmount = validated.amount_cents - feeAmount;

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        judge_id: user.id,
        gross_amount_cents: validated.amount_cents,
        fee_amount_cents: feeAmount,
        net_amount_cents: netAmount,
        payout_method: validated.payout_method,
        destination_account_id: payoutAccount.stripe_account_id,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        period_end: new Date().toISOString(),
        description: `Payout for period ending ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    try {
      // Create Stripe transfer
      const transfer = await getStripe().transfers.create({
        amount: netAmount,
        currency: 'usd',
        destination: payoutAccount.stripe_account_id,
        metadata: {
          payout_id: payout.id,
          judge_id: user.id,
        },
      });

      // Update payout with Stripe transfer ID
      await supabase
        .from('payouts')
        .update({
          stripe_transfer_id: transfer.id,
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      // Update earnings to mark as paid
      await supabase
        .from('judge_earnings')
        .update({
          payout_status: 'paid',
          payout_id: payout.id,
        })
        .eq('judge_id', user.id)
        .eq('payout_status', 'available')
        .lte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 7+ days old

      return NextResponse.json({
        success: true,
        payout: {
          ...payout,
          stripe_transfer_id: transfer.id,
          status: 'processing',
        },
        message: 'Payout request submitted successfully',
      });

    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError);
      
      // Update payout status to failed
      await supabase
        .from('payouts')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: stripeError.message,
        })
        .eq('id', payout.id);

      return NextResponse.json({ 
        error: 'Failed to process payout',
        details: stripeError.message,
      }, { status: 500 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Payout creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}