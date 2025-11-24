-- Payment Processing & Withdrawal System
-- Adds comprehensive payment processing, subscriptions, and judge payouts

-- 1. Enhanced transactions table with more payment details
ALTER TABLE public.transactions 
ADD COLUMN stripe_payment_intent_id text,
ADD COLUMN stripe_charge_id text,
ADD COLUMN payment_method_id text,
ADD COLUMN payment_method_type text,
ADD COLUMN currency text DEFAULT 'usd',
ADD COLUMN processing_fee_cents integer DEFAULT 0,
ADD COLUMN net_amount_cents integer,
ADD COLUMN refunded_amount_cents integer DEFAULT 0,
ADD COLUMN refunded_at timestamptz,
ADD COLUMN failure_reason text,
ADD COLUMN receipt_url text,
ADD COLUMN invoice_id text;

-- 2. Payment methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe details
  stripe_payment_method_id text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal')),
  
  -- Card details (if applicable)
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  card_country text,
  
  -- Bank account details (if applicable)
  bank_name text,
  bank_last4 text,
  bank_account_type text,
  
  -- Status and settings
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Metadata
  billing_name text,
  billing_email text,
  billing_address jsonb
);

-- 3. Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe details
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  
  -- Plan details
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_price_cents integer NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  
  -- Credits and benefits
  monthly_credits integer NOT NULL DEFAULT 0,
  bonus_features jsonb DEFAULT '{}',
  
  -- Status and timing
  status text NOT NULL CHECK (status IN (
    'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'
  )),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  trial_start timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  
  -- Payment
  payment_method_id uuid REFERENCES public.payment_methods(id),
  next_payment_attempt timestamptz
);

-- 4. Judge earnings and payouts
CREATE TABLE public.judge_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Earning source
  source_type text NOT NULL CHECK (source_type IN ('verdict_response', 'bonus', 'referral', 'adjustment')),
  source_id uuid, -- Reference to verdict_response, etc.
  
  -- Amount details
  gross_amount_cents integer NOT NULL,
  fee_percentage decimal(5,4) NOT NULL DEFAULT 0.30, -- 30% platform fee
  fee_amount_cents integer NOT NULL,
  net_amount_cents integer NOT NULL,
  
  -- Payout status
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'available', 'paid', 'failed', 'refunded'
  )),
  payout_id uuid REFERENCES public.payouts(id),
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}'
);

-- 5. Payouts table
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe details
  stripe_payout_id text UNIQUE,
  stripe_transfer_id text UNIQUE,
  
  -- Amount details
  gross_amount_cents integer NOT NULL,
  fee_amount_cents integer NOT NULL DEFAULT 0,
  net_amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  
  -- Payout details
  payout_method text NOT NULL CHECK (payout_method IN ('stripe_express', 'bank_transfer', 'paypal')),
  destination_account_id text, -- Stripe Connect account ID
  
  -- Status and timing
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed', 'canceled', 'reversed'
  )),
  processing_started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  
  -- Period covered
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Metadata
  description text,
  receipt_url text,
  metadata jsonb DEFAULT '{}'
);

-- 6. Judge payout accounts (Stripe Connect)
CREATE TABLE public.judge_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect details
  stripe_account_id text NOT NULL UNIQUE,
  account_type text NOT NULL CHECK (account_type IN ('express', 'standard', 'custom')),
  
  -- Account status
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  details_submitted boolean DEFAULT false,
  
  -- Requirements and verification
  requirements jsonb DEFAULT '{}',
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN (
    'unverified', 'pending', 'verified', 'rejected'
  )),
  
  -- Account details
  country text NOT NULL DEFAULT 'US',
  default_currency text NOT NULL DEFAULT 'usd',
  business_type text,
  
  -- Metadata
  onboarding_link text,
  onboarding_expires_at timestamptz,
  dashboard_link text
);

-- 7. Credit packages and pricing
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Package details
  name text NOT NULL,
  description text,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  
  -- Pricing and discounts
  original_price_cents integer, -- For showing discounts
  discount_percentage integer DEFAULT 0,
  
  -- Availability
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- Limits and restrictions
  min_purchase_quantity integer DEFAULT 1,
  max_purchase_quantity integer,
  
  -- Metadata
  features text[],
  terms text,
  metadata jsonb DEFAULT '{}'
);

-- 8. Subscription plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Plan details
  stripe_price_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  
  -- Pricing
  price_cents integer NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  
  -- Benefits
  monthly_credits integer NOT NULL DEFAULT 0,
  bonus_features jsonb DEFAULT '{}', -- priority_queue, extra_verdicts, etc.
  
  -- Availability
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- Trial
  trial_period_days integer DEFAULT 0,
  
  -- Metadata
  features text[],
  terms text
);

-- 9. INDEXES for performance
-- Payment methods
CREATE INDEX payment_methods_user_id_idx ON public.payment_methods(user_id);
CREATE INDEX payment_methods_stripe_id_idx ON public.payment_methods(stripe_payment_method_id);
CREATE INDEX payment_methods_default_idx ON public.payment_methods(user_id, is_default) WHERE is_default = true;

-- Subscriptions
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_stripe_id_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_period_end_idx ON public.subscriptions(current_period_end);

-- Judge earnings
CREATE INDEX judge_earnings_judge_id_idx ON public.judge_earnings(judge_id, created_at DESC);
CREATE INDEX judge_earnings_payout_status_idx ON public.judge_earnings(payout_status, created_at);
CREATE INDEX judge_earnings_source_idx ON public.judge_earnings(source_type, source_id);

-- Payouts
CREATE INDEX payouts_judge_id_idx ON public.payouts(judge_id, created_at DESC);
CREATE INDEX payouts_status_idx ON public.payouts(status);
CREATE INDEX payouts_period_idx ON public.payouts(period_start, period_end);

-- Enhanced transaction indexes
CREATE INDEX transactions_stripe_payment_intent_idx ON public.transactions(stripe_payment_intent_id);
CREATE INDEX transactions_user_status_idx ON public.transactions(user_id, status, created_at DESC);

-- 10. RLS Policies

-- Payment methods - users can only see their own
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions - users can only see their own
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Judge earnings - judges can see their own, admins can see all
ALTER TABLE public.judge_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own earnings" ON public.judge_earnings
  FOR SELECT USING (auth.uid() = judge_id);

CREATE POLICY "Admins can view all earnings" ON public.judge_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Payouts - judges can see their own, admins can see all
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = judge_id);

CREATE POLICY "Admins can view all payouts" ON public.payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Judge payout accounts - judges can see their own
ALTER TABLE public.judge_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage their own payout accounts" ON public.judge_payout_accounts
  FOR ALL USING (auth.uid() = judge_id);

-- Credit packages - public read access
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active credit packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- Subscription plans - public read access
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- 11. Functions for payment processing

-- Function to create judge earning
CREATE OR REPLACE FUNCTION public.create_judge_earning(
  target_judge_id uuid,
  earning_source_type text,
  earning_source_id uuid DEFAULT NULL,
  gross_amount_cents integer,
  earning_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fee_percentage decimal(5,4) := 0.30; -- 30% platform fee
  fee_amount integer;
  net_amount integer;
  earning_id uuid;
BEGIN
  -- Calculate fees
  fee_amount := ROUND(gross_amount_cents * fee_percentage);
  net_amount := gross_amount_cents - fee_amount;
  
  -- Create earning record
  INSERT INTO public.judge_earnings (
    judge_id,
    source_type,
    source_id,
    gross_amount_cents,
    fee_percentage,
    fee_amount_cents,
    net_amount_cents,
    description
  ) VALUES (
    target_judge_id,
    earning_source_type,
    earning_source_id,
    gross_amount_cents,
    fee_percentage,
    fee_amount,
    net_amount,
    earning_description
  ) RETURNING id INTO earning_id;
  
  RETURN earning_id;
END;
$$;

-- Function to calculate available payout amount
CREATE OR REPLACE FUNCTION public.get_available_payout_amount(target_judge_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(net_amount_cents), 0)
  FROM public.judge_earnings
  WHERE judge_id = target_judge_id
    AND payout_status = 'available'
    AND created_at <= now() - interval '7 days'; -- 7-day holding period
$$;

-- Function to process subscription renewal
CREATE OR REPLACE FUNCTION public.process_subscription_renewal(subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_record record;
  credits_to_add integer;
BEGIN
  -- Get subscription details
  SELECT s.*, sp.monthly_credits 
  INTO sub_record
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.stripe_price_id
  WHERE s.id = subscription_id;
  
  IF sub_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Add monthly credits to user
  UPDATE public.profiles
  SET credits = credits + sub_record.monthly_credits
  WHERE id = sub_record.user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    credits_delta,
    amount_cents,
    status,
    description
  ) VALUES (
    sub_record.user_id,
    'subscription_renewal',
    sub_record.monthly_credits,
    sub_record.plan_price_cents,
    'completed',
    format('Monthly credit renewal - %s plan', sub_record.plan_name)
  );
  
  -- Update subscription period
  UPDATE public.subscriptions
  SET 
    current_period_start = current_period_end,
    current_period_end = CASE 
      WHEN billing_interval = 'month' THEN current_period_end + interval '1 month'
      WHEN billing_interval = 'year' THEN current_period_end + interval '1 year'
      ELSE current_period_end + interval '1 month'
    END,
    updated_at = now()
  WHERE id = subscription_id;
  
  RETURN true;
END;
$$;

-- 12. Triggers for automatic earnings

-- Trigger to create earnings when verdict is submitted and rated highly
CREATE OR REPLACE FUNCTION public.create_verdict_earning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_amount integer := 50; -- $0.50 base earning
  quality_bonus integer := 0;
  total_amount integer;
BEGIN
  -- Calculate quality bonus based on rating
  IF NEW.rating IS NOT NULL AND NEW.rating >= 8 THEN
    quality_bonus := 25; -- $0.25 bonus for high ratings
  ELSIF NEW.rating IS NOT NULL AND NEW.rating >= 6 THEN
    quality_bonus := 10; -- $0.10 bonus for good ratings
  END IF;
  
  total_amount := base_amount + quality_bonus;
  
  -- Create earning record
  PERFORM public.create_judge_earning(
    NEW.judge_id,
    'verdict_response',
    NEW.id,
    total_amount,
    format('Verdict response earning (rating: %s/10)', COALESCE(NEW.rating, 0))
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_verdict_earning_trigger
  AFTER INSERT ON public.verdict_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_verdict_earning();

-- 13. Initialize default credit packages
INSERT INTO public.credit_packages (name, description, credits, price_cents, is_featured, sort_order, features) VALUES
('Starter Pack', 'Perfect for trying out the platform', 10, 999, false, 1, ARRAY['10 verdict credits', 'Basic support']),
('Popular Pack', 'Most popular choice for regular users', 25, 1999, true, 2, ARRAY['25 verdict credits', '20% savings', 'Priority support']),
('Power Pack', 'For heavy users and professionals', 50, 3499, false, 3, ARRAY['50 verdict credits', '30% savings', 'Priority support', 'Featured requests']),
('Ultimate Pack', 'Best value for frequent users', 100, 5999, false, 4, ARRAY['100 verdict credits', '40% savings', 'VIP support', 'Featured requests', 'Priority queue']);

-- 14. Initialize subscription plans (will be synced with Stripe)
INSERT INTO public.subscription_plans (stripe_price_id, name, description, price_cents, billing_interval, monthly_credits, is_featured, features) VALUES
('price_monthly_basic', 'Basic Monthly', 'Perfect for occasional users', 999, 'month', 15, false, ARRAY['15 credits/month', 'Basic support']),
('price_monthly_pro', 'Pro Monthly', 'Great for regular users', 1999, 'month', 35, true, ARRAY['35 credits/month', 'Priority support', 'Featured requests']),
('price_yearly_basic', 'Basic Yearly', 'Save 20% with annual billing', 9588, 'year', 15, false, ARRAY['15 credits/month', 'Basic support', '20% savings']),
('price_yearly_pro', 'Pro Yearly', 'Best value for power users', 19188, 'year', 35, true, ARRAY['35 credits/month', 'Priority support', 'Featured requests', '20% savings']);

-- Update existing transactions table to work with new payment system
UPDATE public.transactions 
SET currency = 'usd', net_amount_cents = amount_cents 
WHERE currency IS NULL;