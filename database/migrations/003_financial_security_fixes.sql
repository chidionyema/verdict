-- Migration: Financial Security Fixes
-- Addresses critical vulnerabilities identified in financial audit
-- Date: 2024-02-15

-- ============================================================================
-- 1. REFUND CREDIT DEDUCTION FUNCTION
-- Prevents fraud where user gets refund but keeps credits
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_credits_for_refund(
  p_user_id UUID,
  p_credits INTEGER,
  p_charge_id TEXT,
  p_reason TEXT DEFAULT 'Refund processed'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_already_processed BOOLEAN;
BEGIN
  -- Check if this refund was already processed (idempotency)
  SELECT EXISTS(
    SELECT 1 FROM credit_audit_log
    WHERE user_id = p_user_id
    AND operation = 'refund_deduct'
    AND metadata->>'charge_id' = p_charge_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    SELECT credits INTO v_current_balance FROM profiles WHERE id = p_user_id;
    RETURN QUERY SELECT TRUE, v_current_balance, 'Already processed (idempotent)'::TEXT;
    RETURN;
  END IF;

  -- Get current balance with row lock
  SELECT credits INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate new balance (allow going to 0 but not negative for refunds)
  v_new_balance := GREATEST(0, v_current_balance - p_credits);

  -- Update balance
  UPDATE profiles
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the deduction
  INSERT INTO credit_audit_log (
    user_id,
    operation,
    credits_amount,
    before_balance,
    after_balance,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'refund_deduct',
    p_credits,
    v_current_balance,
    v_new_balance,
    TRUE,
    jsonb_build_object(
      'charge_id', p_charge_id,
      'reason', p_reason,
      'requested_deduction', p_credits,
      'actual_deduction', v_current_balance - v_new_balance
    ),
    NOW()
  );

  RETURN QUERY SELECT TRUE, v_new_balance, 'Credits deducted for refund'::TEXT;
END;
$$;

-- ============================================================================
-- 2. CHECK CONSTRAINT: Prevent negative credits
-- ============================================================================

-- Add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_credits_non_negative'
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT check_credits_non_negative
    CHECK (credits >= 0);
  END IF;
END $$;

-- ============================================================================
-- 3. UNIQUE CONSTRAINT: Prevent duplicate transactions
-- ============================================================================

-- Add unique constraint on stripe_session_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_transactions_stripe_session_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_transactions_stripe_session_unique
    ON transactions(stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 4. ADD REFUND TRACKING COLUMNS TO TRANSACTIONS
-- ============================================================================

DO $$
BEGIN
  -- Add refunded_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN refunded_at TIMESTAMPTZ;
  END IF;

  -- Add refund_amount_cents column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'refund_amount_cents'
  ) THEN
    ALTER TABLE transactions ADD COLUMN refund_amount_cents INTEGER DEFAULT 0;
  END IF;

  -- Add 'refunded' to status enum if not already present
  -- Note: This is a safe operation that will fail silently if the value exists
  BEGIN
    ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'refunded';
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if already exists
  END;
END $$;

-- ============================================================================
-- 5. ADD DISPUTE TRACKING TO PROFILES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_pending_dispute'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_pending_dispute BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dispute_flagged_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN dispute_flagged_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 6. CREATE ADMIN ALERTS TABLE FOR SECURITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES profiles(id),
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for unresolved alerts
CREATE INDEX IF NOT EXISTS idx_admin_alerts_unresolved
ON admin_alerts(severity, created_at)
WHERE resolved = FALSE;

-- ============================================================================
-- 7. ENHANCED CREDIT AUDIT LOG
-- ============================================================================

-- Add metadata column to credit_audit_log if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_audit_log' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE credit_audit_log ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- 8. CREDIT IDEMPOTENCY TABLE
-- Prevents duplicate credit operations from retries/race conditions
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  operation TEXT NOT NULL CHECK (operation IN ('deduct', 'refund', 'add', 'purchase')),
  credits_amount INTEGER NOT NULL,
  result_balance INTEGER NOT NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Auto-expire old records after 24 hours (handled by cron job)
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_credit_idempotency_key ON credit_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_credit_idempotency_user ON credit_idempotency(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_idempotency_expires ON credit_idempotency(expires_at) WHERE expires_at < NOW();

-- Function to clean up expired idempotency records (call from cron)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM credit_idempotency
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 9. ENHANCED DEDUCT_CREDITS WITH IDEMPOTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_credits_with_idempotency(
  p_user_id UUID,
  p_credits INTEGER,
  p_idempotency_key TEXT
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT, already_processed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_existing_result INTEGER;
BEGIN
  -- Check for existing idempotent operation
  SELECT result_balance INTO v_existing_result
  FROM credit_idempotency
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_existing_result, 'Already processed'::TEXT, TRUE;
    RETURN;
  END IF;

  -- Get current balance with row lock
  SELECT credits INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT, FALSE;
    RETURN;
  END IF;

  IF v_current_balance < p_credits THEN
    RETURN QUERY SELECT FALSE, v_current_balance, 'Insufficient credits'::TEXT, FALSE;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_credits;

  -- Update balance
  UPDATE profiles
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Store idempotency record
  INSERT INTO credit_idempotency (
    idempotency_key,
    user_id,
    operation,
    credits_amount,
    result_balance
  ) VALUES (
    p_idempotency_key,
    p_user_id,
    'deduct',
    p_credits,
    v_new_balance
  );

  RETURN QUERY SELECT TRUE, v_new_balance, 'Credits deducted'::TEXT, FALSE;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION deduct_credits_for_refund TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits_with_idempotency TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency TO service_role;
GRANT SELECT, INSERT ON admin_alerts TO service_role;
GRANT SELECT, INSERT, DELETE ON credit_idempotency TO service_role;
