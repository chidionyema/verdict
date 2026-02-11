-- ============================================================================
-- MIGRATION 003: Complete Missing Schema
-- ============================================================================
-- This migration adds all remaining tables and RPC functions identified in audit:
--
-- TABLES:
-- 1. password_resets - Password reset tokens
-- 2. email_verifications - Email verification tokens
-- 3. subscription_plans - Available subscription plans
-- 4. subscriptions - User subscriptions
-- 5. payment_methods - Saved payment methods
-- 6. user_consents - GDPR consent records
-- 7. data_deletion_requests - GDPR deletion requests
-- 8. data_exports - GDPR data export requests
-- 9. notification_preferences - User notification settings
-- 10. help_articles - Help center content
-- 11. help_article_feedback - Feedback on articles
-- 12. popular_searches - Search analytics
-- 13. profile_completion_steps - Onboarding progress
-- 14. feedback_responses - Judge feedback from requesters
-- 15. content_moderation_logs - AI moderation logs
--
-- RPC FUNCTIONS:
-- 1. create_email_verification
-- 2. verify_email
-- 3. create_password_reset
-- 4. verify_password_reset
-- 5. process_subscription_renewal
-- 6. get_profile_completion_status
-- 7. search_requests
-- 8. track_search
-- ============================================================================

-- ============================================================================
-- 1. PASSWORD RESETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for quick lookups
  CONSTRAINT password_reset_not_expired CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- RLS
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- No direct user access - only via RPC functions
CREATE POLICY "Service role only" ON password_resets
  FOR ALL USING (false);

-- ============================================================================
-- 2. EMAIL VERIFICATIONS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token) WHERE verified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

-- RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- No direct user access - only via RPC functions
CREATE POLICY "Service role only" ON email_verifications
  FOR ALL USING (false);

-- ============================================================================
-- 3. SUBSCRIPTION PLANS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active) WHERE active = TRUE;

-- Public read access for pricing display
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (active = TRUE);

-- ============================================================================
-- 4. SUBSCRIPTIONS TABLE
-- ============================================================================

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- 5. PAYMENT METHODS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 6. USER CONSENTS TABLE (GDPR)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);

-- RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own consents" ON user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own consents" ON user_consents
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- 7. DATA DELETION REQUESTS TABLE (GDPR)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);

-- RLS
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deletion requests" ON data_deletion_requests
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own deletion requests" ON data_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8. DATA EXPORTS TABLE (GDPR)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_expires ON data_exports(expires_at);

-- RLS
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exports" ON data_exports
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can request own exports" ON data_exports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 9. NOTIFICATION PREFERENCES TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- 10. HELP ARTICLES TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published, featured);

-- RLS - public read for published articles
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published articles" ON help_articles
  FOR SELECT USING (published = TRUE);
CREATE POLICY "Admins can manage articles" ON help_articles
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- 11. HELP ARTICLE FEEDBACK TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_help_article_feedback_article ON help_article_feedback(article_id);

-- RLS
ALTER TABLE help_article_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit feedback" ON help_article_feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can view own feedback" ON help_article_feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- 12. POPULAR SEARCHES TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_recent ON popular_searches(last_searched_at DESC);

-- RLS - no user access, internal analytics only
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. PROFILE COMPLETION STEPS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_profile_completion_user ON profile_completion_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_completion_step ON profile_completion_steps(step_name, completed);

-- RLS
ALTER TABLE profile_completion_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own steps" ON profile_completion_steps
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own steps" ON profile_completion_steps
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own steps" ON profile_completion_steps
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- 14. FEEDBACK RESPONSES TABLE (Requester feedback on verdicts)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_feedback_responses_verdict ON feedback_responses(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_requester ON feedback_responses(requester_id);

-- RLS
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requesters can submit feedback on their request verdicts" ON feedback_responses
  FOR INSERT WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM verdict_responses vr
      JOIN verdict_requests req ON vr.request_id = req.id
      WHERE vr.id = verdict_response_id AND req.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view feedback they submitted" ON feedback_responses
  FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "Judges can view feedback on their verdicts" ON feedback_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verdict_responses WHERE id = verdict_response_id AND judge_id = auth.uid()
    )
  );

-- ============================================================================
-- 15. CONTENT MODERATION LOGS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation_logs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_flagged ON content_moderation_logs(ai_flagged) WHERE ai_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_moderation_action ON content_moderation_logs(action_taken);

-- RLS - admin only
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view moderation logs" ON content_moderation_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- ============================================================================
-- RPC: create_email_verification
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

-- ============================================================================
-- RPC: verify_email
-- ============================================================================

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
-- RPC: create_password_reset
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

-- ============================================================================
-- RPC: verify_password_reset
-- ============================================================================

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
-- RPC: process_subscription_renewal
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
-- RPC: get_profile_completion_status
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
-- RPC: search_requests
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
    vr.category,
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
    AND (p_category IS NULL OR vr.category = p_category)
    AND (p_status IS NULL OR vr.status::TEXT = p_status)
    -- Only public/community requests
    AND vr.visibility = 'public'
  ORDER BY relevance DESC, vr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: track_search
-- ============================================================================

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
-- ADD last_attempt_at COLUMN TO judge_qualifications
-- ============================================================================

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
