-- ============================================================================
-- VERDICT PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
--
-- This is the SINGLE SOURCE OF TRUTH for the Verdict database schema.
-- It consolidates ALL migrations and schema changes into one file.
--
-- USAGE:
--   - For NEW deployments: Run this entire script on a fresh Supabase project
--   - For EXISTING databases: Use individual migrations in database/migrations/
--
-- Last consolidated: 2026-02-11
-- Includes:
--   - Core schema (profiles, requests, responses)
--   - Credit system (transactions, atomic operations)
--   - Judge system (earnings, reputation, payouts, qualifications)
--   - Comparison & Split Test features
--   - Authentication (email verification, password reset)
--   - Subscriptions & Payment methods
--   - GDPR compliance (consents, deletion, exports)
--   - Notifications & Preferences
--   - Help Center
--   - Content Moderation
--   - Admin & Audit logs
--
-- TABLES: 55+
-- RPC FUNCTIONS: 30+
-- STORAGE BUCKETS: 4
--
-- WARNING: Running on existing database will DROP and recreate tables!
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 2: CUSTOM TYPES AND ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE request_tier AS ENUM ('community', 'standard', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reviewer_status AS ENUM ('active', 'probation', 'calibration_required');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE judge_tier AS ENUM ('rookie', 'regular', 'trusted', 'expert', 'elite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('draft', 'open', 'in_progress', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('photo', 'text', 'audio', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('appearance', 'profile', 'writing', 'decision', 'comparison', 'split_test');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 3: CORE TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  country TEXT,
  age_range TEXT,
  gender TEXT,
  bio TEXT,

  -- Credit system
  credits INTEGER DEFAULT 1 CONSTRAINT chk_credits_non_negative CHECK (credits >= 0),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,

  -- Activity tracking
  total_submissions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  profile_completed BOOLEAN DEFAULT FALSE,
  tutorial_completed BOOLEAN DEFAULT FALSE,
  has_completed_tutorial BOOLEAN DEFAULT FALSE,
  guidelines_accepted BOOLEAN DEFAULT FALSE,
  guidelines_accepted_at TIMESTAMP WITH TIME ZONE,
  first_submission_completed BOOLEAN DEFAULT FALSE,
  first_judgment_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  safety_training_completed BOOLEAN DEFAULT FALSE,
  safety_training_completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_features TEXT[] DEFAULT '{}',
  verification_status verification_status DEFAULT 'pending',
  engagement_score INTEGER DEFAULT 0,
  journey_state TEXT DEFAULT 'new',
  interests TEXT[],
  preferred_path VARCHAR(20) CHECK (preferred_path IN ('community', 'private')),

  -- Judge status
  is_judge BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  judge_since TIMESTAMP WITH TIME ZONE,
  judge_training_completed BOOLEAN DEFAULT FALSE,
  judge_qualification_date TIMESTAMP WITH TIME ZONE,

  -- LinkedIn verification
  linkedin_verified BOOLEAN DEFAULT FALSE,
  linkedin_url TEXT,
  expertise_area TEXT,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,

  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verdict requests (main content table)
CREATE TABLE IF NOT EXISTS verdict_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  category category_type NOT NULL,
  subcategory TEXT,
  media_type media_type NOT NULL,
  media_url TEXT,
  text_content TEXT,
  context TEXT NOT NULL,
  question TEXT,

  -- Configuration
  requested_tone TEXT DEFAULT 'honest',
  roast_mode BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'private',
  target_verdict_count INTEGER DEFAULT 3 CHECK (target_verdict_count >= 1 AND target_verdict_count <= 20),
  received_verdict_count INTEGER DEFAULT 0,

  -- Pricing and tier
  request_tier request_tier DEFAULT 'community',
  credits_cost INTEGER DEFAULT 1,
  credits_charged INTEGER DEFAULT 0,
  credits_refunded INTEGER DEFAULT 0,

  -- Status tracking
  status request_status DEFAULT 'open',

  -- Optional features
  folder_id UUID,
  demographic_filters JSONB,
  expert_routing_enabled BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Verdict responses (judgments from reviewers)
CREATE TABLE IF NOT EXISTS verdict_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Response content
  feedback TEXT NOT NULL CHECK (length(feedback) >= 10 AND length(feedback) <= 5000),
  rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 10.0),
  tone TEXT DEFAULT 'honest',

  -- Metadata
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  helpfulness_score DECIMAL(4,2) DEFAULT 0.00,

  -- Media responses
  voice_url TEXT,
  response_time_seconds INTEGER,

  -- Quality tracking
  quality_score INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'approved',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(request_id, judge_id)
);

-- ============================================================================
-- PART 4: COMPARISON/SPLIT TEST TABLES
-- ============================================================================

-- Comparison requests (A/B comparisons)
CREATE TABLE IF NOT EXISTS comparison_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  category category_type DEFAULT 'comparison',
  image_a_url TEXT NOT NULL,
  image_b_url TEXT NOT NULL,
  context TEXT,
  question TEXT DEFAULT 'Which one is better?',
  decision_context TEXT,

  -- Option metadata
  option_a_title TEXT,
  option_b_title TEXT,
  option_a_image_url TEXT,
  option_b_image_url TEXT,

  -- Configuration
  target_verdict_count INTEGER DEFAULT 5,
  received_verdict_count INTEGER DEFAULT 0,
  credits_cost INTEGER DEFAULT 2,
  request_tier request_tier DEFAULT 'community',

  -- Status
  status request_status DEFAULT 'open',
  winner_option TEXT CHECK (winner_option IN ('A', 'B', 'tie', NULL)),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Comparison verdicts
CREATE TABLE IF NOT EXISTS comparison_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL REFERENCES comparison_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Response
  selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'tie')),
  chosen_option TEXT CHECK (chosen_option IN ('A', 'B', 'tie')),
  reasoning TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),

  -- Detailed feedback for option A
  option_a_feedback TEXT,
  option_a_strengths TEXT[],
  option_a_weaknesses TEXT[],
  option_a_rating INTEGER CHECK (option_a_rating >= 1 AND option_a_rating <= 10),

  -- Detailed feedback for option B
  option_b_feedback TEXT,
  option_b_strengths TEXT[],
  option_b_weaknesses TEXT[],
  option_b_rating INTEGER CHECK (option_b_rating >= 1 AND option_b_rating <= 10),

  -- Additional context
  budget_consideration TEXT,
  time_spent_seconds INTEGER,
  judge_expertise TEXT[],
  decision_scores JSONB,
  quality_score INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(comparison_id, judge_id)
);

-- Split test requests (multi-option testing)
CREATE TABLE IF NOT EXISTS split_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  category category_type DEFAULT 'split_test',
  title TEXT NOT NULL,
  context TEXT,
  options JSONB NOT NULL, -- Array of {id, url, label}

  -- Photo URLs (for simple A/B split tests)
  photo_a_url TEXT,
  photo_b_url TEXT,

  -- Configuration
  target_verdict_count INTEGER DEFAULT 10,
  received_verdict_count INTEGER DEFAULT 0,
  credits_cost INTEGER DEFAULT 3,

  -- Status
  status request_status DEFAULT 'open',
  winning_option_id TEXT,
  winning_photo TEXT CHECK (winning_photo IN ('A', 'B', NULL)),
  consensus_strength INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Split test verdicts
CREATE TABLE IF NOT EXISTS split_test_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_test_id UUID NOT NULL REFERENCES split_test_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Response
  selected_option_id TEXT NOT NULL,
  chosen_photo TEXT CHECK (chosen_photo IN ('A', 'B')),
  ranking JSONB, -- Optional full ranking
  reasoning TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),

  -- Detailed feedback for photo A
  photo_a_feedback TEXT,
  photo_a_strengths TEXT[],
  photo_a_improvements TEXT[],
  photo_a_rating INTEGER CHECK (photo_a_rating >= 1 AND photo_a_rating <= 10),

  -- Detailed feedback for photo B
  photo_b_feedback TEXT,
  photo_b_strengths TEXT[],
  photo_b_improvements TEXT[],
  photo_b_rating INTEGER CHECK (photo_b_rating >= 1 AND photo_b_rating <= 10),

  -- Additional context
  time_spent_seconds INTEGER,
  judge_expertise TEXT[],
  quality_score INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(split_test_id, judge_id)
);

-- ============================================================================
-- PART 5: CREDIT & PAYMENT TABLES
-- ============================================================================

-- Pricing tiers configuration
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier request_tier NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits_required INTEGER NOT NULL,
  verdict_count INTEGER NOT NULL,
  max_response_time_hours INTEGER,
  features JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit packages for purchase
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT UNIQUE,
  popular BOOLEAN DEFAULT FALSE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions audit log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= -1000 AND amount <= 1000),
  type TEXT NOT NULL, -- 'earned', 'spent', 'purchased', 'refunded'
  description TEXT NOT NULL,
  source TEXT, -- 'judgment', 'payment', 'bonus', etc.
  source_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit audit log (enhanced tracking)
CREATE TABLE IF NOT EXISTS credit_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  before_balance INTEGER,
  after_balance INTEGER,
  success BOOLEAN NOT NULL,
  request_id TEXT,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits (supplementary storage)
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CONSTRAINT chk_balance_non_negative CHECK (balance >= 0),
  pending INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments (Stripe payments)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_purchased INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions (Financial transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'subscription_payment', 'refund', 'payout')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_amount INTEGER,
  description TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER,
  currency TEXT DEFAULT 'gbp',

  -- Features
  credits_per_month INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',

  -- Stripe integration
  stripe_price_id_monthly TEXT UNIQUE,
  stripe_price_id_yearly TEXT UNIQUE,
  stripe_product_id TEXT,

  -- Status
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Stripe data
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'past_due', 'paused', 'trialing')),

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods (saved cards)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,

  -- Card details (non-sensitive)
  card_brand TEXT,
  card_last_four TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Status
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 6: JUDGE SYSTEM TABLES
-- ============================================================================

-- Judge payout accounts (Stripe Connect)
CREATE TABLE IF NOT EXISTS judge_payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  account_type TEXT DEFAULT 'express' CHECK (account_type IN ('express', 'standard', 'custom')),
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  country TEXT,
  default_currency TEXT DEFAULT 'usd',
  requirements JSONB DEFAULT '{}',
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'restricted', 'disabled')),
  onboarding_link TEXT,
  onboarding_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_judge_payout_account UNIQUE (judge_id),
  CONSTRAINT unique_stripe_account UNIQUE (stripe_account_id)
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gross_amount_cents INTEGER NOT NULL CHECK (gross_amount_cents > 0),
  fee_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount_cents >= 0),
  net_amount_cents INTEGER NOT NULL CHECK (net_amount_cents >= 0),
  currency TEXT DEFAULT 'usd',
  payout_method TEXT DEFAULT 'stripe_express' CHECK (payout_method IN ('stripe_express', 'bank_transfer', 'paypal')),
  destination_account_id TEXT,
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  description TEXT,
  earnings_count INTEGER DEFAULT 0,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge earnings tracking
CREATE TABLE IF NOT EXISTS judge_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verdict_response_id UUID REFERENCES verdict_responses(id) ON DELETE CASCADE,
  comparison_verdict_id UUID REFERENCES comparison_verdicts(id) ON DELETE CASCADE,
  split_test_verdict_id UUID REFERENCES split_test_verdicts(id) ON DELETE CASCADE,
  payout_id UUID REFERENCES payouts(id),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
  currency TEXT DEFAULT 'USD',
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'cancelled')),
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge reputation and metrics
CREATE TABLE IF NOT EXISTS judge_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Performance metrics
  total_judgments INTEGER DEFAULT 0,
  quality_score DECIMAL(4,2) DEFAULT 0.00,
  accuracy_score DECIMAL(4,2) DEFAULT 0.00,
  response_time_avg INTEGER DEFAULT 0, -- in seconds

  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_judgment_at TIMESTAMP WITH TIME ZONE,

  -- Rating metrics
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Tier and status
  tier judge_tier DEFAULT 'rookie',
  status reviewer_status DEFAULT 'active',

  -- XP system
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge qualifications
CREATE TABLE IF NOT EXISTS judge_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_score INTEGER NOT NULL,
  quiz_passed BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  test_attempts INTEGER DEFAULT 0,
  qualified_at TIMESTAMPTZ,
  qualification_expires_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,

  -- Application flow
  application_status TEXT DEFAULT 'pending'
    CHECK (application_status IN ('pending', 'approved', 'rejected', 'in_review')),
  experience_level TEXT
    CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  specialties TEXT[],
  motivation_text TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge availability
CREATE TABLE IF NOT EXISTS judge_availability (
  judge_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  avg_response_time_minutes INTEGER DEFAULT 30,
  max_daily_verdicts INTEGER DEFAULT 20,
  current_daily_verdicts INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge demographics
CREATE TABLE IF NOT EXISTS judge_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  age_range TEXT,
  gender TEXT,
  ethnicity TEXT[],
  location TEXT,
  education_level TEXT,
  profession TEXT,
  relationship_status TEXT,
  income_range TEXT,
  lifestyle_tags TEXT[],
  interest_areas TEXT[],
  visibility_preferences JSONB DEFAULT '{"show_age": true, "show_gender": true, "show_ethnicity": false, "show_location": true, "show_education": false, "show_profession": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge ratings (requester feedback on judges)
CREATE TABLE IF NOT EXISTS judge_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verdict_response_id UUID REFERENCES verdict_responses(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(verdict_response_id, rater_id)
);

-- Verdict quality ratings (detailed feedback)
CREATE TABLE IF NOT EXISTS verdict_quality_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_response_id UUID NOT NULL REFERENCES verdict_responses(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Individual ratings
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  constructiveness_rating INTEGER CHECK (constructiveness_rating >= 1 AND constructiveness_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- Additional feedback
  is_featured_worthy BOOLEAN DEFAULT FALSE,
  comment TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_verdict_rating UNIQUE (verdict_response_id, rater_id)
);

-- Judge verifications
CREATE TABLE IF NOT EXISTS judge_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linkedin_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL DEFAULT 'linkedin',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_verification UNIQUE (user_id, verification_type)
);

-- Expert verifications (for expert routing)
CREATE TABLE IF NOT EXISTS expert_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Professional info
  industry TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  years_experience INTEGER,
  linkedin_url TEXT,
  portfolio_url TEXT,

  -- Verification status
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),

  -- Evidence
  verification_evidence JSONB DEFAULT '{}',
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_expert_verification UNIQUE (user_id)
);

-- Verifications audit trail
CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  platform_url TEXT,
  expertise_detected TEXT,
  verification_method VARCHAR(50),
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback responses (requester feedback on verdicts)
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_response_id UUID NOT NULL REFERENCES verdict_responses(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Ratings
  helpfulness INTEGER CHECK (helpfulness >= 1 AND helpfulness <= 5),
  accuracy INTEGER CHECK (accuracy >= 1 AND accuracy <= 5),
  constructiveness INTEGER CHECK (constructiveness >= 1 AND constructiveness <= 5),

  -- Additional feedback
  comment TEXT,
  was_actionable BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_verdict_feedback UNIQUE (verdict_response_id, requester_id)
);

-- ============================================================================
-- PART 7: ORGANIZATION & FOLDERS
-- ============================================================================

-- Decision folders
CREATE TABLE IF NOT EXISTS decision_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================================
-- PART 8: AUTHENTICATION & SECURITY
-- ============================================================================

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT password_reset_not_expired CHECK (expires_at > created_at)
);

-- Email verifications
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT email_verification_not_expired CHECK (expires_at > created_at)
);

-- ============================================================================
-- PART 9: GDPR COMPLIANCE TABLES
-- ============================================================================

-- User consents
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Consent types
  consent_type TEXT NOT NULL
    CHECK (consent_type IN ('marketing', 'analytics', 'personalization', 'terms', 'privacy')),

  -- Consent status
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Version tracking
  policy_version TEXT,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type)
);

-- Data deletion requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Request details
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),

  -- Processing
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),

  -- Audit
  deletion_log JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data exports
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Export details
  format TEXT NOT NULL DEFAULT 'json'
    CHECK (format IN ('json', 'csv', 'zip')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'expired', 'failed')),

  -- File info
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ,

  -- Processing
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,

  -- Audit
  included_data JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 10: NOTIFICATIONS & COMMUNICATION
-- ============================================================================

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL
);

-- User device tokens (push notifications)
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Email preferences
  email_verdict_received BOOLEAN DEFAULT TRUE,
  email_verdict_progress BOOLEAN DEFAULT TRUE,
  email_earnings BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT FALSE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,

  -- Push preferences
  push_enabled BOOLEAN DEFAULT TRUE,
  push_verdict_received BOOLEAN DEFAULT TRUE,
  push_earnings BOOLEAN DEFAULT TRUE,

  -- In-app preferences
  in_app_sounds BOOLEAN DEFAULT TRUE,

  -- Frequency
  digest_frequency TEXT DEFAULT 'weekly'
    CHECK (digest_frequency IN ('daily', 'weekly', 'never')),

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

-- ============================================================================
-- PART 11: GAMIFICATION & ACHIEVEMENTS
-- ============================================================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'trophy',
  category TEXT NOT NULL, -- 'judging', 'quality', 'streak', 'community'
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  xp_reward INTEGER DEFAULT 0,
  credits_reward INTEGER DEFAULT 0,
  requirements JSONB NOT NULL, -- {type: 'count', field: 'total_judgments', value: 100}
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Tips from requesters to judges
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_response_id UUID NOT NULL REFERENCES verdict_responses(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  message TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 12: MODERATION & QUALITY
-- ============================================================================

-- Content reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  request_id UUID REFERENCES verdict_requests(id),
  response_id UUID REFERENCES verdict_responses(id),
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Content flags (auto-moderation)
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES verdict_requests(id),
  response_id UUID REFERENCES verdict_responses(id),
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ai_confidence DECIMAL(3,2),
  action_taken TEXT CHECK (action_taken IN ('none', 'warning', 'hidden', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content moderation logs (AI moderation)
CREATE TABLE IF NOT EXISTS content_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content reference
  content_type TEXT NOT NULL
    CHECK (content_type IN ('request', 'verdict', 'profile', 'image')),
  content_id UUID NOT NULL,

  -- Moderation details
  moderation_source TEXT NOT NULL
    CHECK (moderation_source IN ('ai', 'manual', 'user_report')),

  -- AI moderation results
  ai_provider TEXT,
  ai_model TEXT,
  ai_scores JSONB,
  ai_categories JSONB,
  ai_flagged BOOLEAN,

  -- Decision
  action_taken TEXT
    CHECK (action_taken IN ('approved', 'flagged', 'removed', 'warning', 'none')),
  action_reason TEXT,

  -- Manual review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 13: SUPPORT SYSTEM
-- ============================================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support ticket replies
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 14: HELP CENTER
-- ============================================================================

-- Help articles
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL
    CHECK (category IN ('getting_started', 'judging', 'payments', 'account', 'troubleshooting', 'faq')),
  tags TEXT[] DEFAULT '{}',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,

  -- Stats
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Authoring
  author_id UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Help article feedback
CREATE TABLE IF NOT EXISTS help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Feedback
  helpful BOOLEAN NOT NULL,
  comment TEXT,

  -- Tracking
  session_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_article_feedback UNIQUE (article_id, user_id)
);

-- Popular searches (analytics)
CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search data
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,

  -- Stats
  search_count INTEGER DEFAULT 1,
  result_count INTEGER,
  click_through_count INTEGER DEFAULT 0,

  -- Time tracking
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_normalized_query UNIQUE (normalized_query)
);

-- ============================================================================
-- PART 15: ONBOARDING & PROFILE COMPLETION
-- ============================================================================

-- Profile completion steps
CREATE TABLE IF NOT EXISTS profile_completion_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Step tracking
  step_name TEXT NOT NULL
    CHECK (step_name IN ('email_verification', 'basic_profile', 'preferences', 'first_request', 'judge_qualification')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_step UNIQUE (user_id, step_name)
);

-- ============================================================================
-- PART 16: WEBHOOKS & RATE LIMITING
-- ============================================================================

-- Webhook events processed (idempotency)
CREATE TABLE IF NOT EXISTS webhook_events_processed (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

-- ============================================================================
-- PART 17: AUDIT & ADMIN
-- ============================================================================

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Admin request actions
CREATE TABLE IF NOT EXISTS admin_request_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request status transition tracking
CREATE TABLE IF NOT EXISTS request_status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'verdict' CHECK (request_type IN ('verdict', 'comparison', 'split_test')),
  from_status request_status,
  to_status request_status NOT NULL,
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trigger_reason TEXT CHECK (trigger_reason IN ('user_action', 'target_reached', 'admin_action', 'timeout', 'cancellation', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 18: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_judge ON profiles(is_judge);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_verified ON profiles(linkedin_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_expertise ON profiles(expertise_area);

-- Request indexes
CREATE INDEX IF NOT EXISTS idx_verdict_requests_user ON verdict_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_requests_status ON verdict_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_requests_pending ON verdict_requests(status, created_at ASC) WHERE status = 'open';

-- Response indexes
CREATE INDEX IF NOT EXISTS idx_verdict_responses_request ON verdict_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_verdict_responses_judge ON verdict_responses(judge_id, created_at DESC);

-- Credit indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_audit_user ON credit_audit_log(user_id, timestamp DESC);

-- Judge indexes
CREATE INDEX IF NOT EXISTS idx_judge_earnings_judge ON judge_earnings(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_earnings_status ON judge_earnings(payout_status);
CREATE INDEX IF NOT EXISTS idx_judge_earnings_payout ON judge_earnings(payout_id);
CREATE INDEX IF NOT EXISTS idx_judge_ratings_judge ON judge_ratings(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_user ON judge_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_status ON judge_verifications(status);
CREATE INDEX IF NOT EXISTS idx_judge_payout_accounts_judge ON judge_payout_accounts(judge_id);
CREATE INDEX IF NOT EXISTS idx_payouts_judge ON payouts(judge_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_status_transitions_request ON request_status_transitions(request_id);
CREATE INDEX IF NOT EXISTS idx_status_transitions_created ON request_status_transitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_judge_qualifications_status ON judge_qualifications(application_status);

-- Comparison/Split test indexes
CREATE INDEX IF NOT EXISTS idx_comparison_verdicts_comparison ON comparison_verdicts(comparison_id);
CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_split_test ON split_test_verdicts(split_test_id);

-- Expert verification indexes
CREATE INDEX IF NOT EXISTS idx_expert_verifications_user ON expert_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_verifications_status ON expert_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_expert_verifications_industry ON expert_verifications(industry);

-- Verdict quality rating indexes
CREATE INDEX IF NOT EXISTS idx_verdict_quality_ratings_verdict ON verdict_quality_ratings(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_verdict_quality_ratings_rater ON verdict_quality_ratings(rater_id);

-- Feedback response indexes
CREATE INDEX IF NOT EXISTS idx_feedback_responses_verdict ON feedback_responses(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_requester ON feedback_responses(requester_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Webhook/rate limit indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_expires ON webhook_events_processed(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Password/email verification indexes
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token) WHERE verified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- GDPR indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_expires ON data_exports(expires_at);

-- Help center indexes
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published, featured);
CREATE INDEX IF NOT EXISTS idx_help_article_feedback_article ON help_article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_recent ON popular_searches(last_searched_at DESC);

-- Profile completion indexes
CREATE INDEX IF NOT EXISTS idx_profile_completion_user ON profile_completion_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_completion_step ON profile_completion_steps(step_name, completed);

-- Content moderation indexes
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation_logs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_flagged ON content_moderation_logs(ai_flagged) WHERE ai_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_moderation_action ON content_moderation_logs(action_taken);

-- Stripe idempotency indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_session_unique
ON transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_intent_unique
ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Ensure one earnings record per verdict
CREATE UNIQUE INDEX IF NOT EXISTS idx_judge_earnings_verdict_unique
ON judge_earnings(verdict_response_id) WHERE verdict_response_id IS NOT NULL;

-- ============================================================================
-- PART 19: STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('verdict-media', 'verdict-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('requests', 'requests', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('split-test-photos', 'split-test-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('comparison-images', 'comparison-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 20: FUNCTIONS - ADVISORY LOCKING
-- ============================================================================

CREATE OR REPLACE FUNCTION try_advisory_lock(lock_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pg_try_advisory_lock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION advisory_unlock(lock_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pg_advisory_unlock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 21: FUNCTIONS - ATOMIC CREDIT OPERATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_credits INT)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  current_balance INT;
  updated_balance INT;
BEGIN
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;
  UPDATE profiles SET credits = credits + p_credits, updated_at = NOW() WHERE id = p_user_id RETURNING credits INTO updated_balance;
  RETURN QUERY SELECT TRUE, updated_balance, 'Credits added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INT)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  current_balance INT;
  updated_balance INT;
BEGIN
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;
  IF current_balance < p_credits THEN
    RETURN QUERY SELECT FALSE, current_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  UPDATE profiles SET credits = credits - p_credits, updated_at = NOW() WHERE id = p_user_id RETURNING credits INTO updated_balance;
  RETURN QUERY SELECT TRUE, updated_balance, 'Credits deducted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_credits INT,
  p_request_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Credits spent'
)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  current_balance INT;
  updated_balance INT;
BEGIN
  -- Lock user row to prevent concurrent modifications
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;

  IF current_balance < p_credits THEN
    RETURN QUERY SELECT FALSE, current_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET credits = credits - p_credits,
      total_spent = total_spent + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO updated_balance;

  -- Log the transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, source, metadata)
  VALUES (
    p_user_id,
    -p_credits,
    'spent',
    p_description,
    'request',
    CASE WHEN p_request_id IS NOT NULL
      THEN jsonb_build_object('request_id', p_request_id)
      ELSE '{}'::jsonb
    END
  );

  RETURN QUERY SELECT TRUE, updated_balance, 'Credits spent successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refund_credits(p_user_id UUID, p_credits INT, p_reason TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  updated_balance INT;
BEGIN
  UPDATE profiles SET credits = credits + p_credits, updated_at = NOW() WHERE id = p_user_id RETURNING credits INTO updated_balance;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;
  -- Log the refund
  INSERT INTO credit_transactions (user_id, amount, type, description, source)
  VALUES (p_user_id, p_credits, 'refund', COALESCE(p_reason, 'Credit refund'), 'refund');
  RETURN QUERY SELECT TRUE, updated_balance, 'Credits refunded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION award_credits(
  target_user_id UUID,
  credit_amount DECIMAL,
  transaction_type TEXT,
  transaction_source TEXT,
  transaction_source_id UUID DEFAULT NULL,
  transaction_description TEXT DEFAULT 'Credits awarded'
)
RETURNS BOOLEAN AS $$
DECLARE
  rounded_amount INT;
BEGIN
  -- Round to nearest integer for storage
  rounded_amount := ROUND(credit_amount);
  IF rounded_amount < 1 THEN
    rounded_amount := 0; -- Don't award partial credits
  END IF;

  -- Update balance
  UPDATE profiles SET credits = credits + rounded_amount, updated_at = NOW() WHERE id = target_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, source, source_id)
  VALUES (target_user_id, rounded_amount, transaction_type, transaction_description, transaction_source, transaction_source_id);

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Atomic credit purchase (with idempotency)
CREATE OR REPLACE FUNCTION process_credit_purchase(
  p_user_id UUID,
  p_credits INT,
  p_stripe_session_id TEXT,
  p_amount_cents INT,
  p_description TEXT DEFAULT 'Credit purchase'
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance INT,
  message TEXT,
  already_processed BOOLEAN
) AS $$
DECLARE
  existing_tx_id UUID;
  current_balance INT;
  updated_balance INT;
BEGIN
  -- Check for existing completed transaction (idempotency)
  SELECT id INTO existing_tx_id
  FROM transactions
  WHERE stripe_session_id = p_stripe_session_id
    AND status = 'completed';

  IF existing_tx_id IS NOT NULL THEN
    -- Already processed - return current balance without error
    SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id;
    RETURN QUERY SELECT TRUE, COALESCE(current_balance, 0), 'Already processed'::TEXT, TRUE;
    RETURN;
  END IF;

  -- Lock user row to prevent concurrent modifications
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT, FALSE;
    RETURN;
  END IF;

  -- Add credits to profile
  UPDATE profiles
  SET credits = credits + p_credits,
      total_earned = total_earned + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO updated_balance;

  -- Create or update transaction record
  INSERT INTO transactions (
    user_id,
    stripe_session_id,
    type,
    status,
    amount,
    credits_amount,
    description
  ) VALUES (
    p_user_id,
    p_stripe_session_id,
    'credit_purchase',
    'completed',
    p_amount_cents / 100.0,
    p_credits,
    p_description
  )
  ON CONFLICT (stripe_session_id) WHERE stripe_session_id IS NOT NULL
  DO UPDATE SET
    status = 'completed',
    credits_amount = p_credits,
    updated_at = NOW();

  -- Create audit trail in credit_transactions
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    source,
    metadata
  )
  VALUES (
    p_user_id,
    p_credits,
    'purchased',
    p_description,
    'stripe',
    jsonb_build_object(
      'stripe_session_id', p_stripe_session_id,
      'amount_cents', p_amount_cents
    )
  );

  RETURN QUERY SELECT TRUE, updated_balance, 'Credits added successfully'::TEXT, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 22: FUNCTIONS - JUDGE REPUTATION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_judge_reputation(
  p_judge_id UUID,
  p_quality_delta INTEGER DEFAULT 0,
  p_consensus_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO judge_reputation (user_id, total_judgments, quality_score)
  VALUES (p_judge_id, 1, p_quality_delta)
  ON CONFLICT (user_id) DO UPDATE SET
    total_judgments = judge_reputation.total_judgments + 1,
    quality_score = LEAST(100, GREATEST(0, judge_reputation.quality_score + p_quality_delta)),
    last_judgment_at = NOW(),
    current_streak = CASE
      WHEN judge_reputation.last_judgment_at > NOW() - INTERVAL '25 hours'
      THEN judge_reputation.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(judge_reputation.longest_streak,
      CASE
        WHEN judge_reputation.last_judgment_at > NOW() - INTERVAL '25 hours'
        THEN judge_reputation.current_streak + 1
        ELSE 1
      END),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 23: FUNCTIONS - NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications SET read = TRUE, read_at = NOW() WHERE id = notification_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications SET read = TRUE, read_at = NOW()
  WHERE user_id = target_user_id AND read = FALSE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_val FROM notifications WHERE user_id = target_user_id AND read = FALSE;
  RETURN count_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 24: FUNCTIONS - WEBHOOKS & RATE LIMITING
-- ============================================================================

CREATE OR REPLACE FUNCTION process_webhook_event(p_event_id TEXT, p_event_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM webhook_events_processed WHERE expires_at < NOW();
  BEGIN
    INSERT INTO webhook_events_processed (event_id, event_type) VALUES (p_event_id, p_event_type);
    RETURN TRUE;
  EXCEPTION WHEN unique_violation THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_max_requests INTEGER, p_window_seconds INTEGER)
RETURNS JSON AS $$
DECLARE
  current_count INTEGER := 0;
  window_start TIMESTAMP WITH TIME ZONE;
  reset_time TIMESTAMP WITH TIME ZONE;
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
  SELECT count, rl.window_start, expires_at INTO current_count, window_start, reset_time FROM rate_limits rl WHERE key = p_key;
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (p_key, 1, NOW(), NOW() + INTERVAL '1 second' * p_window_seconds);
    RETURN json_build_object('allowed', true, 'count', 1, 'remaining', p_max_requests - 1);
  END IF;
  IF NOW() > window_start + INTERVAL '1 second' * p_window_seconds THEN
    UPDATE rate_limits SET count = 1, window_start = NOW(), expires_at = NOW() + INTERVAL '1 second' * p_window_seconds WHERE key = p_key;
    RETURN json_build_object('allowed', true, 'count', 1, 'remaining', p_max_requests - 1);
  END IF;
  IF current_count >= p_max_requests THEN
    RETURN json_build_object('allowed', false, 'count', current_count, 'remaining', 0);
  END IF;
  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN json_build_object('allowed', true, 'count', current_count + 1, 'remaining', p_max_requests - (current_count + 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 25: FUNCTIONS - VERDICT COUNT & AUTO-CLOSE
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_verdict_count_and_close(p_request_id UUID)
RETURNS verdict_requests AS $$
DECLARE
  updated_row verdict_requests;
BEGIN
  UPDATE verdict_requests
  SET received_verdict_count = received_verdict_count + 1,
      status = CASE WHEN received_verdict_count + 1 >= target_verdict_count THEN 'closed'::request_status ELSE 'in_progress'::request_status END,
      updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO updated_row;
  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Request % not found', p_request_id;
  END IF;
  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comparison_verdict_count_and_close(p_comparison_id UUID)
RETURNS comparison_requests AS $$
DECLARE
  updated_row comparison_requests;
BEGIN
  UPDATE comparison_requests
  SET received_verdict_count = received_verdict_count + 1,
      status = CASE
        WHEN received_verdict_count + 1 >= target_verdict_count THEN 'closed'::request_status
        ELSE 'in_progress'::request_status
      END,
      updated_at = NOW()
  WHERE id = p_comparison_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Comparison request % not found', p_comparison_id;
  END IF;

  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_split_test_verdict_count_and_close(p_split_test_id UUID)
RETURNS split_test_requests AS $$
DECLARE
  updated_row split_test_requests;
BEGIN
  UPDATE split_test_requests
  SET received_verdict_count = received_verdict_count + 1,
      status = CASE
        WHEN received_verdict_count + 1 >= target_verdict_count THEN 'closed'::request_status
        ELSE 'in_progress'::request_status
      END,
      updated_at = NOW()
  WHERE id = p_split_test_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Split test request % not found', p_split_test_id;
  END IF;

  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 26: FUNCTIONS - PAYOUT OPERATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_payout_amount(target_judge_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_cents INTEGER;
BEGIN
  SELECT COALESCE(SUM(CAST(amount * 100 AS INTEGER)), 0) INTO total_cents
  FROM judge_earnings
  WHERE judge_id = target_judge_id
    AND payout_status = 'pending'
    AND payout_id IS NULL
    AND created_at < NOW() - INTERVAL '7 days';

  RETURN total_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_judge_earnings_summary(target_judge_id UUID)
RETURNS TABLE(
  total_earned_cents INTEGER,
  pending_cents INTEGER,
  available_for_payout_cents INTEGER,
  paid_cents INTEGER,
  earnings_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CAST(amount * 100 AS INTEGER)), 0) AS total_earned_cents,
    COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN CAST(amount * 100 AS INTEGER) ELSE 0 END), 0) AS pending_cents,
    COALESCE(SUM(CASE WHEN payout_status = 'pending' AND payout_id IS NULL AND created_at < NOW() - INTERVAL '7 days' THEN CAST(amount * 100 AS INTEGER) ELSE 0 END), 0) AS available_for_payout_cents,
    COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN CAST(amount * 100 AS INTEGER) ELSE 0 END), 0) AS paid_cents,
    COUNT(*)::INTEGER AS earnings_count
  FROM judge_earnings
  WHERE judge_id = target_judge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 27: FUNCTIONS - STATUS TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_request_status_transition(
  p_request_id UUID,
  p_from_status request_status,
  p_to_status request_status,
  p_triggered_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'system',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  transition_id UUID;
BEGIN
  INSERT INTO request_status_transitions (
    request_id,
    from_status,
    to_status,
    triggered_by,
    trigger_reason,
    metadata
  )
  VALUES (
    p_request_id,
    p_from_status,
    p_to_status,
    p_triggered_by,
    p_reason,
    p_metadata
  )
  RETURNING id INTO transition_id;

  RETURN transition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 28: FUNCTIONS - EMAIL VERIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_email_verification(
  p_user_id UUID,
  p_email TEXT
)
RETURNS TABLE(token TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := NOW() + INTERVAL '24 hours';

  -- Invalidate any existing tokens for this user
  UPDATE email_verifications
  SET verified_at = NOW()
  WHERE user_id = p_user_id AND verified_at IS NULL;

  -- Create new verification
  INSERT INTO email_verifications (user_id, email, token, expires_at)
  VALUES (p_user_id, p_email, v_token, v_expires);

  RETURN QUERY SELECT v_token, v_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_email(p_token TEXT)
RETURNS TABLE(success BOOLEAN, user_id UUID, message TEXT) AS $$
DECLARE
  v_verification email_verifications%ROWTYPE;
BEGIN
  -- Find valid token
  SELECT * INTO v_verification
  FROM email_verifications
  WHERE token = p_token
    AND verified_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid or expired verification token'::TEXT;
    RETURN;
  END IF;

  -- Mark as verified
  UPDATE email_verifications
  SET verified_at = NOW()
  WHERE id = v_verification.id;

  -- Update profile
  UPDATE profiles
  SET email_verified = TRUE, updated_at = NOW()
  WHERE id = v_verification.user_id;

  RETURN QUERY SELECT TRUE, v_verification.user_id, 'Email verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 29: FUNCTIONS - PASSWORD RESET
-- ============================================================================

CREATE OR REPLACE FUNCTION create_password_reset(p_email TEXT)
RETURNS TABLE(token TEXT, expires_at TIMESTAMPTZ, user_id UUID) AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF NOT FOUND THEN
    -- Don't reveal if email exists - return dummy data
    RETURN QUERY SELECT NULL::TEXT, NULL::TIMESTAMPTZ, NULL::UUID;
    RETURN;
  END IF;

  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := NOW() + INTERVAL '1 hour';

  -- Invalidate existing tokens
  UPDATE password_resets
  SET used_at = NOW()
  WHERE user_id = v_user_id AND used_at IS NULL;

  -- Create new reset token
  INSERT INTO password_resets (user_id, token, expires_at)
  VALUES (v_user_id, v_token, v_expires);

  RETURN QUERY SELECT v_token, v_expires, v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_password_reset(p_token TEXT)
RETURNS TABLE(valid BOOLEAN, user_id UUID, message TEXT) AS $$
DECLARE
  v_reset password_resets%ROWTYPE;
BEGIN
  -- Find valid token
  SELECT * INTO v_reset
  FROM password_resets
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid or expired reset token'::TEXT;
    RETURN;
  END IF;

  -- Mark as used
  UPDATE password_resets
  SET used_at = NOW()
  WHERE id = v_reset.id;

  RETURN QUERY SELECT TRUE, v_reset.user_id, 'Token verified'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 30: FUNCTIONS - SUBSCRIPTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION process_subscription_renewal(
  p_stripe_subscription_id TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE(success BOOLEAN, subscription_id UUID, credits_added INTEGER) AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_credits INTEGER;
BEGIN
  -- Find subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0;
    RETURN;
  END IF;

  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  v_credits := COALESCE(v_plan.credits_per_month, 0);

  -- Update subscription period
  UPDATE subscriptions
  SET current_period_start = p_period_start,
      current_period_end = p_period_end,
      status = 'active',
      updated_at = NOW()
  WHERE id = v_subscription.id;

  -- Add monthly credits
  IF v_credits > 0 THEN
    UPDATE profiles
    SET credits = credits + v_credits,
        updated_at = NOW()
    WHERE id = v_subscription.user_id;

    -- Log transaction
    INSERT INTO credit_transactions (user_id, amount, type, description, source, metadata)
    VALUES (
      v_subscription.user_id,
      v_credits,
      'earned',
      'Monthly subscription credits',
      'subscription',
      jsonb_build_object('subscription_id', v_subscription.id, 'plan', v_plan.name)
    );
  END IF;

  RETURN QUERY SELECT TRUE, v_subscription.id, v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 31: FUNCTIONS - PROFILE COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_profile_completion_status(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_steps JSONB;
  v_completed_count INTEGER;
  v_total_steps INTEGER := 5;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Get completed steps
  SELECT jsonb_object_agg(step_name, completed)
  INTO v_steps
  FROM profile_completion_steps
  WHERE user_id = target_user_id;

  v_steps := COALESCE(v_steps, '{}'::jsonb);

  -- Count completed
  SELECT COUNT(*) INTO v_completed_count
  FROM profile_completion_steps
  WHERE user_id = target_user_id AND completed = TRUE;

  RETURN jsonb_build_object(
    'user_id', target_user_id,
    'email_verified', v_profile.email_verified,
    'has_full_name', v_profile.full_name IS NOT NULL,
    'has_avatar', v_profile.avatar_url IS NOT NULL,
    'is_judge', v_profile.is_judge,
    'steps', v_steps,
    'completed_count', v_completed_count,
    'total_steps', v_total_steps,
    'completion_percentage', ROUND((v_completed_count::NUMERIC / v_total_steps) * 100),
    'is_completed', v_completed_count >= v_total_steps
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 32: FUNCTIONS - SEARCH
-- ============================================================================

CREATE OR REPLACE FUNCTION search_requests(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  question TEXT,
  category TEXT,
  status request_status,
  created_at TIMESTAMPTZ,
  verdict_count INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vr.id,
    vr.question,
    vr.category::TEXT,
    vr.status,
    vr.created_at,
    vr.received_verdict_count::INTEGER,
    ts_rank(
      to_tsvector('english', COALESCE(vr.question, '') || ' ' || COALESCE(vr.context, '')),
      plainto_tsquery('english', p_query)
    ) AS relevance
  FROM verdict_requests vr
  WHERE
    -- Text search
    to_tsvector('english', COALESCE(vr.question, '') || ' ' || COALESCE(vr.context, ''))
      @@ plainto_tsquery('english', p_query)
    -- Filters
    AND (p_category IS NULL OR vr.category::TEXT = p_category)
    AND (p_status IS NULL OR vr.status::TEXT = p_status)
    -- Only public/community requests
    AND vr.visibility = 'public'
  ORDER BY relevance DESC, vr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_search(
  p_query TEXT,
  p_result_count INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  -- Normalize query
  v_normalized := LOWER(TRIM(p_query));

  -- Update or insert
  INSERT INTO popular_searches (query, normalized_query, result_count, search_count, last_searched_at)
  VALUES (p_query, v_normalized, p_result_count, 1, NOW())
  ON CONFLICT (normalized_query) DO UPDATE
  SET search_count = popular_searches.search_count + 1,
      result_count = COALESCE(EXCLUDED.result_count, popular_searches.result_count),
      last_searched_at = NOW(),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 33: TRIGGERS - ONBOARDING COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_verified = TRUE
     AND NEW.profile_completed = TRUE
     AND NEW.guidelines_accepted = TRUE
     AND (NEW.onboarding_completed = FALSE OR NEW.onboarding_completed IS NULL)
  THEN
    NEW.onboarding_completed = TRUE;
    NEW.onboarding_completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_onboarding_completion ON profiles;
CREATE TRIGGER trigger_check_onboarding_completion
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION check_onboarding_completion();

-- ============================================================================
-- PART 34: ROW LEVEL SECURITY - ENABLE
-- ============================================================================

-- Core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_test_verdicts ENABLE ROW LEVEL SECURITY;

-- Credit & payment tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Judge tables
ALTER TABLE judge_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_quality_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Other tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_completion_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 35: ROW LEVEL SECURITY - POLICIES
-- ============================================================================

-- Profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Request policies
DROP POLICY IF EXISTS "Users can view own requests" ON verdict_requests;
CREATE POLICY "Users can view own requests" ON verdict_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create requests" ON verdict_requests;
CREATE POLICY "Users can create requests" ON verdict_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Judges can view open requests" ON verdict_requests;
CREATE POLICY "Judges can view open requests" ON verdict_requests FOR SELECT
  USING (status IN ('open', 'in_progress') AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_judge = true));

-- Response policies
DROP POLICY IF EXISTS "Judges can create responses" ON verdict_responses;
CREATE POLICY "Judges can create responses" ON verdict_responses FOR INSERT WITH CHECK (auth.uid() = judge_id);
DROP POLICY IF EXISTS "Users can view responses on own requests" ON verdict_responses;
CREATE POLICY "Users can view responses on own requests" ON verdict_responses FOR SELECT
  USING (auth.uid() = judge_id OR auth.uid() = (SELECT user_id FROM verdict_requests WHERE id = request_id));

-- Judge verification policies
DROP POLICY IF EXISTS "Users can view own verifications" ON judge_verifications;
CREATE POLICY "Users can view own verifications" ON judge_verifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own verifications" ON judge_verifications;
CREATE POLICY "Users can create own verifications" ON judge_verifications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Expert verification policies
DROP POLICY IF EXISTS "Users can view own expert verification" ON expert_verifications;
CREATE POLICY "Users can view own expert verification" ON expert_verifications
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own expert verification" ON expert_verifications;
CREATE POLICY "Users can create own expert verification" ON expert_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all expert verifications" ON expert_verifications;
CREATE POLICY "Admins can view all expert verifications" ON expert_verifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
DROP POLICY IF EXISTS "Admins can update expert verifications" ON expert_verifications;
CREATE POLICY "Admins can update expert verifications" ON expert_verifications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Verdict quality rating policies
DROP POLICY IF EXISTS "Users can rate verdicts on their requests" ON verdict_quality_ratings;
CREATE POLICY "Users can rate verdicts on their requests" ON verdict_quality_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM verdict_responses vr
      JOIN verdict_requests req ON vr.request_id = req.id
      WHERE vr.id = verdict_response_id AND req.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can view their ratings" ON verdict_quality_ratings;
CREATE POLICY "Users can view their ratings" ON verdict_quality_ratings
  FOR SELECT USING (rater_id = auth.uid());
DROP POLICY IF EXISTS "Judges can view ratings on their verdicts" ON verdict_quality_ratings;
CREATE POLICY "Judges can view ratings on their verdicts" ON verdict_quality_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verdict_responses WHERE id = verdict_response_id AND judge_id = auth.uid()
    )
  );

-- Feedback response policies
DROP POLICY IF EXISTS "Requesters can submit feedback on their request verdicts" ON feedback_responses;
CREATE POLICY "Requesters can submit feedback on their request verdicts" ON feedback_responses
  FOR INSERT WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM verdict_responses vr
      JOIN verdict_requests req ON vr.request_id = req.id
      WHERE vr.id = verdict_response_id AND req.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can view feedback they submitted" ON feedback_responses;
CREATE POLICY "Users can view feedback they submitted" ON feedback_responses
  FOR SELECT USING (requester_id = auth.uid());
DROP POLICY IF EXISTS "Judges can view feedback on their verdicts" ON feedback_responses;
CREATE POLICY "Judges can view feedback on their verdicts" ON feedback_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verdict_responses WHERE id = verdict_response_id AND judge_id = auth.uid()
    )
  );

-- Admin notification policies
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
CREATE POLICY "Admins can view notifications" ON admin_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications" ON admin_notifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Support policies
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id);

-- Credit policies
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Folder policies
DROP POLICY IF EXISTS "Users can manage own folders" ON decision_folders;
CREATE POLICY "Users can manage own folders" ON decision_folders FOR ALL USING (auth.uid() = user_id);

-- Judge payout account policies
DROP POLICY IF EXISTS "Judges can view own payout account" ON judge_payout_accounts;
CREATE POLICY "Judges can view own payout account" ON judge_payout_accounts
  FOR SELECT USING (auth.uid() = judge_id);
DROP POLICY IF EXISTS "Judges can update own payout account" ON judge_payout_accounts;
CREATE POLICY "Judges can update own payout account" ON judge_payout_accounts
  FOR UPDATE USING (auth.uid() = judge_id);

-- Payout policies
DROP POLICY IF EXISTS "Judges can view own payouts" ON payouts;
CREATE POLICY "Judges can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = judge_id);

-- Status transition policies
DROP POLICY IF EXISTS "Users can view transitions for own requests" ON request_status_transitions;
CREATE POLICY "Users can view transitions for own requests" ON request_status_transitions
  FOR SELECT USING (
    auth.uid() = triggered_by OR
    auth.uid() = (SELECT user_id FROM verdict_requests WHERE id = request_id)
  );

-- Subscription plan policies
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (active = TRUE);

-- Subscription policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Payment method policies
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;
CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (user_id = auth.uid());

-- Password reset and email verification - service role only
DROP POLICY IF EXISTS "Service role only" ON password_resets;
CREATE POLICY "Service role only" ON password_resets
  FOR ALL USING (false);
DROP POLICY IF EXISTS "Service role only" ON email_verifications;
CREATE POLICY "Service role only" ON email_verifications
  FOR ALL USING (false);

-- GDPR consent policies
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
CREATE POLICY "Users can insert own consents" ON user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own consents" ON user_consents;
CREATE POLICY "Users can update own consents" ON user_consents
  FOR UPDATE USING (user_id = auth.uid());

-- GDPR deletion request policies
DROP POLICY IF EXISTS "Users can view own deletion requests" ON data_deletion_requests;
CREATE POLICY "Users can view own deletion requests" ON data_deletion_requests
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own deletion requests" ON data_deletion_requests;
CREATE POLICY "Users can create own deletion requests" ON data_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- GDPR data export policies
DROP POLICY IF EXISTS "Users can view own exports" ON data_exports;
CREATE POLICY "Users can view own exports" ON data_exports
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can request own exports" ON data_exports;
CREATE POLICY "Users can request own exports" ON data_exports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Help center policies
DROP POLICY IF EXISTS "Anyone can view published articles" ON help_articles;
CREATE POLICY "Anyone can view published articles" ON help_articles
  FOR SELECT USING (published = TRUE);
DROP POLICY IF EXISTS "Admins can manage articles" ON help_articles;
CREATE POLICY "Admins can manage articles" ON help_articles
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Help article feedback policies
DROP POLICY IF EXISTS "Users can submit feedback" ON help_article_feedback;
CREATE POLICY "Users can submit feedback" ON help_article_feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view own feedback" ON help_article_feedback;
CREATE POLICY "Users can view own feedback" ON help_article_feedback
  FOR SELECT USING (user_id = auth.uid());

-- Profile completion policies
DROP POLICY IF EXISTS "Users can view own steps" ON profile_completion_steps;
CREATE POLICY "Users can view own steps" ON profile_completion_steps
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own steps" ON profile_completion_steps;
CREATE POLICY "Users can insert own steps" ON profile_completion_steps
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own steps" ON profile_completion_steps;
CREATE POLICY "Users can update own steps" ON profile_completion_steps
  FOR UPDATE USING (user_id = auth.uid());

-- Content moderation log policies - admin only
DROP POLICY IF EXISTS "Admins can view moderation logs" ON content_moderation_logs;
CREATE POLICY "Admins can view moderation logs" ON content_moderation_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- PART 36: STORAGE POLICIES
-- ============================================================================

-- Verdict media
DROP POLICY IF EXISTS "Anyone can view verdict media" ON storage.objects;
CREATE POLICY "Anyone can view verdict media" ON storage.objects FOR SELECT USING (bucket_id = 'verdict-media');

DROP POLICY IF EXISTS "Authenticated users can upload verdict media" ON storage.objects;
CREATE POLICY "Authenticated users can upload verdict media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verdict-media' AND auth.role() = 'authenticated');

-- Requests bucket
DROP POLICY IF EXISTS "Anyone can view requests" ON storage.objects;
CREATE POLICY "Anyone can view requests" ON storage.objects FOR SELECT USING (bucket_id = 'requests');

DROP POLICY IF EXISTS "Authenticated users can upload requests" ON storage.objects;
CREATE POLICY "Authenticated users can upload requests" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'requests' AND auth.role() = 'authenticated');

-- Split test photos
DROP POLICY IF EXISTS "Anyone can view split test photos" ON storage.objects;
CREATE POLICY "Anyone can view split test photos" ON storage.objects FOR SELECT USING (bucket_id = 'split-test-photos');

DROP POLICY IF EXISTS "Authenticated users can upload split test photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload split test photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'split-test-photos' AND auth.role() = 'authenticated');

-- Comparison images
DROP POLICY IF EXISTS "Anyone can view comparison images" ON storage.objects;
CREATE POLICY "Anyone can view comparison images" ON storage.objects FOR SELECT USING (bucket_id = 'comparison-images');

DROP POLICY IF EXISTS "Authenticated users can upload comparison images" ON storage.objects;
CREATE POLICY "Authenticated users can upload comparison images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comparison-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- PART 37: DEFAULT DATA
-- ============================================================================

-- Default credit packages
INSERT INTO credit_packages (name, credits, price, popular, description) VALUES
  ('Starter', 5, 4.99, false, 'Perfect for trying out Verdict'),
  ('Popular', 10, 8.99, true, 'Most popular choice'),
  ('Pro', 25, 19.99, false, 'Best value for regular users'),
  ('Enterprise', 100, 69.99, false, 'For power users')
ON CONFLICT DO NOTHING;

-- Default pricing tiers
INSERT INTO pricing_tiers (tier, name, description, credits_required, verdict_count, max_response_time_hours, sort_order) VALUES
  ('community', 'Community', 'Free verdicts from community members', 0, 3, 48, 1),
  ('standard', 'Standard', 'Quality verdicts with faster response', 1, 5, 24, 2),
  ('pro', 'Pro', 'Premium verdicts with expert routing', 2, 8, 12, 3),
  ('enterprise', 'Enterprise', 'Full service with dedicated support', 5, 15, 4, 4)
ON CONFLICT DO NOTHING;

-- Default achievements
INSERT INTO achievements (slug, name, description, icon, category, tier, xp_reward, requirements) VALUES
  ('first_judgment', 'First Verdict', 'Submit your first verdict', 'gavel', 'judging', 'bronze', 10, '{"type": "count", "field": "total_reviews", "value": 1}'),
  ('ten_judgments', 'Getting Started', 'Complete 10 verdicts', 'trending-up', 'judging', 'bronze', 50, '{"type": "count", "field": "total_reviews", "value": 10}'),
  ('fifty_judgments', 'Active Judge', 'Complete 50 verdicts', 'award', 'judging', 'silver', 100, '{"type": "count", "field": "total_reviews", "value": 50}'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day judging streak', 'flame', 'streak', 'silver', 75, '{"type": "streak", "value": 7}'),
  ('quality_star', 'Quality Star', 'Achieve 4.5+ average rating', 'star', 'quality', 'gold', 150, '{"type": "rating", "value": 4.5}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 38: GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;

-- Specific grants for payout tables
GRANT SELECT, INSERT, UPDATE ON judge_payout_accounts TO authenticated, service_role;
GRANT SELECT, INSERT ON payouts TO authenticated, service_role;
GRANT UPDATE ON payouts TO service_role;
GRANT SELECT, INSERT ON request_status_transitions TO authenticated, service_role;

-- ============================================================================
-- PART 39: VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERDICT DATABASE SCHEMA - COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tables: 55+';
  RAISE NOTICE 'Functions: 30+';
  RAISE NOTICE 'Storage Buckets: 4';
  RAISE NOTICE 'RLS Policies: Enabled';
  RAISE NOTICE 'Default Data: Inserted';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Includes:';
  RAISE NOTICE '  - Core tables (profiles, requests, responses)';
  RAISE NOTICE '  - Credit system (transactions, atomic operations)';
  RAISE NOTICE '  - Judge system (earnings, reputation, payouts)';
  RAISE NOTICE '  - Comparison & Split Test features';
  RAISE NOTICE '  - Authentication (email verification, password reset)';
  RAISE NOTICE '  - Subscriptions & Payment methods';
  RAISE NOTICE '  - GDPR compliance (consents, deletion, exports)';
  RAISE NOTICE '  - Notifications & Preferences';
  RAISE NOTICE '  - Help Center';
  RAISE NOTICE '  - Content Moderation';
  RAISE NOTICE '  - Admin & Audit logs';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Consolidated: 2026-02-11';
  RAISE NOTICE 'Ready for production deployment!';
END $$;
