-- Add reputation tracking to existing tables
ALTER TABLE user_credits 
ADD COLUMN reputation_score DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN reviewer_status TEXT CHECK (reviewer_status IN ('active', 'probation', 'calibration_required')) DEFAULT 'active',
ADD COLUMN last_calibration TIMESTAMPTZ,
ADD COLUMN total_reviews INTEGER DEFAULT 0,
ADD COLUMN consensus_rate DECIMAL(3,2) DEFAULT 1.0;

-- Track helpfulness ratings for each review
CREATE TABLE reviewer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES feedback_responses(id) ON DELETE CASCADE,
  helpfulness_rating INTEGER NOT NULL CHECK (helpfulness_rating BETWEEN 1 AND 5),
  quality_score DECIMAL(3,2), -- Automated quality analysis score
  rated_by UUID NOT NULL REFERENCES auth.users(id), -- Who gave this rating
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate ratings
  UNIQUE(response_id, rated_by)
);

-- Expert verification system
CREATE TABLE expert_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('linkedin', 'portfolio', 'manual')),
  linkedin_url TEXT,
  portfolio_url TEXT,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  years_experience INTEGER,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  verification_data JSONB, -- Store additional verification info
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation history for audit trail
CREATE TABLE reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_score DECIMAL(3,2),
  new_score DECIMAL(3,2),
  old_status TEXT,
  new_status TEXT,
  trigger_event TEXT NOT NULL, -- 'rating_received', 'consensus_calculated', 'manual_adjustment'
  trigger_id UUID, -- ID of the rating/response that triggered this
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calibration tests for low-performing reviewers
CREATE TABLE calibration_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  test_data JSONB NOT NULL, -- Questions, correct answers, scoring criteria
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track calibration test results
CREATE TABLE calibration_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES calibration_tests(id),
  score DECIMAL(3,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL, -- User's answers
  time_taken INTEGER, -- Seconds to complete
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reviewer_ratings_reviewer ON reviewer_ratings(reviewer_id);
CREATE INDEX idx_reviewer_ratings_request ON reviewer_ratings(request_id);
CREATE INDEX idx_reviewer_ratings_created ON reviewer_ratings(created_at);
CREATE INDEX idx_expert_verifications_user ON expert_verifications(user_id);
CREATE INDEX idx_expert_verifications_status ON expert_verifications(verification_status);
CREATE INDEX idx_reputation_history_user ON reputation_history(user_id);
CREATE INDEX idx_calibration_results_user ON calibration_results(user_id);

-- RLS policies
ALTER TABLE reviewer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_results ENABLE ROW LEVEL SECURITY;

-- Users can view ratings for their own reviews
CREATE POLICY "Users can view ratings for their responses" ON reviewer_ratings
  FOR SELECT USING (reviewer_id = auth.uid());

-- Users can rate others' reviews (but not their own)
CREATE POLICY "Users can rate others' reviews" ON reviewer_ratings
  FOR INSERT WITH CHECK (
    rated_by = auth.uid() 
    AND reviewer_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM feedback_responses fr
      JOIN verdict_requests vr ON fr.request_id = vr.id
      WHERE fr.id = response_id AND vr.user_id = auth.uid()
    )
  );

-- Users can view their own verification status
CREATE POLICY "Users can view own verification" ON expert_verifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can create verification requests
CREATE POLICY "Users can request verification" ON expert_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own reputation history
CREATE POLICY "Users can view own reputation history" ON reputation_history
  FOR SELECT USING (user_id = auth.uid());

-- Everyone can view active calibration tests
CREATE POLICY "Anyone can view active calibration tests" ON calibration_tests
  FOR SELECT USING (active = true);

-- Users can view their own calibration results
CREATE POLICY "Users can view own calibration results" ON calibration_results
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own calibration results
CREATE POLICY "Users can submit calibration results" ON calibration_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update function for reputation tracking
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called by the application layer
  -- when reputation needs recalculation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user needs calibration
CREATE OR REPLACE FUNCTION check_calibration_requirement(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_score DECIMAL(3,2);
  current_status TEXT;
  needs_calibration BOOLEAN := FALSE;
BEGIN
  SELECT reputation_score, reviewer_status
  INTO current_score, current_status
  FROM user_credits
  WHERE user_id = user_uuid;
  
  -- Require calibration if score is too low
  IF current_score < 2.5 OR current_status = 'calibration_required' THEN
    needs_calibration := TRUE;
  END IF;
  
  RETURN needs_calibration;
END;
$$ LANGUAGE plpgsql;