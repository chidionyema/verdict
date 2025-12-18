-- Split Test (A/B Photo Comparison) System
-- Production-ready schema for comparing two photos side-by-side

-- Table for split test requests
CREATE TABLE IF NOT EXISTS public.split_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  context TEXT,
  
  -- Photo storage (using Supabase Storage)
  photo_a_url TEXT NOT NULL,
  photo_a_filename TEXT,
  photo_a_size_bytes INTEGER,
  photo_b_url TEXT NOT NULL,
  photo_b_filename TEXT,
  photo_b_size_bytes INTEGER,
  
  -- Test configuration
  target_verdict_count INTEGER DEFAULT 3 CHECK (target_verdict_count > 0),
  received_verdict_count INTEGER DEFAULT 0,
  
  -- Results
  photo_a_votes INTEGER DEFAULT 0,
  photo_b_votes INTEGER DEFAULT 0,
  winning_photo VARCHAR(1) CHECK (winning_photo IN ('A', 'B', NULL)),
  confidence_level DECIMAL(5,2), -- Percentage (0-100)
  
  -- Status and timing
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'cancelled')),
  visibility VARCHAR(10) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  
  -- Metadata
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for split test verdicts (judges compare both photos)
CREATE TABLE IF NOT EXISTS public.split_test_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_test_request_id UUID NOT NULL REFERENCES public.split_test_requests(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Verdict data
  chosen_photo VARCHAR(1) NOT NULL CHECK (chosen_photo IN ('A', 'B')),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 10),
  reasoning TEXT NOT NULL,
  
  -- Detailed feedback for each photo
  photo_a_feedback TEXT,
  photo_a_strengths TEXT[],
  photo_a_improvements TEXT[],
  photo_a_rating INTEGER CHECK (photo_a_rating BETWEEN 1 AND 10),
  
  photo_b_feedback TEXT,
  photo_b_strengths TEXT[],
  photo_b_improvements TEXT[],
  photo_b_rating INTEGER CHECK (photo_b_rating BETWEEN 1 AND 10),
  
  -- Judge experience and categories
  judge_expertise TEXT[],
  helpful_votes INTEGER DEFAULT 0,
  
  -- Timing
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT unique_judge_per_split_test UNIQUE(split_test_request_id, judge_id),
  CONSTRAINT valid_confidence CHECK (
    (chosen_photo = 'A' AND photo_a_rating >= photo_b_rating) OR 
    (chosen_photo = 'B' AND photo_b_rating >= photo_a_rating)
  )
);

-- Table for split test analytics and insights
CREATE TABLE IF NOT EXISTS public.split_test_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_test_request_id UUID NOT NULL REFERENCES public.split_test_requests(id) ON DELETE CASCADE,
  
  -- Vote distribution
  total_votes INTEGER NOT NULL,
  photo_a_vote_percentage DECIMAL(5,2),
  photo_b_vote_percentage DECIMAL(5,2),
  
  -- Quality metrics
  average_confidence DECIMAL(5,2),
  consensus_strength DECIMAL(5,2), -- How unanimous the decision was
  
  -- Photo insights
  photo_a_avg_rating DECIMAL(3,1),
  photo_b_avg_rating DECIMAL(3,1),
  rating_difference DECIMAL(3,1),
  
  -- Common feedback themes (extracted from text analysis)
  top_strengths_a TEXT[],
  top_improvements_a TEXT[],
  top_strengths_b TEXT[],
  top_improvements_b TEXT[],
  
  -- Timing insights
  average_judge_time_seconds INTEGER,
  fastest_decision_seconds INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_split_test_requests_user_id ON public.split_test_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_split_test_requests_status ON public.split_test_requests(status);
CREATE INDEX IF NOT EXISTS idx_split_test_requests_category ON public.split_test_requests(category);
CREATE INDEX IF NOT EXISTS idx_split_test_requests_created_at ON public.split_test_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_split_test_requests_visibility ON public.split_test_requests(visibility);

CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_request_id ON public.split_test_verdicts(split_test_request_id);
CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_judge_id ON public.split_test_verdicts(judge_id);
CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_chosen_photo ON public.split_test_verdicts(chosen_photo);
CREATE INDEX IF NOT EXISTS idx_split_test_verdicts_created_at ON public.split_test_verdicts(created_at);

-- Function to update split test results when a new verdict is submitted
CREATE OR REPLACE FUNCTION update_split_test_results(p_split_test_id UUID)
RETURNS VOID AS $$
DECLARE
  verdict_count INTEGER;
  target_count INTEGER;
  a_votes INTEGER;
  b_votes INTEGER;
  winning_photo VARCHAR(1);
  confidence DECIMAL(5,2);
BEGIN
  -- Get current verdict counts
  SELECT 
    COUNT(*) as total_verdicts,
    SUM(CASE WHEN chosen_photo = 'A' THEN 1 ELSE 0 END) as a_count,
    SUM(CASE WHEN chosen_photo = 'B' THEN 1 ELSE 0 END) as b_count
  INTO verdict_count, a_votes, b_votes
  FROM public.split_test_verdicts
  WHERE split_test_request_id = p_split_test_id;
  
  -- Get target count
  SELECT target_verdict_count INTO target_count
  FROM public.split_test_requests
  WHERE id = p_split_test_id;
  
  -- Determine winner and confidence
  IF a_votes > b_votes THEN
    winning_photo := 'A';
    confidence := (a_votes::DECIMAL / verdict_count) * 100;
  ELSIF b_votes > a_votes THEN
    winning_photo := 'B';
    confidence := (b_votes::DECIMAL / verdict_count) * 100;
  ELSE
    winning_photo := NULL;
    confidence := 50.0;
  END IF;
  
  -- Update split test request
  UPDATE public.split_test_requests SET
    received_verdict_count = verdict_count,
    photo_a_votes = a_votes,
    photo_b_votes = b_votes,
    winning_photo = winning_photo,
    confidence_level = confidence,
    status = CASE 
      WHEN verdict_count >= target_count THEN 'closed'
      WHEN verdict_count > 0 THEN 'in_progress'
      ELSE status
    END,
    completed_at = CASE 
      WHEN verdict_count >= target_count AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = p_split_test_id;
  
  -- Update analytics if test is complete
  IF verdict_count >= target_count THEN
    PERFORM update_split_test_analytics(p_split_test_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update split test analytics
CREATE OR REPLACE FUNCTION update_split_test_analytics(p_split_test_id UUID)
RETURNS VOID AS $$
DECLARE
  analytics_data RECORD;
BEGIN
  SELECT 
    COUNT(*) as total_votes,
    (SUM(CASE WHEN chosen_photo = 'A' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100 as a_percentage,
    (SUM(CASE WHEN chosen_photo = 'B' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100 as b_percentage,
    AVG(confidence_score) as avg_confidence,
    AVG(photo_a_rating) as avg_a_rating,
    AVG(photo_b_rating) as avg_b_rating,
    AVG(time_spent_seconds) as avg_time,
    MIN(time_spent_seconds) as min_time
  INTO analytics_data
  FROM public.split_test_verdicts
  WHERE split_test_request_id = p_split_test_id;
  
  -- Calculate consensus strength (how unanimous the decision was)
  DECLARE
    consensus_strength DECIMAL(5,2);
  BEGIN
    consensus_strength := ABS(analytics_data.a_percentage - 50.0) + ABS(analytics_data.b_percentage - 50.0);
  END;
  
  INSERT INTO public.split_test_analytics (
    split_test_request_id, total_votes, 
    photo_a_vote_percentage, photo_b_vote_percentage,
    average_confidence, consensus_strength,
    photo_a_avg_rating, photo_b_avg_rating,
    rating_difference, average_judge_time_seconds,
    fastest_decision_seconds
  ) VALUES (
    p_split_test_id, analytics_data.total_votes,
    analytics_data.a_percentage, analytics_data.b_percentage,
    analytics_data.avg_confidence, consensus_strength,
    analytics_data.avg_a_rating, analytics_data.avg_b_rating,
    ABS(analytics_data.avg_a_rating - analytics_data.avg_b_rating),
    analytics_data.avg_time, analytics_data.min_time
  )
  ON CONFLICT (split_test_request_id) 
  DO UPDATE SET
    total_votes = analytics_data.total_votes,
    photo_a_vote_percentage = analytics_data.a_percentage,
    photo_b_vote_percentage = analytics_data.b_percentage,
    average_confidence = analytics_data.avg_confidence,
    photo_a_avg_rating = analytics_data.avg_a_rating,
    photo_b_avg_rating = analytics_data.avg_b_rating,
    rating_difference = ABS(analytics_data.avg_a_rating - analytics_data.avg_b_rating),
    average_judge_time_seconds = analytics_data.avg_time,
    fastest_decision_seconds = analytics_data.min_time,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update results when verdicts are submitted
CREATE OR REPLACE FUNCTION trigger_update_split_test_results()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_split_test_results(NEW.split_test_request_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_split_test_verdict_update ON public.split_test_verdicts;
CREATE TRIGGER trigger_split_test_verdict_update
  AFTER INSERT ON public.split_test_verdicts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_split_test_results();

-- Function to create a new split test
CREATE OR REPLACE FUNCTION create_split_test(
  p_user_id UUID,
  p_category VARCHAR(50),
  p_question TEXT,
  p_context TEXT,
  p_photo_a_url TEXT,
  p_photo_a_filename TEXT,
  p_photo_b_url TEXT,
  p_photo_b_filename TEXT,
  p_visibility VARCHAR(10) DEFAULT 'public',
  p_target_verdicts INTEGER DEFAULT 3
)
RETURNS UUID AS $$
DECLARE
  split_test_id UUID;
BEGIN
  -- Validate inputs
  IF p_question IS NULL OR LENGTH(TRIM(p_question)) = 0 THEN
    RAISE EXCEPTION 'Question is required for split test';
  END IF;
  
  IF p_photo_a_url IS NULL OR p_photo_b_url IS NULL THEN
    RAISE EXCEPTION 'Both photos are required for split test';
  END IF;
  
  -- Create split test record
  INSERT INTO public.split_test_requests (
    user_id, category, question, context,
    photo_a_url, photo_a_filename,
    photo_b_url, photo_b_filename,
    target_verdict_count, visibility
  ) VALUES (
    p_user_id, p_category, p_question, p_context,
    p_photo_a_url, p_photo_a_filename,
    p_photo_b_url, p_photo_b_filename,
    p_target_verdicts, p_visibility
  ) RETURNING id INTO split_test_id;
  
  RETURN split_test_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.split_test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_test_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_test_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view split tests they created or public ones
CREATE POLICY "Users can view split test requests" ON public.split_test_requests
  FOR SELECT USING (
    auth.uid() = user_id OR 
    visibility = 'public' OR 
    EXISTS (
      SELECT 1 FROM public.split_test_verdicts 
      WHERE split_test_request_id = split_test_requests.id 
      AND judge_id = auth.uid()
    )
  );

-- Users can create split test requests
CREATE POLICY "Users can create split test requests" ON public.split_test_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own split test requests (limited fields)
CREATE POLICY "Users can update own split test requests" ON public.split_test_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Judges can view verdicts they created or for split tests they can see
CREATE POLICY "Judges can view split test verdicts" ON public.split_test_verdicts
  FOR SELECT USING (
    auth.uid() = judge_id OR
    EXISTS (
      SELECT 1 FROM public.split_test_requests 
      WHERE id = split_test_verdicts.split_test_request_id
      AND (user_id = auth.uid() OR visibility = 'public')
    )
  );

-- Judges can create verdicts for open split tests
CREATE POLICY "Judges can create split test verdicts" ON public.split_test_verdicts
  FOR INSERT WITH CHECK (
    auth.uid() = judge_id AND
    EXISTS (
      SELECT 1 FROM public.split_test_requests 
      WHERE id = split_test_request_id 
      AND status IN ('open', 'in_progress')
      AND received_verdict_count < target_verdict_count
    )
  );

-- Users can view analytics for their split tests or public ones
CREATE POLICY "Users can view split test analytics" ON public.split_test_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.split_test_requests 
      WHERE id = split_test_analytics.split_test_request_id
      AND (user_id = auth.uid() OR visibility = 'public')
    )
  );

-- Grant permissions
GRANT ALL ON public.split_test_requests TO authenticated;
GRANT ALL ON public.split_test_verdicts TO authenticated;
GRANT ALL ON public.split_test_analytics TO authenticated;

-- Add unique constraint to analytics
ALTER TABLE public.split_test_analytics ADD CONSTRAINT unique_split_test_analytics UNIQUE(split_test_request_id);

-- Comments for documentation
COMMENT ON TABLE public.split_test_requests IS 'A/B photo comparison requests where judges pick the better option';
COMMENT ON TABLE public.split_test_verdicts IS 'Judge verdicts comparing two photos in a split test';
COMMENT ON TABLE public.split_test_analytics IS 'Aggregated analytics and insights for completed split tests';
COMMENT ON FUNCTION create_split_test(UUID, VARCHAR, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, VARCHAR, INTEGER) IS 'Creates a new A/B photo comparison test';
COMMENT ON FUNCTION update_split_test_results(UUID) IS 'Updates vote counts and determines winner for a split test';
COMMENT ON FUNCTION update_split_test_analytics(UUID) IS 'Calculates detailed analytics for a completed split test';