-- User Journey Tracking System
-- Tracks user onboarding progress and contextual feature discovery

-- Table for tracking journey trigger history
CREATE TABLE IF NOT EXISTS public.user_journey_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger_id VARCHAR(50) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL,
  last_shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completion_action VARCHAR(100),
  dismissed_permanently BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_trigger UNIQUE(user_id, trigger_id)
);

-- Table for general user actions (analytics and journey tracking)
CREATE TABLE IF NOT EXISTS public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add journey-related columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dismissed_features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'none' CHECK (verification_status IN ('none', 'basic', 'verified', 'expert')),
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS journey_state JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_journey_triggers_user_id ON public.user_journey_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_triggers_type ON public.user_journey_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_triggers_shown_at ON public.user_journey_triggers(last_shown_at);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON public.user_actions(action);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON public.user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_session_id ON public.user_actions(session_id);

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  metrics RECORD;
BEGIN
  -- Get user activity metrics
  SELECT 
    (SELECT COUNT(*) FROM public.verdict_requests WHERE user_id = p_user_id) as requests_submitted,
    (SELECT COUNT(*) FROM public.verdict_requests WHERE user_id = p_user_id AND status = 'closed') as requests_completed,
    (SELECT COUNT(*) FROM public.tips WHERE tipper_id = p_user_id AND payment_status = 'succeeded') as tips_given,
    (SELECT COUNT(*) FROM public.user_actions WHERE user_id = p_user_id AND action = 'verdict_shared') as shares_created,
    (SELECT COUNT(*) FROM public.split_test_requests WHERE user_id = p_user_id) as split_tests_created,
    (SELECT COUNT(*) FROM public.verdict_responses WHERE judge_id = p_user_id) as verdicts_given
  INTO metrics;
  
  -- Calculate score based on activities
  score := score + (metrics.requests_submitted * 10);
  score := score + (metrics.requests_completed * 15);
  score := score + (metrics.tips_given * 20);
  score := score + (metrics.shares_created * 25);
  score := score + (metrics.split_tests_created * 15);
  score := score + (metrics.verdicts_given * 8);
  
  -- Completion rate bonus
  IF metrics.requests_submitted > 0 THEN
    score := score + ((metrics.requests_completed::DECIMAL / metrics.requests_submitted) * 20)::INTEGER;
  END IF;
  
  -- Update the cached score
  UPDATE public.profiles 
  SET engagement_score = score, updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to track user actions
CREATE OR REPLACE FUNCTION track_user_action(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_metadata JSONB DEFAULT NULL,
  p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.user_actions (
    user_id, action, metadata, session_id
  ) VALUES (
    p_user_id, p_action, p_metadata, p_session_id
  ) RETURNING id INTO action_id;
  
  -- Update engagement score if it's a significant action
  IF p_action IN ('verdict_submitted', 'tip_sent', 'verdict_shared', 'split_test_created') THEN
    PERFORM calculate_user_engagement_score(p_user_id);
  END IF;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record journey trigger shown
CREATE OR REPLACE FUNCTION record_journey_trigger(
  p_user_id UUID,
  p_trigger_id VARCHAR(50),
  p_trigger_type VARCHAR(20),
  p_completed BOOLEAN DEFAULT false,
  p_completion_action VARCHAR(100) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_journey_triggers (
    user_id, trigger_id, trigger_type, completed, completion_action
  ) VALUES (
    p_user_id, p_trigger_id, p_trigger_type, p_completed, p_completion_action
  )
  ON CONFLICT (user_id, trigger_id) 
  DO UPDATE SET
    last_shown_at = NOW(),
    completed = p_completed,
    completion_action = COALESCE(p_completion_action, user_journey_triggers.completion_action),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended features for user
CREATE OR REPLACE FUNCTION get_recommended_features(p_user_id UUID)
RETURNS TABLE (
  feature_id VARCHAR(50),
  feature_type VARCHAR(20),
  priority INTEGER,
  reason TEXT
) AS $$
DECLARE
  user_state RECORD;
BEGIN
  -- Get user activity state
  SELECT 
    (SELECT COUNT(*) FROM public.verdict_requests WHERE user_id = p_user_id) as total_requests,
    (SELECT COUNT(*) FROM public.verdict_requests WHERE user_id = p_user_id AND status = 'closed') as completed_requests,
    (SELECT COUNT(*) FROM public.tips WHERE tipper_id = p_user_id) as tips_sent,
    (SELECT COUNT(*) FROM public.split_test_requests WHERE user_id = p_user_id) as split_tests,
    (SELECT engagement_score FROM public.profiles WHERE id = p_user_id) as engagement_score,
    (SELECT dismissed_features FROM public.profiles WHERE id = p_user_id) as dismissed_features
  INTO user_state;
  
  -- Recommend tipping if they've received feedback but never tipped
  IF user_state.completed_requests > 0 AND user_state.tips_sent = 0 AND 
     NOT ('tipping_intro' = ANY(user_state.dismissed_features)) THEN
    feature_id := 'tipping_intro';
    feature_type := 'after_feedback';
    priority := 8;
    reason := 'User has received feedback but hasn''t tipped anyone yet';
    RETURN NEXT;
  END IF;
  
  -- Recommend split test if they have multiple requests but haven't used it
  IF user_state.completed_requests >= 2 AND user_state.split_tests = 0 AND
     NOT ('split_test_intro' = ANY(user_state.dismissed_features)) THEN
    feature_id := 'split_test_intro';
    feature_type := 'multiple_photos';
    priority := 7;
    reason := 'User has experience with feedback but hasn''t tried split testing';
    RETURN NEXT;
  END IF;
  
  -- Recommend sharing if high engagement but no shares
  IF user_state.engagement_score >= 50 AND
     NOT ('sharing_intro' = ANY(user_state.dismissed_features)) AND
     NOT EXISTS (SELECT 1 FROM public.user_actions WHERE user_id = p_user_id AND action = 'verdict_shared') THEN
    feature_id := 'sharing_intro';
    feature_type := 'high_engagement';
    priority := 6;
    reason := 'High engagement user who hasn''t shared results yet';
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.user_journey_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own journey data
CREATE POLICY "Users can manage their journey triggers" ON public.user_journey_triggers
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own actions, admins can view all
CREATE POLICY "Users can view their actions" ON public.user_actions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  );

-- Service role can insert actions for tracking
CREATE POLICY "Service can insert actions" ON public.user_actions
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.user_journey_triggers TO authenticated;
GRANT ALL ON public.user_actions TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_journey_triggers IS 'Tracks when contextual feature intros are shown to users';
COMMENT ON TABLE public.user_actions IS 'General user activity tracking for analytics and journey optimization';
COMMENT ON FUNCTION calculate_user_engagement_score(UUID) IS 'Calculates user engagement score based on activity metrics';
COMMENT ON FUNCTION track_user_action(UUID, VARCHAR, JSONB, VARCHAR) IS 'Records user action and updates engagement score';
COMMENT ON FUNCTION record_journey_trigger(UUID, VARCHAR, VARCHAR, BOOLEAN, VARCHAR) IS 'Records when a journey trigger is shown or completed';
COMMENT ON FUNCTION get_recommended_features(UUID) IS 'Returns recommended features for a user based on their journey state';