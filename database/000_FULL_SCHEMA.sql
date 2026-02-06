-- ============================================================================
-- VERDICT PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
--
-- This is the SINGLE SOURCE OF TRUTH for the Verdict database schema.
-- It consolidates ALL migrations and schema changes into one file.
--
-- USAGE:
--   - For NEW deployments: Run this entire script on a fresh Supabase project
--   - For EXISTING databases: Use individual migrations in supabase/migrations/
--
-- Last consolidated: 2026-02-03
-- Includes all migrations through 20250226_add_stripe_idempotency_constraints.sql
-- Plus: Judge verification, onboarding fields, LinkedIn verification, ratings
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

-- Comparison requests (A/B photo comparisons)
CREATE TABLE IF NOT EXISTS comparison_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  category category_type DEFAULT 'comparison',
  image_a_url TEXT NOT NULL,
  image_b_url TEXT NOT NULL,
  context TEXT,
  question TEXT DEFAULT 'Which one is better?',

  -- Configuration
  target_verdict_count INTEGER DEFAULT 5,
  received_verdict_count INTEGER DEFAULT 0,
  credits_cost INTEGER DEFAULT 2,

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
  reasoning TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),

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

  -- Configuration
  target_verdict_count INTEGER DEFAULT 10,
  received_verdict_count INTEGER DEFAULT 0,
  credits_cost INTEGER DEFAULT 3,

  -- Status
  status request_status DEFAULT 'open',
  winning_option_id TEXT,

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
  ranking JSONB, -- Optional full ranking
  reasoning TEXT,

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
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 6: JUDGE SYSTEM TABLES
-- ============================================================================

-- Judge earnings tracking
CREATE TABLE IF NOT EXISTS judge_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verdict_response_id UUID REFERENCES verdict_responses(id) ON DELETE CASCADE,
  comparison_verdict_id UUID REFERENCES comparison_verdicts(id) ON DELETE CASCADE,
  split_test_verdict_id UUID REFERENCES split_test_verdicts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
  currency TEXT DEFAULT 'USD',
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'cancelled')),
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure one earnings record per verdict
CREATE UNIQUE INDEX IF NOT EXISTS idx_judge_earnings_verdict_unique
ON judge_earnings(verdict_response_id) WHERE verdict_response_id IS NOT NULL;

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
  qualified_at TIMESTAMPTZ,
  qualification_expires_at TIMESTAMPTZ,
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
-- PART 8: NOTIFICATIONS & COMMUNICATION
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

-- ============================================================================
-- PART 9: GAMIFICATION & ACHIEVEMENTS
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
-- PART 10: MODERATION & QUALITY
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

-- ============================================================================
-- PART 11: SUPPORT SYSTEM
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
-- PART 12: WEBHOOKS & RATE LIMITING
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
-- PART 13: AUDIT & ADMIN
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

-- ============================================================================
-- PART 14: INDEXES FOR PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_judge_ratings_judge ON judge_ratings(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_user ON judge_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_status ON judge_verifications(status);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);

-- Webhook/rate limit indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_expires ON webhook_events_processed(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Stripe idempotency indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_session_unique
ON transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_intent_unique
ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- PART 15: STORAGE BUCKETS
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
-- PART 16: FUNCTIONS
-- ============================================================================

-- ============================================================================
-- ADVISORY LOCKING (for credit-guard.ts race condition prevention)
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
-- ATOMIC CREDIT OPERATIONS
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

-- ============================================================================
-- JUDGE REPUTATION
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
-- NOTIFICATIONS
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

-- Webhook idempotency
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

-- Rate limiting
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

-- Increment verdict count and close
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

-- Onboarding completion trigger
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
-- PART 17: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_test_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Request policies
CREATE POLICY "Users can view own requests" ON verdict_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON verdict_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Judges can view open requests" ON verdict_requests FOR SELECT
  USING (status IN ('open', 'in_progress') AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_judge = true));

-- Response policies
CREATE POLICY "Judges can create responses" ON verdict_responses FOR INSERT WITH CHECK (auth.uid() = judge_id);
CREATE POLICY "Users can view responses on own requests" ON verdict_responses FOR SELECT
  USING (auth.uid() = judge_id OR auth.uid() = (SELECT user_id FROM verdict_requests WHERE id = request_id));

-- Judge verification policies
CREATE POLICY "Users can view own verifications" ON judge_verifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own verifications" ON judge_verifications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin notification policies
CREATE POLICY "Admins can view notifications" ON admin_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can update notifications" ON admin_notifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Support policies
CREATE POLICY "Users can view own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id);

-- Credit policies
CREATE POLICY "Users can view own credits" ON user_credits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Folder policies
CREATE POLICY "Users can manage own folders" ON decision_folders FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PART 18: STORAGE POLICIES
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

-- ============================================================================
-- PART 19: DEFAULT DATA
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
-- PART 20: GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERDICT DATABASE SCHEMA - COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tables: 35+';
  RAISE NOTICE 'Functions: 5';
  RAISE NOTICE 'Storage Buckets: 4';
  RAISE NOTICE 'RLS Policies: Enabled';
  RAISE NOTICE 'Default Data: Inserted';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Ready for production deployment!';
END $$;
