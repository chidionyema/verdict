import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import Stripe from 'stripe';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any,
  });
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    // Check if already has connect account
    const { data: existingAccount } = await (supabase as any)
      .from('judge_payout_accounts')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (existingAccount) {
      // Return existing account info
      try {
        const account = await getStripe().accounts.retrieve(existingAccount.stripe_account_id);
        return NextResponse.json({
          account: existingAccount,
          stripe_account: {
            id: account.id,
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            verification: account.requirements,
          },
        });
      } catch (stripeError) {
        log.warn('Failed to fetch Stripe account', { error: stripeError, accountId: existingAccount.stripe_account_id });
        return NextResponse.json({ account: existingAccount });
      }
    }

    return NextResponse.json({ 
      account: null,
      message: 'No payout account found. Use POST to create one.',
    });

  } catch (error) {
    log.error('Connect account fetch error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Supported countries for Stripe Connect Express
const SUPPORTED_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE',
  'AT', 'IE', 'PT', 'FI', 'SE', 'DK', 'NO', 'CH', 'NZ', 'SG',
  'HK', 'JP', 'MX', 'BR', 'PL', 'CZ', 'RO', 'BG', 'HR', 'CY',
  'EE', 'GR', 'HU', 'LV', 'LT', 'LU', 'MT', 'SK', 'SI',
] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get country from request body (SECURITY: Validate JSON parsing)
    let body;
    try {
      body = await request.json();
    } catch (error) {
      log.error('Invalid JSON in judge connect request', error, { userId: user.id });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a valid JSON object' }, { status: 400 });
    }
    
    const requestedCountry = body.country?.toUpperCase() || 'US';

    // Validate country
    if (!SUPPORTED_COUNTRIES.includes(requestedCountry as typeof SUPPORTED_COUNTRIES[number])) {
      return NextResponse.json({
        error: 'Unsupported country',
        supported_countries: SUPPORTED_COUNTRIES,
      }, { status: 400 });
    }

    // Verify user is a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge, email, full_name, country')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
    }

    // Use profile country if available, otherwise use requested country
    const country = requestedCountry;

    // Check if already has connect account
    const { data: existingAccount } = await (supabase as any)
      .from('judge_payout_accounts')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (existingAccount) {
      return NextResponse.json({
        error: 'Payout account already exists',
        account: existingAccount,
      }, { status: 400 });
    }

    try {
      // Create Stripe Connect Express account
      const account = await getStripe().accounts.create({
        type: 'express',
        country: country,
        email: profile.email ?? undefined,
        business_profile: {
          name: profile.full_name || undefined,
          product_description: 'Verdict judging services',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          judge_id: user.id,
          platform: 'verdict',
        },
      });

      // Create onboarding link
      const accountLink = await getStripe().accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/judge/earnings?setup=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/judge/earnings?setup=complete`,
        type: 'account_onboarding',
      });

      // Save account to database
      const { data: payoutAccount, error: dbError } = await supabase
        .from('judge_payout_accounts')
        .insert({
          judge_id: user.id,
          stripe_account_id: account.id,
          account_type: 'express',
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          country: country,
          onboarding_link: accountLink.url,
          onboarding_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (dbError) {
        log.error('Error saving payout account', dbError, { accountId: account.id, judgeId: user.id });
        // Clean up Stripe account if database save fails
        await getStripe().accounts.del(account.id);
        return NextResponse.json({ error: 'Failed to save payout account' }, { status: 500 });
      }

      return NextResponse.json({
        account: payoutAccount,
        onboarding_url: accountLink.url,
        message: 'Payout account created. Please complete onboarding.',
      });

    } catch (stripeError: any) {
      log.error('Stripe Connect account creation error', stripeError, { judgeId: user.id, country });
      return NextResponse.json({
        error: 'Failed to create payout account',
        details: stripeError.message,
      }, { status: 500 });
    }

  } catch (error) {
    log.error('Connect account creation error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing account
    const { data: payoutAccount } = await (supabase as any)
      .from('judge_payout_accounts')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (!payoutAccount) {
      return NextResponse.json({ error: 'Payout account not found' }, { status: 404 });
    }

    // Refresh account data from Stripe
    const account = await getStripe().accounts.retrieve(payoutAccount.stripe_account_id);

    // Update database with latest info
    const { error } = await (supabase as any)
      .from('judge_payout_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        verification_status: account.details_submitted ? 'verified' : 'pending',
      })
      .eq('id', payoutAccount.id);

    if (error) {
      log.error('Error updating payout account', error, { accountId: payoutAccount.id, stripeAccountId: payoutAccount.stripe_account_id });
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }

    // Create new onboarding link if needed
    let onboardingUrl = null;
    if (!account.details_submitted) {
      const accountLink = await getStripe().accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/judge/earnings?setup=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/judge/earnings?setup=complete`,
        type: 'account_onboarding',
      });
      onboardingUrl = accountLink.url;
    }

    return NextResponse.json({
      account: {
        ...payoutAccount,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
      onboarding_url: onboardingUrl,
      stripe_account: {
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        verification: account.requirements,
      },
    });

  } catch (error) {
    log.error('Connect account refresh error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}