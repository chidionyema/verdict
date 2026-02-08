import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import Stripe from 'stripe';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any,
  });
};

const createPaymentMethodSchema = z.object({
  stripe_payment_method_id: z.string(),
  type: z.enum(['card', 'bank_account', 'paypal']),
  is_default: z.boolean().optional(),
  billing_name: z.string().optional(),
  billing_email: z.string().email().optional(),
  billing_address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      log.error('Failed to fetch payment methods', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    return NextResponse.json({ payment_methods: paymentMethods });
  } catch (error) {
    log.error('Payment methods GET endpoint error', error);
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

    const body = await request.json();
    const validated = createPaymentMethodSchema.parse(body);

    // Get Stripe payment method details
    const stripePaymentMethod = await getStripe().paymentMethods.retrieve(
      validated.stripe_payment_method_id
    );

    // Prepare payment method data
    const paymentMethodData: any = {
      user_id: user.id,
      stripe_payment_method_id: validated.stripe_payment_method_id,
      type: validated.type,
      billing_name: validated.billing_name,
      billing_email: validated.billing_email,
      billing_address: validated.billing_address,
      is_default: validated.is_default || false,
      is_verified: true,
    };

    // Add type-specific details
    if (stripePaymentMethod.card) {
      paymentMethodData.card_brand = stripePaymentMethod.card.brand;
      paymentMethodData.card_last4 = stripePaymentMethod.card.last4;
      paymentMethodData.card_exp_month = stripePaymentMethod.card.exp_month;
      paymentMethodData.card_exp_year = stripePaymentMethod.card.exp_year;
      paymentMethodData.card_country = stripePaymentMethod.card.country;
    }

    // If setting as default, unset other defaults first
    if (validated.is_default) {
      await (supabase as any)
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Insert new payment method
    const { data: paymentMethod, error } = await (supabase as any)
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) {
      log.error('Failed to create payment method', error);
      return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 });
    }

    return NextResponse.json({ payment_method: paymentMethod });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Payment method creation endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function DELETE_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Validate paymentMethodId as UUID
    if (!isValidUUID(paymentMethodId)) {
      return NextResponse.json({ error: 'Invalid payment method ID format' }, { status: 400 });
    }

    // Verify ownership and get payment method
    const { data: paymentMethod, error: fetchError } = await (supabase as any)
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Detach from Stripe
    try {
      await getStripe().paymentMethods.detach((paymentMethod as any).stripe_payment_method_id);
    } catch (stripeError) {
      log.warn('Failed to detach payment method from Stripe', { error: stripeError });
      // Continue with deletion even if Stripe fails
    }

    // Soft delete (mark as inactive)
    const { error } = await (supabase as any)
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', paymentMethodId);

    if (error) {
      log.error('Failed to delete payment method', error);
      return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Payment method deletion endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to payment method operations
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);
export const DELETE = withRateLimit(DELETE_Handler, rateLimitPresets.default);