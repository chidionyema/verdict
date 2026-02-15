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

-- ============================================================================
-- TEST SEGMENTS TABLE (for demographic-targeted split testing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_test_id UUID NOT NULL REFERENCES split_test_requests(id) ON DELETE CASCADE,

  -- Segment definition
  name TEXT NOT NULL,
  description TEXT,

  -- Demographic filters (JSONB for flexibility)
  demographic_filters JSONB DEFAULT '{}',
  -- Example: {"age_range": ["18-24", "25-34"], "gender": ["female"]}

  -- Psychographic filters (premium)
  psychographic_filters JSONB DEFAULT '{}',
  -- Example: {"interests": ["fashion", "fitness"], "values": ["sustainability"]}

  -- Targeting settings
  target_count INTEGER NOT NULL DEFAULT 5,
  completed_count INTEGER DEFAULT 0,

  -- Results
  winner TEXT CHECK (winner IN ('A', 'B', 'tie', NULL)),
  consensus_strength INTEGER,
  avg_rating_a NUMERIC(3,1),
  avg_rating_b NUMERIC(3,1),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_test_segments_split_test ON test_segments(split_test_id);
CREATE INDEX idx_test_segments_completed ON test_segments(split_test_id, completed_count, target_count);

-- Add segment_id to split_test_verdicts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'split_test_verdicts' AND column_name = 'segment_id'
  ) THEN
    ALTER TABLE split_test_verdicts ADD COLUMN segment_id UUID REFERENCES test_segments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to find matching segment for a judge
CREATE OR REPLACE FUNCTION find_matching_segment(
  p_split_test_id UUID,
  p_judge_id UUID
)
RETURNS UUID AS $$
DECLARE
  segment_record RECORD;
  judge_demo RECORD;
  matching_segment_id UUID := NULL;
  min_completion_ratio NUMERIC := 999;
BEGIN
  -- Get judge demographics
  SELECT * INTO judge_demo FROM judge_demographics WHERE judge_id = p_judge_id;

  -- If no demographics, can't match targeted segments
  IF judge_demo IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find incomplete segments where judge matches filters
  FOR segment_record IN
    SELECT * FROM test_segments
    WHERE split_test_id = p_split_test_id
      AND completed_count < target_count
    ORDER BY (completed_count::NUMERIC / target_count) ASC
  LOOP
    -- Check age_range filter
    IF segment_record.demographic_filters ? 'age_range' THEN
      IF NOT (judge_demo.age_range = ANY(
        SELECT jsonb_array_elements_text(segment_record.demographic_filters->'age_range')
      )) THEN
        CONTINUE;
      END IF;
    END IF;

    -- Check gender filter
    IF segment_record.demographic_filters ? 'gender' THEN
      IF NOT (judge_demo.gender = ANY(
        SELECT jsonb_array_elements_text(segment_record.demographic_filters->'gender')
      )) THEN
        CONTINUE;
      END IF;
    END IF;

    -- Check location filter
    IF segment_record.demographic_filters ? 'location' THEN
      IF NOT (judge_demo.location = ANY(
        SELECT jsonb_array_elements_text(segment_record.demographic_filters->'location')
      )) THEN
        CONTINUE;
      END IF;
    END IF;

    -- If we got here, judge matches this segment
    -- Pick the one with lowest completion ratio
    IF (segment_record.completed_count::NUMERIC / segment_record.target_count) < min_completion_ratio THEN
      min_completion_ratio := segment_record.completed_count::NUMERIC / segment_record.target_count;
      matching_segment_id := segment_record.id;
    END IF;
  END LOOP;

  RETURN matching_segment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_matching_segment(UUID, UUID) TO authenticated;

-- Function to update segment stats after verdict
CREATE OR REPLACE FUNCTION update_segment_after_verdict()
RETURNS TRIGGER AS $$
DECLARE
  seg_stats RECORD;
BEGIN
  IF NEW.segment_id IS NOT NULL THEN
    -- Update completed count
    UPDATE test_segments
    SET completed_count = completed_count + 1,
        updated_at = NOW()
    WHERE id = NEW.segment_id;

    -- Check if segment is now complete and calculate winner
    SELECT
      COUNT(*) FILTER (WHERE chosen_photo = 'A') as votes_a,
      COUNT(*) FILTER (WHERE chosen_photo = 'B') as votes_b,
      AVG(photo_a_rating) as avg_a,
      AVG(photo_b_rating) as avg_b,
      ts.target_count
    INTO seg_stats
    FROM split_test_verdicts stv
    JOIN test_segments ts ON ts.id = stv.segment_id
    WHERE stv.segment_id = NEW.segment_id
    GROUP BY ts.target_count;

    IF seg_stats.votes_a + seg_stats.votes_b >= seg_stats.target_count THEN
      UPDATE test_segments
      SET winner = CASE
            WHEN seg_stats.votes_a > seg_stats.votes_b THEN 'A'
            WHEN seg_stats.votes_b > seg_stats.votes_a THEN 'B'
            ELSE 'tie'
          END,
          consensus_strength = CASE
            WHEN seg_stats.votes_a > seg_stats.votes_b THEN
              ROUND((seg_stats.votes_a::NUMERIC / (seg_stats.votes_a + seg_stats.votes_b)) * 100)
            WHEN seg_stats.votes_b > seg_stats.votes_a THEN
              ROUND((seg_stats.votes_b::NUMERIC / (seg_stats.votes_a + seg_stats.votes_b)) * 100)
            ELSE 50
          END,
          avg_rating_a = seg_stats.avg_a,
          avg_rating_b = seg_stats.avg_b,
          updated_at = NOW()
      WHERE id = NEW.segment_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_segment_after_verdict ON split_test_verdicts;
CREATE TRIGGER trigger_update_segment_after_verdict
  AFTER INSERT ON split_test_verdicts
  FOR EACH ROW
  EXECUTE FUNCTION update_segment_after_verdict();

-- ============================================================================
-- JUDGE QUALITY SCORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS judge_scores (
  judge_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Score components (0-100 each)
  consistency_score INTEGER DEFAULT 50,
  reasoning_quality_score INTEGER DEFAULT 50,
  completion_rate_score INTEGER DEFAULT 100,
  response_time_score INTEGER DEFAULT 50,
  creator_feedback_score INTEGER DEFAULT 50,

  -- Weighted overall score
  overall_score NUMERIC(4,2) DEFAULT 50.00,

  -- Tier (calculated from overall_score)
  tier TEXT DEFAULT 'novice' CHECK (tier IN ('novice', 'verified', 'expert', 'master')),

  -- Stats
  total_verdicts INTEGER DEFAULT 0,
  consensus_matches INTEGER DEFAULT 0,
  avg_response_minutes NUMERIC(6,2),
  helpful_ratings INTEGER DEFAULT 0,
  unhelpful_ratings INTEGER DEFAULT 0,

  -- Timestamps
  last_verdict_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate judge tier from score
CREATE OR REPLACE FUNCTION calculate_judge_tier(p_score NUMERIC, p_verdicts INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_verdicts >= 200 AND p_score >= 48 THEN
    RETURN 'master';
  ELSIF p_verdicts >= 50 AND p_score >= 45 THEN
    RETURN 'expert';
  ELSIF p_verdicts >= 10 AND p_score >= 40 THEN
    RETURN 'verified';
  ELSE
    RETURN 'novice';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get judge earning multiplier
CREATE OR REPLACE FUNCTION get_judge_earning_multiplier(p_judge_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  judge_tier TEXT;
BEGIN
  SELECT tier INTO judge_tier FROM judge_scores WHERE judge_id = p_judge_id;

  RETURN CASE judge_tier
    WHEN 'master' THEN 1.5
    WHEN 'expert' THEN 1.25
    WHEN 'verified' THEN 1.1
    ELSE 1.0
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_judge_earning_multiplier(UUID) TO authenticated;

-- RLS for new tables
ALTER TABLE test_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;

-- Policies for test_segments
CREATE POLICY "Users can view segments for their split tests"
  ON test_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM split_test_requests
      WHERE split_test_requests.id = test_segments.split_test_id
        AND split_test_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can view segments for matching"
  ON test_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_judge = true
    )
  );

-- Policies for judge_scores
CREATE POLICY "Users can view all judge scores"
  ON judge_scores FOR SELECT
  USING (true);

CREATE POLICY "System can update judge scores"
  ON judge_scores FOR ALL
  USING (auth.uid() = judge_id);
