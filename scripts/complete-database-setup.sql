-- COMPLETE VERDICT DATABASE SETUP
-- Single script to create all tables, indexes, and policies
-- Run this once in Supabase SQL Editor

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Profiles (Enhanced)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  
  -- Credits & Status
  credits INTEGER DEFAULT 3,
  is_judge BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  
  -- Judge Info
  judge_qualification_date TIMESTAMPTZ,
  judge_rating DECIMAL(3,2) DEFAULT 0.0,
  total_verdicts_given INTEGER DEFAULT 0,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verdict Requests
CREATE TABLE IF NOT EXISTS verdict_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  category TEXT NOT NULL,
  subcategory TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'text')),
  media_url TEXT,
  text_content TEXT,
  context TEXT,
  
  -- Request Settings
  target_verdict_count INTEGER DEFAULT 3, -- Reduced to 3 for 40%+ profit margin
  received_verdict_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Verdicts (Legacy - keeping for compatibility)
CREATE TABLE IF NOT EXISTS verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Response Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT NOT NULL,
  tone TEXT CHECK (tone IN ('encouraging', 'honest', 'constructive')),
  
  -- Quality Metrics
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  quality_score DECIMAL(3,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(request_id, judge_id)
);

-- Verdict Responses (Main responses table used by most APIs)
CREATE TABLE IF NOT EXISTS verdict_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Response Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT NOT NULL,
  tone TEXT CHECK (tone IN ('encouraging', 'honest', 'constructive')),
  
  -- Quality Metrics
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  quality_score DECIMAL(3,2),
  
  -- Earnings
  judge_earning DECIMAL(10,2) DEFAULT 0.50,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(request_id, judge_id)
);

-- =====================================================
-- DEMOGRAPHICS SYSTEM
-- =====================================================

-- Judge Demographics
CREATE TABLE IF NOT EXISTS judge_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Demographics
  age_range TEXT,
  gender TEXT,
  ethnicity TEXT[],
  location TEXT,
  
  -- Background
  education_level TEXT,
  profession TEXT,
  relationship_status TEXT,
  income_range TEXT,
  
  -- Interests & Lifestyle
  lifestyle_tags TEXT[],
  interest_areas TEXT[],
  
  -- Privacy Controls
  visibility_preferences JSONB DEFAULT '{
    "show_age": true,
    "show_gender": true,
    "show_ethnicity": false,
    "show_location": true,
    "show_education": false,
    "show_profession": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(judge_id)
);

-- Judge Availability
CREATE TABLE IF NOT EXISTS judge_availability (
  judge_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  avg_response_time_minutes INTEGER DEFAULT 30,
  max_daily_verdicts INTEGER DEFAULT 20,
  current_daily_verdicts INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request Judge Preferences
CREATE TABLE IF NOT EXISTS request_judge_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  
  -- Demographic Filters
  preferred_age_ranges TEXT[],
  preferred_genders TEXT[],
  preferred_ethnicities TEXT[],
  preferred_education_levels TEXT[],
  preferred_professions TEXT[],
  preferred_locations TEXT[],
  preferred_lifestyle_tags TEXT[],
  preferred_interests TEXT[],
  
  -- Strategy
  priority_mode TEXT DEFAULT 'balanced',
  require_diversity BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id)
);

-- =====================================================
-- PAYMENT & FINANCIAL SYSTEM
-- =====================================================

-- User Credits Transactions
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL, -- Positive for add, negative for spend
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spending', 'bonus', 'refund')),
  description TEXT,
  
  -- Related records
  request_id UUID REFERENCES verdict_requests(id),
  verdict_id UUID REFERENCES verdicts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Financial transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction Details
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'subscription_payment', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_amount INTEGER,
  
  -- Stripe Info
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Payment Details
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_purchased INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Earnings
CREATE TABLE IF NOT EXISTS judge_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Earning Details
  verdict_response_id UUID REFERENCES verdict_responses(id),
  amount DECIMAL(10,2) NOT NULL,
  
  -- Payout Info
  payout_id UUID,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION SYSTEM
-- =====================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  credits_per_month INTEGER NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  
  -- Stripe IDs
  stripe_monthly_price_id TEXT UNIQUE,
  stripe_yearly_price_id TEXT UNIQUE,
  
  -- Features
  features TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Stripe Info
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Subscription Details
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODERATION & QUALITY
-- =====================================================

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  
  -- What's being reported
  request_id UUID REFERENCES verdict_requests(id),
  verdict_id UUID REFERENCES verdicts(id),
  
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'other')),
  details TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- User Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  
  -- Related records
  request_id UUID REFERENCES verdict_requests(id),
  verdict_id UUID REFERENCES verdicts(id),
  
  -- Status
  read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_judge ON profiles(is_judge);
CREATE INDEX IF NOT EXISTS idx_verdict_requests_user_id ON verdict_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_requests_status ON verdict_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_request_id ON verdicts(request_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_judge_id ON verdicts(judge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_responses_request_id ON verdict_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_verdict_responses_judge_id ON verdict_responses(judge_id, created_at DESC);

-- Demographics indexes
CREATE INDEX IF NOT EXISTS idx_judge_demographics_judge_id ON judge_demographics(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_demographics_age_range ON judge_demographics(age_range);
CREATE INDEX IF NOT EXISTS idx_judge_demographics_gender ON judge_demographics(gender);
CREATE INDEX IF NOT EXISTS idx_judge_demographics_profession ON judge_demographics(profession);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_judge_earnings_judge_id ON judge_earnings(judge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, read, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_judge_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to handle re-runs)
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_own_requests" ON verdict_requests;
DROP POLICY IF EXISTS "judges_own_verdicts" ON verdicts;
DROP POLICY IF EXISTS "users_see_request_verdicts" ON verdicts;
DROP POLICY IF EXISTS "judges_own_responses" ON verdict_responses;
DROP POLICY IF EXISTS "users_see_request_responses" ON verdict_responses;
DROP POLICY IF EXISTS "judges_own_demographics" ON judge_demographics;
DROP POLICY IF EXISTS "judges_own_availability" ON judge_availability;
DROP POLICY IF EXISTS "users_own_request_preferences" ON request_judge_preferences;
DROP POLICY IF EXISTS "users_own_credits" ON user_credits;
DROP POLICY IF EXISTS "users_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_own_payments" ON payments;
DROP POLICY IF EXISTS "judges_own_earnings" ON judge_earnings;
DROP POLICY IF EXISTS "users_own_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_own_reports" ON content_reports;

-- Profiles policies
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Requests policies  
CREATE POLICY "users_own_requests" ON verdict_requests
  FOR ALL USING (auth.uid() = user_id);

-- Verdicts policies
CREATE POLICY "judges_own_verdicts" ON verdicts
  FOR ALL USING (auth.uid() = judge_id);

CREATE POLICY "users_see_request_verdicts" ON verdicts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM verdict_requests WHERE id = request_id
    )
  );

-- Verdict Responses policies
CREATE POLICY "judges_own_responses" ON verdict_responses
  FOR ALL USING (auth.uid() = judge_id);

CREATE POLICY "users_see_request_responses" ON verdict_responses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM verdict_requests WHERE id = request_id
    )
  );

-- Demographics policies
CREATE POLICY "judges_own_demographics" ON judge_demographics
  FOR ALL USING (auth.uid() = judge_id);

CREATE POLICY "judges_own_availability" ON judge_availability
  FOR ALL USING (auth.uid() = judge_id);

CREATE POLICY "users_own_request_preferences" ON request_judge_preferences
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM verdict_requests WHERE id = request_id
    )
  );

-- Financial policies
CREATE POLICY "users_own_credits" ON user_credits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "judges_own_earnings" ON judge_earnings
  FOR ALL USING (auth.uid() = judge_id);

CREATE POLICY "users_own_subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "users_own_reports" ON content_reports
  FOR ALL USING (auth.uid() = reporter_id);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Get available judges with filtering
CREATE OR REPLACE FUNCTION get_available_judges_simple(
  p_age_ranges TEXT[] DEFAULT NULL,
  p_genders TEXT[] DEFAULT NULL,
  p_professions TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  judge_id UUID,
  age_range TEXT,
  gender TEXT,
  profession TEXT,
  avg_response_time INTEGER,
  visible_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.judge_id,
    d.age_range,
    d.gender,
    d.profession,
    COALESCE(a.avg_response_time_minutes, 30) as avg_response_time,
    jsonb_build_object(
      'age_range', CASE WHEN d.visibility_preferences->>'show_age' = 'true' THEN d.age_range END,
      'gender', CASE WHEN d.visibility_preferences->>'show_gender' = 'true' THEN d.gender END,
      'profession', CASE WHEN d.visibility_preferences->>'show_profession' = 'true' THEN d.profession END,
      'location', CASE WHEN d.visibility_preferences->>'show_location' = 'true' THEN d.location END
    ) as visible_info
  FROM judge_demographics d
  LEFT JOIN judge_availability a ON d.judge_id = a.judge_id
  JOIN profiles p ON d.judge_id = p.id
  WHERE 
    COALESCE(a.is_available, true) = true
    AND p.is_judge = true
    AND COALESCE(a.current_daily_verdicts, 0) < COALESCE(a.max_daily_verdicts, 20)
    AND (p_age_ranges IS NULL OR d.age_range = ANY(p_age_ranges))
    AND (p_genders IS NULL OR d.gender = ANY(p_genders))
    AND (p_professions IS NULL OR d.profession = ANY(p_professions))
  ORDER BY 
    COALESCE(a.avg_response_time_minutes, 30) ASC,
    d.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Count available judges
CREATE OR REPLACE FUNCTION count_available_judges(
  p_age_ranges TEXT[] DEFAULT NULL,
  p_genders TEXT[] DEFAULT NULL,
  p_professions TEXT[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  judge_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO judge_count
  FROM judge_demographics d
  LEFT JOIN judge_availability a ON d.judge_id = a.judge_id
  JOIN profiles p ON d.judge_id = p.id
  WHERE 
    COALESCE(a.is_available, true) = true
    AND p.is_judge = true
    AND COALESCE(a.current_daily_verdicts, 0) < COALESCE(a.max_daily_verdicts, 20)
    AND (p_age_ranges IS NULL OR d.age_range = ANY(p_age_ranges))
    AND (p_genders IS NULL OR d.gender = ANY(p_genders))
    AND (p_professions IS NULL OR d.profession = ANY(p_professions));
    
  RETURN judge_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 VERDICT DATABASE SETUP COMPLETE!';
  RAISE NOTICE '📊 Core Tables: profiles, verdict_requests, verdict_responses, verdicts';
  RAISE NOTICE '👥 Demographics: judge_demographics, judge_availability, request_judge_preferences';
  RAISE NOTICE '💰 Financial: transactions, payments, judge_earnings, subscriptions, subscription_plans';
  RAISE NOTICE '📢 Communication: notifications, content_reports';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Performance indexes created';
  RAISE NOTICE '🛠️ Helper functions available';
  RAISE NOTICE '✅ Ready for production deployment!';
  RAISE NOTICE '';
  RAISE NOTICE '🚨 NEXT STEPS:';
  RAISE NOTICE '1. Create Supabase Storage bucket named "requests"';
  RAISE NOTICE '2. Configure Stripe webhook endpoint';
  RAISE NOTICE '3. Set all environment variables';
  RAISE NOTICE '4. Test payment flow end-to-end';
END $$;