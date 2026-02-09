import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { log } from '@/lib/logger';
import { MIN_PAYOUT_CENTS } from '@/lib/validations';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any,
  });
};

const createPayoutSchema = z.object({
  amount_cents: z.number().min(MIN_PAYOUT_CENTS), // Minimum payout threshold
  payout_method: z.enum(['stripe_express', 'bank_transfer', 'paypal']).default('stripe_express'),
});

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate and bound pagination params
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

    // Get payouts
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: payouts, error, count } = await (supabase as any)
      .from('payouts')
      .select('*')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      log.error('Error fetching payouts', error, { userId: user.id });
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    // Get available amount for new payout
    const { data: availableAmount } = await (supabase.rpc as any)('get_available_payout_amount', {
      target_judge_id: user.id,
    });

    // Get payout account status
    const { data: payoutAccount } = await (supabase as any)
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
      minimum_payout: MIN_PAYOUT_CENTS,
    });

  } catch (error) {
    log.error('Payouts error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await (supabase as any)
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
    const { data: availableAmount } = await (supabase.rpc as any)('get_available_payout_amount', {
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
    const { data: payoutAccount, error: accountError } = await (supabase as any)
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
    const { data: payout, error: payoutError } = await (supabase as any)
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
      log.error('Error creating payout', payoutError, { userId: user.id, amount: validated.amount_cents });
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
      await (supabase as any)
        .from('payouts')
        .update({
          stripe_transfer_id: transfer.id,
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      // Update earnings to mark as paid
      // Note: earnings are created with 'pending' status and must be 7+ days old
      // to be eligible for payout (maturation period)
      const maturationDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: updatedEarnings, error: updateError } = await (supabase as any)
        .from('judge_earnings')
        .update({
          payout_status: 'paid',
          payout_id: payout.id,
          payout_date: new Date().toISOString(),
        })
        .eq('judge_id', user.id)
        .eq('payout_status', 'pending')  // Earnings are created with 'pending' status
        .is('payout_id', null)  // Not already assigned to a payout
        .lte('created_at', maturationDate)  // 7+ days old (maturation period)
        .select('id');

      const earningsCount = updatedEarnings?.length || 0;
      log.info('Updated earnings for payout', {
        payoutId: payout.id,
        earningsCount,
        maturationDate,
        updateError: updateError || null
      });

      // Update payout with earnings count
      await (supabase as any)
        .from('payouts')
        .update({ earnings_count: earningsCount })
        .eq('id', payout.id);

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
      log.error('Stripe transfer error', stripeError, { userId: user.id, payoutId: payout.id });

      // Update payout status to failed
      await (supabase as any)
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
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Payout creation error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting - strict for financial payout operations
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);