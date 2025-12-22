-- Verdict Utility Tracking Schema
-- Tracks real-world outcomes and impact of verdicts to build social proof

-- Core table: Track what users do with their verdicts
CREATE TABLE verdict_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Outcome tracking
  outcome_type VARCHAR(50) NOT NULL CHECK (outcome_type IN (
    'implemented_suggestion',
    'changed_decision', 
    'gained_confidence',
    'avoided_mistake',
    'improved_outcome',
    'saved_time',
    'saved_money',
    'reduced_risk',
    'other'
  )),
  
  -- Quantitative impact
  time_saved_hours INTEGER,
  money_saved_amount DECIMAL(10,2),
  money_saved_currency VARCHAR(3) DEFAULT 'USD',
  confidence_before INTEGER CHECK (confidence_before >= 1 AND confidence_before <= 10),
  confidence_after INTEGER CHECK (confidence_after >= 1 AND confidence_after <= 10),
  
  -- Qualitative feedback
  outcome_description TEXT,
  specific_verdict_used UUID REFERENCES feedback_responses(id), -- Which specific verdict was most helpful
  would_recommend BOOLEAN DEFAULT TRUE,
  
  -- Follow-up and validation
  outcome_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50), -- 'photo', 'receipt', 'testimonial', 'reference'
  verification_data JSONB, -- Store verification proof
  
  -- Timeline
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outcome_occurred_at TIMESTAMP WITH TIME ZONE,
  
  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,
  allow_case_study BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Success stories for social proof
CREATE TABLE success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_outcome_id UUID NOT NULL REFERENCES verdict_outcomes(id) ON DELETE CASCADE,
  
  -- Story content
  headline VARCHAR(200) NOT NULL,
  story_text TEXT NOT NULL,
  before_situation TEXT,
  after_situation TEXT,
  
  -- Categorization
  category VARCHAR(50), -- 'career', 'business', 'personal', 'creative', etc.
  impact_level VARCHAR(20) CHECK (impact_level IN ('minor', 'moderate', 'significant', 'life_changing')),
  
  -- Social proof metrics
  story_views INTEGER DEFAULT 0,
  story_likes INTEGER DEFAULT 0,
  story_shares INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  
  -- Moderation
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Display
  display_name VARCHAR(100), -- How user wants to be credited
  profile_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track verdict implementation steps
CREATE TABLE verdict_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_outcome_id UUID NOT NULL REFERENCES verdict_outcomes(id) ON DELETE CASCADE,
  verdict_response_id UUID NOT NULL REFERENCES feedback_responses(id) ON DELETE CASCADE,
  
  -- Implementation details
  step_number INTEGER NOT NULL,
  step_description TEXT NOT NULL,
  step_completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Results tracking
  step_difficulty INTEGER CHECK (step_difficulty >= 1 AND step_difficulty <= 5),
  step_effectiveness INTEGER CHECK (step_effectiveness >= 1 AND step_effectiveness <= 5),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track long-term follow-ups
CREATE TABLE verdict_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Follow-up scheduling
  followup_type VARCHAR(50) CHECK (followup_type IN (
    'outcome_check', 'satisfaction_survey', 'case_study_interview', 'impact_assessment'
  )),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Response tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  response_data JSONB,
  
  -- Automation
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge impact tracking (for judge motivation)
CREATE TABLE judge_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict_response_id UUID NOT NULL REFERENCES feedback_responses(id) ON DELETE CASCADE,
  
  -- Impact metrics when their verdict is used
  outcome_id UUID REFERENCES verdict_outcomes(id),
  
  -- Calculated impact scores
  time_saved_contributed_hours DECIMAL(8,2) DEFAULT 0,
  money_saved_contributed_amount DECIMAL(10,2) DEFAULT 0,
  confidence_boost_contributed DECIMAL(4,2) DEFAULT 0,
  
  -- Recognition
  received_thanks BOOLEAN DEFAULT FALSE,
  featured_in_story BOOLEAN DEFAULT FALSE,
  
  -- Judge satisfaction
  judge_satisfaction_rating INTEGER CHECK (judge_satisfaction_rating >= 1 AND judge_satisfaction_rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregate impact statistics
CREATE TABLE platform_impact_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  
  -- Daily aggregates
  total_outcomes_reported INTEGER DEFAULT 0,
  total_time_saved_hours DECIMAL(10,2) DEFAULT 0,
  total_money_saved DECIMAL(15,2) DEFAULT 0,
  average_confidence_boost DECIMAL(4,2) DEFAULT 0,
  
  -- Success story metrics
  stories_created INTEGER DEFAULT 0,
  stories_approved INTEGER DEFAULT 0,
  total_story_views INTEGER DEFAULT 0,
  
  -- Judge impact
  judges_with_impact INTEGER DEFAULT 0,
  average_judge_satisfaction DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_verdict_outcomes_request ON verdict_outcomes(verdict_request_id);
CREATE INDEX idx_verdict_outcomes_user ON verdict_outcomes(user_id);
CREATE INDEX idx_verdict_outcomes_type ON verdict_outcomes(outcome_type);
CREATE INDEX idx_verdict_outcomes_public ON verdict_outcomes(is_public) WHERE is_public = TRUE;

CREATE INDEX idx_success_stories_category ON success_stories(category);
CREATE INDEX idx_success_stories_featured ON success_stories(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_success_stories_approved ON success_stories(is_approved) WHERE is_approved = TRUE;

CREATE INDEX idx_judge_impact_judge ON judge_impact_metrics(judge_id);
CREATE INDEX idx_judge_impact_response ON judge_impact_metrics(verdict_response_id);

CREATE INDEX idx_platform_stats_date ON platform_impact_stats(stat_date);

-- Row Level Security
ALTER TABLE verdict_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_impact_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can manage their own outcome data
CREATE POLICY "Users can manage own outcomes" ON verdict_outcomes
  FOR ALL USING (auth.uid() = user_id);

-- Public outcomes viewable by all
CREATE POLICY "Public outcomes viewable" ON verdict_outcomes
  FOR SELECT USING (is_public = TRUE);

-- Success stories - approved ones are public
CREATE POLICY "Approved stories are public" ON success_stories
  FOR SELECT USING (is_approved = TRUE);

-- Users can manage their own stories
CREATE POLICY "Users can manage own stories" ON success_stories
  FOR ALL USING (auth.uid() = (SELECT user_id FROM verdict_outcomes WHERE id = verdict_outcome_id));

-- Implementation steps follow outcome permissions
CREATE POLICY "Implementation access follows outcome" ON verdict_implementations
  FOR ALL USING (auth.uid() = (SELECT user_id FROM verdict_outcomes WHERE id = verdict_outcome_id));

-- Follow-ups accessible to request owner
CREATE POLICY "Followup access to owner" ON verdict_followups
  FOR ALL USING (auth.uid() = user_id);

-- Judges can see their impact
CREATE POLICY "Judge impact visibility" ON judge_impact_metrics
  FOR SELECT USING (auth.uid() = judge_id);

-- Functions for automated tracking

-- Function to calculate judge impact when outcome is reported
CREATE OR REPLACE FUNCTION calculate_judge_impact()
RETURNS TRIGGER AS $$
BEGIN
  -- Update impact metrics for all judges who contributed to this verdict
  INSERT INTO judge_impact_metrics (
    judge_id,
    verdict_response_id,
    outcome_id,
    time_saved_contributed_hours,
    money_saved_contributed_amount,
    confidence_boost_contributed
  )
  SELECT 
    fr.user_id as judge_id,
    fr.id as verdict_response_id,
    NEW.id as outcome_id,
    COALESCE(NEW.time_saved_hours, 0) * 
      (fr.helpfulness_score / (SELECT SUM(helpfulness_score) FROM feedback_responses WHERE verdict_request_id = NEW.verdict_request_id)),
    COALESCE(NEW.money_saved_amount, 0) * 
      (fr.helpfulness_score / (SELECT SUM(helpfulness_score) FROM feedback_responses WHERE verdict_request_id = NEW.verdict_request_id)),
    COALESCE(NEW.confidence_after - NEW.confidence_before, 0) * 
      (fr.helpfulness_score / (SELECT SUM(helpfulness_score) FROM feedback_responses WHERE verdict_request_id = NEW.verdict_request_id))
  FROM feedback_responses fr
  WHERE fr.verdict_request_id = NEW.verdict_request_id
    AND fr.helpfulness_score > 0;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run judge impact calculation
CREATE TRIGGER trigger_calculate_judge_impact
  AFTER INSERT ON verdict_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_judge_impact();

-- Function to update daily platform stats
CREATE OR REPLACE FUNCTION update_daily_platform_stats()
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_impact_stats (
    stat_date,
    total_outcomes_reported,
    total_time_saved_hours,
    total_money_saved,
    average_confidence_boost,
    stories_created,
    stories_approved,
    total_story_views,
    judges_with_impact,
    average_judge_satisfaction
  )
  SELECT
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
    COALESCE(SUM(time_saved_hours) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0),
    COALESCE(SUM(money_saved_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0),
    COALESCE(AVG(confidence_after - confidence_before) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0),
    (SELECT COUNT(*) FROM success_stories WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM success_stories WHERE DATE(updated_at) = CURRENT_DATE AND is_approved = TRUE),
    (SELECT COALESCE(SUM(story_views), 0) FROM success_stories),
    (SELECT COUNT(DISTINCT judge_id) FROM judge_impact_metrics WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(AVG(judge_satisfaction_rating), 0) FROM judge_impact_metrics WHERE DATE(created_at) = CURRENT_DATE)
  FROM verdict_outcomes
  ON CONFLICT (stat_date) DO UPDATE SET
    total_outcomes_reported = EXCLUDED.total_outcomes_reported,
    total_time_saved_hours = EXCLUDED.total_time_saved_hours,
    total_money_saved = EXCLUDED.total_money_saved,
    average_confidence_boost = EXCLUDED.average_confidence_boost,
    stories_created = EXCLUDED.stories_created,
    stories_approved = EXCLUDED.stories_approved,
    total_story_views = EXCLUDED.total_story_views,
    judges_with_impact = EXCLUDED.judges_with_impact,
    average_judge_satisfaction = EXCLUDED.average_judge_satisfaction;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for relevant tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verdict_outcomes_updated_at
  BEFORE UPDATE ON verdict_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_success_stories_updated_at
  BEFORE UPDATE ON success_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_judge_impact_updated_at
  BEFORE UPDATE ON judge_impact_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();