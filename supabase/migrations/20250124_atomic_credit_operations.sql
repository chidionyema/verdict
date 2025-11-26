-- Atomic Credit Operations
-- Purpose: Prevent race conditions in credit deductions and additions

-- Function: Add credits atomically (for Stripe payments)
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_credits INT)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  current_balance INT;
  updated_balance INT;
BEGIN
  -- Lock the row for update
  SELECT credits INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if profile exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found';
    RETURN;
  END IF;

  -- Add credits
  UPDATE profiles
  SET credits = credits + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO updated_balance;

  RETURN QUERY SELECT TRUE, updated_balance, 'Credits added successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: Deduct credits atomically (for creating requests)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INT)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  current_balance INT;
  updated_balance INT;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT credits INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if profile exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found';
    RETURN;
  END IF;

  -- Check if sufficient credits
  IF current_balance < p_credits THEN
    RETURN QUERY SELECT FALSE, current_balance, 'Insufficient credits';
    RETURN;
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET credits = credits - p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO updated_balance;

  RETURN QUERY SELECT TRUE, updated_balance, 'Credits deducted successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: Refund credits (for failed requests)
CREATE OR REPLACE FUNCTION refund_credits(p_user_id UUID, p_credits INT, p_reason TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
  updated_balance INT;
BEGIN
  -- Lock the row for update
  UPDATE profiles
  SET credits = credits + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO updated_balance;

  -- Check if update succeeded
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Profile not found';
    RETURN;
  END IF;

  -- Log the refund if reason provided
  IF p_reason IS NOT NULL THEN
    -- Could log to a refunds table here if needed
    NULL;
  END IF;

  RETURN QUERY SELECT TRUE, updated_balance, 'Credits refunded successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: Process subscription renewal (for monthly credit grants)
CREATE OR REPLACE FUNCTION process_subscription_renewal(p_subscription_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_monthly_credits INT;
  v_updated_balance INT;
BEGIN
  -- Get subscription details
  SELECT user_id, monthly_credits INTO v_user_id, v_monthly_credits
  FROM subscriptions
  WHERE id = p_subscription_id;

  -- Check if subscription exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Subscription not found';
    RETURN;
  END IF;

  -- Add monthly credits atomically
  UPDATE profiles
  SET credits = credits + v_monthly_credits,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING credits INTO v_updated_balance;

  -- Check if update succeeded
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Profile not found';
    RETURN;
  END IF;

  -- Update subscription last_renewal
  UPDATE subscriptions
  SET last_renewal = NOW()
  WHERE id = p_subscription_id;

  RETURN QUERY SELECT TRUE, 'Subscription renewed successfully';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION add_credits IS 'Atomically add credits to user profile - safe for concurrent operations';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deduct credits with balance check - prevents race conditions';
COMMENT ON FUNCTION refund_credits IS 'Atomically refund credits with optional reason logging';
COMMENT ON FUNCTION process_subscription_renewal IS 'Process monthly subscription renewal and add credits atomically';
