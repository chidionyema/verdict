-- ============================================================================
-- MIGRATION: Fix All Schema Issues
-- ============================================================================
-- This migration addresses ALL database schema mismatches found during audit:
-- 1. judge_qualifications - add missing columns for application flow
-- 2. expert_verifications - create table for expert routing
-- 3. comparison_verdicts - add missing columns for full verdict data
-- 4. split_test_verdicts - add missing columns for full verdict data
-- 5. verdict_quality_ratings - create table for requester feedback on verdicts
-- 6. spend_credits RPC - add function for credit-guard.ts
-- 7. Comparison/Split test increment and auto-close functions
-- ============================================================================

-- ============================================================================
-- 1. FIX judge_qualifications TABLE
-- ============================================================================

-- Add missing columns for judge application flow
ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending'
  CHECK (application_status IN ('pending', 'approved', 'rejected', 'in_review'));

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS test_attempts INTEGER DEFAULT 0;

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS experience_level TEXT
  CHECK (experience_level IN ('beginner', 'intermediate', 'expert'));

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS specialties TEXT[];

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS motivation_text TEXT;

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE judge_qualifications
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================================================
-- 2. CREATE expert_verifications TABLE
-- ============================================================================

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

-- Index for expert routing queries
CREATE INDEX IF NOT EXISTS idx_expert_verifications_user ON expert_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_verifications_status ON expert_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_expert_verifications_industry ON expert_verifications(industry);

-- Enable RLS
ALTER TABLE expert_verifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own expert verification" ON expert_verifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own expert verification" ON expert_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all expert verifications" ON expert_verifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can update expert verifications" ON expert_verifications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- 3. FIX comparison_verdicts TABLE - Add missing columns
-- ============================================================================

-- Add all the columns that the API route expects
ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_a_feedback TEXT;

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_a_strengths TEXT[];

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_a_weaknesses TEXT[];

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_a_rating INTEGER CHECK (option_a_rating >= 1 AND option_a_rating <= 10);

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_b_feedback TEXT;

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_b_strengths TEXT[];

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_b_weaknesses TEXT[];

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS option_b_rating INTEGER CHECK (option_b_rating >= 1 AND option_b_rating <= 10);

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS budget_consideration TEXT;

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS judge_expertise TEXT[];

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS decision_scores JSONB;

ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;

-- Rename selected_option to match code if needed (keep both for compatibility)
-- The code uses 'chosen_option' but schema has 'selected_option'
-- Add chosen_option as alias column
ALTER TABLE comparison_verdicts
ADD COLUMN IF NOT EXISTS chosen_option TEXT CHECK (chosen_option IN ('A', 'B', 'tie'));

-- ============================================================================
-- 4. FIX split_test_verdicts TABLE - Add missing columns
-- ============================================================================

-- Add all the columns that the API route expects
ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS chosen_photo TEXT CHECK (chosen_photo IN ('A', 'B'));

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10);

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_a_feedback TEXT;

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_a_strengths TEXT[];

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_a_improvements TEXT[];

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_a_rating INTEGER CHECK (photo_a_rating >= 1 AND photo_a_rating <= 10);

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_b_feedback TEXT;

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_b_strengths TEXT[];

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_b_improvements TEXT[];

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS photo_b_rating INTEGER CHECK (photo_b_rating >= 1 AND photo_b_rating <= 10);

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS judge_expertise TEXT[];

ALTER TABLE split_test_verdicts
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;

-- ============================================================================
-- 5. CREATE verdict_quality_ratings TABLE
-- ============================================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verdict_quality_ratings_verdict ON verdict_quality_ratings(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_verdict_quality_ratings_rater ON verdict_quality_ratings(rater_id);

-- Enable RLS
ALTER TABLE verdict_quality_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can rate verdicts on their requests" ON verdict_quality_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM verdict_responses vr
      JOIN verdict_requests req ON vr.request_id = req.id
      WHERE vr.id = verdict_response_id AND req.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view their ratings" ON verdict_quality_ratings
  FOR SELECT USING (rater_id = auth.uid());
CREATE POLICY "Judges can view ratings on their verdicts" ON verdict_quality_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verdict_responses WHERE id = verdict_response_id AND judge_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. ADD spend_credits RPC FUNCTION (for credit-guard.ts)
-- ============================================================================

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

-- ============================================================================
-- 7. ADD increment_comparison_verdict_count_and_close FUNCTION
-- ============================================================================

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

-- ============================================================================
-- 8. ADD increment_split_test_verdict_count_and_close FUNCTION
-- ============================================================================

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
-- 9. ADD COMPARISON REQUESTS MISSING COLUMNS
-- ============================================================================

-- The API uses different column names than the schema
ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS decision_context TEXT;

ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS option_a_title TEXT;

ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS option_b_title TEXT;

ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS option_a_image_url TEXT;

ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS option_b_image_url TEXT;

ALTER TABLE comparison_requests
ADD COLUMN IF NOT EXISTS request_tier request_tier DEFAULT 'community';

-- ============================================================================
-- 10. ADD SPLIT TEST REQUESTS MISSING COLUMNS
-- ============================================================================

ALTER TABLE split_test_requests
ADD COLUMN IF NOT EXISTS photo_a_url TEXT;

ALTER TABLE split_test_requests
ADD COLUMN IF NOT EXISTS photo_b_url TEXT;

ALTER TABLE split_test_requests
ADD COLUMN IF NOT EXISTS winning_photo TEXT CHECK (winning_photo IN ('A', 'B', NULL));

ALTER TABLE split_test_requests
ADD COLUMN IF NOT EXISTS consensus_strength INTEGER;

-- ============================================================================
-- 11. INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_judge_qualifications_status ON judge_qualifications(application_status);
CREATE INDEX IF NOT EXISTS idx_comparison_verdicts_comparison ON comparison_verdicts(comparison_id);
CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_split_test ON split_test_verdicts(split_test_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
