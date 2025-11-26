-- Judge Quality & Content Moderation System
-- Migration: 0005_judge_quality_system.sql

-- Add moderation fields to verdict_requests
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS auto_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 100;

-- Add moderation fields to verdict_responses  
ALTER TABLE verdict_responses ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE verdict_responses ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE verdict_responses ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE verdict_responses ADD COLUMN IF NOT EXISTS auto_hidden BOOLEAN DEFAULT FALSE;

-- Add judge status tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_status_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_suspended_until TIMESTAMP;

-- Create judge performance tracking table
CREATE TABLE IF NOT EXISTS judge_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_verdicts INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  average_response_time INTEGER DEFAULT 0, -- in minutes
  quality_score INTEGER DEFAULT 100,
  report_count INTEGER DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, probation, suspended, banned
  tier VARCHAR(20) DEFAULT 'new', -- new, bronze, silver, gold, expert
  earnings_multiplier DECIMAL(3,2) DEFAULT 1.0,
  assignment_priority INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(judge_id),
  CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
  CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 100),
  CONSTRAINT valid_priority CHECK (assignment_priority >= 0 AND assignment_priority <= 150)
);

-- Create verdict ratings table
CREATE TABLE IF NOT EXISTS verdict_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_response_id UUID REFERENCES verdict_responses(id) ON DELETE CASCADE,
  request_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  helpful BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(verdict_response_id, request_user_id) -- One rating per verdict per user
);

-- Create content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'request', 'verdict', 'judge'
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL, -- 'inappropriate', 'unhelpful', 'offensive', 'spam', 'other'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, dismissed, upheld
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(content_type, content_id, reported_by) -- One report per user per content
);

-- Create judge reports table (specific to judge behavior)
CREATE TABLE IF NOT EXISTS judge_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verdict_response_id UUID REFERENCES verdict_responses(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create moderation log for tracking all moderation actions
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'flagged', 'approved', 'hidden', 'banned'
  reason TEXT,
  automated BOOLEAN DEFAULT TRUE,
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_performance_judge_id ON judge_performance(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_performance_status ON judge_performance(status);
CREATE INDEX IF NOT EXISTS idx_judge_performance_tier ON judge_performance(tier);
CREATE INDEX IF NOT EXISTS idx_judge_performance_priority ON judge_performance(assignment_priority DESC);

CREATE INDEX IF NOT EXISTS idx_verdict_ratings_verdict_id ON verdict_ratings(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_verdict_ratings_judge_id ON verdict_ratings(judge_id);
CREATE INDEX IF NOT EXISTS idx_verdict_ratings_rating ON verdict_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_judge_reports_judge_id ON judge_reports(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_reports_status ON judge_reports(status);

CREATE INDEX IF NOT EXISTS idx_moderation_log_content ON moderation_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON moderation_log(action);

-- RLS Policies
ALTER TABLE judge_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Judge performance - judges can see their own, users can see basic stats
CREATE POLICY "Judges can view own performance" ON judge_performance
  FOR SELECT USING (auth.uid() = judge_id);

CREATE POLICY "Public can view basic judge stats" ON judge_performance
  FOR SELECT USING (true); -- Public read access for judge selection

-- Verdict ratings - users can rate verdicts they requested
CREATE POLICY "Users can rate verdicts on their requests" ON verdict_ratings
  FOR INSERT WITH CHECK (auth.uid() = request_user_id);

CREATE POLICY "Users can view ratings on their requests" ON verdict_ratings
  FOR SELECT USING (auth.uid() = request_user_id OR auth.uid() = judge_id);

-- Content reports - users can report content and view their own reports  
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Judge reports - similar to content reports
CREATE POLICY "Users can report judges" ON judge_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view own judge reports" ON judge_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Moderation log - admin only (no policies = only service role access)

-- Functions for automatic judge performance updates
CREATE OR REPLACE FUNCTION update_judge_performance()
RETURNS TRIGGER AS $$
DECLARE
  judge_id UUID;
  avg_rating DECIMAL(3,2);
  verdict_count INTEGER;
  avg_response_time INTEGER;
BEGIN
  -- Get judge ID from the verdict response
  IF TG_TABLE_NAME = 'verdict_ratings' THEN
    judge_id := NEW.judge_id;
  ELSIF TG_TABLE_NAME = 'verdict_responses' THEN
    judge_id := NEW.judge_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Calculate statistics
  SELECT 
    AVG(vr.rating)::DECIMAL(3,2),
    COUNT(DISTINCT resp.id)::INTEGER,
    AVG(EXTRACT(EPOCH FROM (resp.created_at - req.created_at))/60)::INTEGER
  INTO avg_rating, verdict_count, avg_response_time
  FROM verdict_responses resp
  JOIN verdict_requests req ON resp.request_id = req.id
  LEFT JOIN verdict_ratings vr ON vr.verdict_response_id = resp.id
  WHERE resp.judge_id = judge_id;

  -- Update or insert judge performance
  INSERT INTO judge_performance (
    judge_id, 
    total_verdicts, 
    average_rating, 
    average_response_time,
    last_active,
    updated_at
  ) VALUES (
    judge_id,
    COALESCE(verdict_count, 0),
    COALESCE(avg_rating, 0),
    COALESCE(avg_response_time, 0),
    NOW(),
    NOW()
  )
  ON CONFLICT (judge_id) 
  DO UPDATE SET
    total_verdicts = COALESCE(verdict_count, 0),
    average_rating = COALESCE(avg_rating, 0),
    average_response_time = COALESCE(avg_response_time, 0),
    last_active = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic performance updates
DROP TRIGGER IF EXISTS trigger_update_judge_performance_on_rating ON verdict_ratings;
CREATE TRIGGER trigger_update_judge_performance_on_rating
  AFTER INSERT OR UPDATE ON verdict_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_judge_performance();

DROP TRIGGER IF EXISTS trigger_update_judge_performance_on_response ON verdict_responses;
CREATE TRIGGER trigger_update_judge_performance_on_response
  AFTER INSERT ON verdict_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_judge_performance();

-- Function to automatically handle content reports
CREATE OR REPLACE FUNCTION handle_content_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-hide content if it gets 3+ reports
  UPDATE verdict_requests 
  SET auto_hidden = TRUE, report_count = report_count + 1
  WHERE id = NEW.content_id 
    AND NEW.content_type = 'request'
    AND (
      SELECT COUNT(*) 
      FROM content_reports 
      WHERE content_type = 'request' 
        AND content_id = NEW.content_id 
        AND status = 'pending'
    ) >= 3;

  UPDATE verdict_responses 
  SET auto_hidden = TRUE, report_count = report_count + 1
  WHERE id = NEW.content_id 
    AND NEW.content_type = 'verdict'
    AND (
      SELECT COUNT(*) 
      FROM content_reports 
      WHERE content_type = 'verdict' 
        AND content_id = NEW.content_id 
        AND status = 'pending'
    ) >= 3;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-hiding reported content
DROP TRIGGER IF EXISTS trigger_handle_content_report ON content_reports;
CREATE TRIGGER trigger_handle_content_report
  AFTER INSERT ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_content_report();