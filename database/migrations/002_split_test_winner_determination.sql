-- Migration: Split Test Feature Complete
-- 1. Add winner determination logic to split test RPC function
-- 2. Add create_split_test RPC function (missing)
-- 3. Fix constraint to allow 'tie' value

-- First update the constraint to allow 'tie' as a value
ALTER TABLE split_test_requests DROP CONSTRAINT IF EXISTS split_test_requests_winning_photo_check;
ALTER TABLE split_test_requests ADD CONSTRAINT split_test_requests_winning_photo_check
  CHECK (winning_photo IN ('A', 'B', 'tie', NULL));

-- Update the RPC function to calculate winner and consensus when test closes
CREATE OR REPLACE FUNCTION increment_split_test_verdict_count_and_close(p_split_test_id UUID)
RETURNS split_test_requests AS $$
DECLARE
  updated_row split_test_requests;
  vote_a_count INTEGER;
  vote_b_count INTEGER;
  total_votes INTEGER;
  calculated_winner TEXT;
  calculated_consensus INTEGER;
BEGIN
  -- First, increment the count and check if we should close
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

  -- If the test just closed, calculate the winner
  IF updated_row.status = 'closed' AND updated_row.winning_photo IS NULL THEN
    -- Count votes for each photo
    SELECT
      COUNT(*) FILTER (WHERE chosen_photo = 'A'),
      COUNT(*) FILTER (WHERE chosen_photo = 'B'),
      COUNT(*)
    INTO vote_a_count, vote_b_count, total_votes
    FROM split_test_verdicts
    WHERE split_test_id = p_split_test_id;

    -- Determine winner
    IF vote_a_count > vote_b_count THEN
      calculated_winner := 'A';
      calculated_consensus := ROUND((vote_a_count::NUMERIC / total_votes) * 100);
    ELSIF vote_b_count > vote_a_count THEN
      calculated_winner := 'B';
      calculated_consensus := ROUND((vote_b_count::NUMERIC / total_votes) * 100);
    ELSE
      calculated_winner := 'tie';
      calculated_consensus := 50; -- Perfect split
    END IF;

    -- Update with winner information
    UPDATE split_test_requests
    SET winning_photo = calculated_winner,
        consensus_strength = calculated_consensus,
        completed_at = NOW()
    WHERE id = p_split_test_id
    RETURNING * INTO updated_row;
  END IF;

  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_split_test_verdict_count_and_close(UUID) TO authenticated;

-- Also create a helper function to manually recalculate winners for existing closed tests
CREATE OR REPLACE FUNCTION recalculate_split_test_winner(p_split_test_id UUID)
RETURNS split_test_requests AS $$
DECLARE
  updated_row split_test_requests;
  vote_a_count INTEGER;
  vote_b_count INTEGER;
  total_votes INTEGER;
  calculated_winner TEXT;
  calculated_consensus INTEGER;
BEGIN
  -- Count votes
  SELECT
    COUNT(*) FILTER (WHERE chosen_photo = 'A'),
    COUNT(*) FILTER (WHERE chosen_photo = 'B'),
    COUNT(*)
  INTO vote_a_count, vote_b_count, total_votes
  FROM split_test_verdicts
  WHERE split_test_id = p_split_test_id;

  IF total_votes = 0 THEN
    RAISE EXCEPTION 'No verdicts found for split test %', p_split_test_id;
  END IF;

  -- Determine winner
  IF vote_a_count > vote_b_count THEN
    calculated_winner := 'A';
    calculated_consensus := ROUND((vote_a_count::NUMERIC / total_votes) * 100);
  ELSIF vote_b_count > vote_a_count THEN
    calculated_winner := 'B';
    calculated_consensus := ROUND((vote_b_count::NUMERIC / total_votes) * 100);
  ELSE
    calculated_winner := 'tie';
    calculated_consensus := 50;
  END IF;

  -- Update
  UPDATE split_test_requests
  SET winning_photo = calculated_winner,
      consensus_strength = calculated_consensus,
      updated_at = NOW()
  WHERE id = p_split_test_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION recalculate_split_test_winner(UUID) TO authenticated;

-- Add completed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'split_test_requests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE split_test_requests ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add request_tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'split_test_requests' AND column_name = 'request_tier'
  ) THEN
    ALTER TABLE split_test_requests ADD COLUMN request_tier TEXT DEFAULT 'community';
  END IF;
END $$;

-- Create the split test creation function (MISSING - causes creation to fail)
CREATE OR REPLACE FUNCTION create_split_test(
  p_user_id UUID,
  p_category TEXT,
  p_question TEXT,
  p_context TEXT,
  p_photo_a_url TEXT,
  p_photo_a_filename TEXT,
  p_photo_b_url TEXT,
  p_photo_b_filename TEXT,
  p_visibility TEXT DEFAULT 'public',
  p_target_verdicts INTEGER DEFAULT 3
)
RETURNS UUID AS $$
DECLARE
  new_split_test_id UUID;
BEGIN
  INSERT INTO split_test_requests (
    user_id,
    category,
    title,
    context,
    photo_a_url,
    photo_b_url,
    options,
    status,
    target_verdict_count,
    received_verdict_count,
    request_tier,
    credits_cost,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    'split_test',
    p_question,
    p_context,
    p_photo_a_url,
    p_photo_b_url,
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'url', p_photo_a_url, 'label', COALESCE(p_photo_a_filename, 'Photo A')),
      jsonb_build_object('id', 'B', 'url', p_photo_b_url, 'label', COALESCE(p_photo_b_filename, 'Photo B'))
    ),
    'open',
    p_target_verdicts,
    0,
    'community',
    1,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_split_test_id;

  -- Update user's submission count
  UPDATE profiles
  SET total_submissions = COALESCE(total_submissions, 0) + 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN new_split_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_split_test(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
