-- Judge Quality Control & Rating System
-- Adds comprehensive judge qualification, rating, and quality management

-- 1. JUDGE QUALIFICATIONS TABLE
-- Tracks judge application and qualification process
CREATE TABLE public.judge_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User applying to be judge
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Application details
  application_status text NOT NULL DEFAULT 'pending' CHECK (application_status IN (
    'pending',      -- Application submitted, awaiting review
    'reviewing',    -- Under admin review
    'test_phase',   -- Taking qualification test
    'approved',     -- Qualified to judge
    'rejected',     -- Application rejected
    'revoked'       -- Qualification revoked
  )),
  
  -- Qualification test
  test_score decimal(5,2) CHECK (test_score >= 0 AND test_score <= 100),
  test_completed_at timestamptz,
  test_attempts integer DEFAULT 0,
  max_test_attempts integer DEFAULT 3,
  
  -- Application info
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  specialties text[], -- Categories they want to judge
  motivation_text text,
  
  -- Review details
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  
  -- Performance tracking
  total_verdicts integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0.0,
  approval_rate decimal(3,2) DEFAULT 0.0,
  response_time_hours decimal(5,2) DEFAULT 0.0,
  
  UNIQUE(user_id)
);

-- 2. JUDGE PERFORMANCE METRICS
-- Detailed tracking of judge performance over time
CREATE TABLE public.judge_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Time period for metrics (weekly aggregation)
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Volume metrics
  verdicts_submitted integer DEFAULT 0,
  verdicts_approved integer DEFAULT 0,
  verdicts_rejected integer DEFAULT 0,
  
  -- Quality metrics
  average_user_rating decimal(3,2) DEFAULT 0.0,
  average_helpfulness_score decimal(3,2) DEFAULT 0.0,
  reports_received integer DEFAULT 0,
  
  -- Timing metrics
  average_response_time_hours decimal(5,2) DEFAULT 0.0,
  fastest_response_minutes integer DEFAULT 0,
  slowest_response_hours integer DEFAULT 0,
  
  -- Engagement metrics
  requests_viewed integer DEFAULT 0,
  requests_skipped integer DEFAULT 0,
  completion_rate decimal(3,2) DEFAULT 0.0,
  
  UNIQUE(judge_id, period_start)
);

-- 3. VERDICT QUALITY RATINGS
-- User ratings of verdict quality
CREATE TABLE public.verdict_quality_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- What's being rated
  verdict_response_id uuid NOT NULL REFERENCES public.verdict_responses(id) ON DELETE CASCADE,
  request_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Quality ratings (1-5 scale)
  helpfulness_rating integer CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  constructiveness_rating integer CHECK (constructiveness_rating >= 1 AND constructiveness_rating <= 5),
  
  -- Overall satisfaction
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Feedback
  feedback_text text CHECK (char_length(feedback_text) <= 500),
  
  -- Flags
  would_recommend_judge boolean DEFAULT true,
  is_featured_worthy boolean DEFAULT false,
  
  UNIQUE(verdict_response_id, request_owner_id)
);

-- 4. JUDGE TIER SYSTEM
-- Tracks judge levels and privileges
CREATE TABLE public.judge_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Tier information
  current_tier text NOT NULL DEFAULT 'bronze' CHECK (current_tier IN (
    'bronze',    -- New judges
    'silver',    -- Experienced judges
    'gold',      -- High-quality judges
    'platinum',  -- Expert judges
    'diamond'    -- Elite judges
  )),
  
  -- Tier progression
  tier_points integer DEFAULT 0,
  next_tier_threshold integer DEFAULT 100,
  tier_achieved_at timestamptz DEFAULT now(),
  previous_tier text,
  
  -- Privileges and rewards
  priority_queue_access boolean DEFAULT false,
  bonus_credits_per_verdict integer DEFAULT 0,
  featured_judge boolean DEFAULT false,
  mentor_status boolean DEFAULT false,
  
  -- Requirements tracking
  verdicts_this_period integer DEFAULT 0,
  rating_this_period decimal(3,2) DEFAULT 0.0,
  
  UNIQUE(judge_id)
);

-- 5. Add performance fields to existing tables
ALTER TABLE public.profiles 
ADD COLUMN judge_tier text DEFAULT 'bronze' CHECK (judge_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
ADD COLUMN judge_rating decimal(3,2) DEFAULT 0.0,
ADD COLUMN judge_total_verdicts integer DEFAULT 0,
ADD COLUMN judge_total_reports integer DEFAULT 0,
ADD COLUMN judge_last_active timestamptz,
ADD COLUMN is_mentor boolean DEFAULT false,
ADD COLUMN is_featured_judge boolean DEFAULT false;

-- Add quality tracking to verdict_responses
ALTER TABLE public.verdict_responses
ADD COLUMN quality_score decimal(3,2) DEFAULT 0.0,
ADD COLUMN helpfulness_rating decimal(3,2) DEFAULT 0.0,
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN admin_quality_review text CHECK (admin_quality_review IN ('pending', 'approved', 'flagged', 'excellent'));

-- 6. INDEXES for performance
CREATE INDEX judge_qualifications_user_id_idx ON public.judge_qualifications(user_id);
CREATE INDEX judge_qualifications_status_idx ON public.judge_qualifications(application_status);
CREATE INDEX judge_performance_judge_period_idx ON public.judge_performance_metrics(judge_id, period_start);
CREATE INDEX verdict_quality_verdict_idx ON public.verdict_quality_ratings(verdict_response_id);
CREATE INDEX verdict_quality_judge_idx ON public.verdict_quality_ratings(judge_id);
CREATE INDEX judge_tiers_tier_idx ON public.judge_tiers(current_tier, tier_points);
CREATE INDEX profiles_judge_rating_idx ON public.profiles(judge_rating DESC) WHERE is_judge = true;

-- 7. RLS Policies

-- Judge qualifications - users can view their own, admins can view all
ALTER TABLE public.judge_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own qualification" ON public.judge_qualifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all qualifications" ON public.judge_qualifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Judge performance metrics - judges can view their own, admins can view all
ALTER TABLE public.judge_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own metrics" ON public.judge_performance_metrics
  FOR SELECT USING (auth.uid() = judge_id);

CREATE POLICY "Admins can view all metrics" ON public.judge_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Verdict quality ratings - request owners can create/view, judges can view their ratings
ALTER TABLE public.verdict_quality_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Request owners can rate verdicts" ON public.verdict_quality_ratings
  FOR ALL USING (auth.uid() = request_owner_id);

CREATE POLICY "Judges can view their ratings" ON public.verdict_quality_ratings
  FOR SELECT USING (auth.uid() = judge_id);

-- Judge tiers - judges can view their own, public can view basic info
ALTER TABLE public.judge_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own tier" ON public.judge_tiers
  FOR SELECT USING (auth.uid() = judge_id);

CREATE POLICY "Public can view basic tier info" ON public.judge_tiers
  FOR SELECT USING (true); -- Allow public viewing for leaderboards

-- 8. Functions for judge quality management

-- Function to calculate judge performance score
CREATE OR REPLACE FUNCTION public.calculate_judge_performance_score(target_judge_id uuid)
RETURNS decimal(3,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  avg_rating decimal(3,2);
  total_verdicts integer;
  approval_rate decimal(3,2);
  response_time_score decimal(3,2);
  final_score decimal(3,2);
BEGIN
  -- Get basic metrics
  SELECT 
    COALESCE(AVG(vqr.overall_rating), 0),
    COUNT(vr.id),
    COALESCE(AVG(CASE WHEN vr.moderation_status = 'approved' THEN 1.0 ELSE 0.0 END), 0)
  INTO avg_rating, total_verdicts, approval_rate
  FROM public.verdict_responses vr
  LEFT JOIN public.verdict_quality_ratings vqr ON vr.id = vqr.verdict_response_id
  WHERE vr.judge_id = target_judge_id
    AND vr.created_at >= now() - interval '30 days';
    
  -- Calculate response time score (lower is better, scale to 0-5)
  SELECT COALESCE(
    5 - LEAST(4, AVG(EXTRACT(epoch FROM (vr.created_at - vreq.created_at)) / 3600) / 24), 
    0
  ) INTO response_time_score
  FROM public.verdict_responses vr
  JOIN public.verdict_requests vreq ON vr.request_id = vreq.id
  WHERE vr.judge_id = target_judge_id
    AND vr.created_at >= now() - interval '30 days';
  
  -- Combine scores (weighted average)
  final_score := (
    avg_rating * 0.4 +           -- 40% user ratings
    (approval_rate * 5) * 0.3 +  -- 30% approval rate  
    response_time_score * 0.2 +  -- 20% response time
    LEAST(5, total_verdicts / 10.0) * 0.1  -- 10% volume
  );
  
  RETURN GREATEST(0, LEAST(5, final_score));
END;
$$;

-- Function to update judge tier based on performance
CREATE OR REPLACE FUNCTION public.update_judge_tier(target_judge_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_performance decimal(3,2);
  total_verdicts integer;
  current_tier_rec record;
  new_tier text;
  points_to_add integer;
BEGIN
  -- Get current performance and stats
  current_performance := public.calculate_judge_performance_score(target_judge_id);
  
  SELECT COUNT(*) INTO total_verdicts
  FROM public.verdict_responses 
  WHERE judge_id = target_judge_id;
  
  -- Get current tier info
  SELECT * INTO current_tier_rec
  FROM public.judge_tiers
  WHERE judge_id = target_judge_id;
  
  -- Create tier record if it doesn't exist
  IF current_tier_rec IS NULL THEN
    INSERT INTO public.judge_tiers (judge_id, current_tier, tier_points)
    VALUES (target_judge_id, 'bronze', 0);
    SELECT * INTO current_tier_rec
    FROM public.judge_tiers
    WHERE judge_id = target_judge_id;
  END IF;
  
  -- Calculate points to add based on performance
  points_to_add := ROUND(current_performance * 10);
  
  -- Determine new tier based on total points and verdicts
  new_tier := current_tier_rec.current_tier;
  
  IF current_tier_rec.tier_points + points_to_add >= 500 AND total_verdicts >= 100 THEN
    new_tier := 'diamond';
  ELSIF current_tier_rec.tier_points + points_to_add >= 300 AND total_verdicts >= 50 THEN
    new_tier := 'platinum';
  ELSIF current_tier_rec.tier_points + points_to_add >= 150 AND total_verdicts >= 25 THEN
    new_tier := 'gold';
  ELSIF current_tier_rec.tier_points + points_to_add >= 50 AND total_verdicts >= 10 THEN
    new_tier := 'silver';
  END IF;
  
  -- Update tier and points
  UPDATE public.judge_tiers 
  SET 
    current_tier = new_tier,
    tier_points = current_tier_rec.tier_points + points_to_add,
    updated_at = now(),
    previous_tier = CASE WHEN new_tier != current_tier_rec.current_tier 
                        THEN current_tier_rec.current_tier 
                        ELSE previous_tier END,
    tier_achieved_at = CASE WHEN new_tier != current_tier_rec.current_tier 
                           THEN now() 
                           ELSE tier_achieved_at END,
    priority_queue_access = (new_tier IN ('gold', 'platinum', 'diamond')),
    bonus_credits_per_verdict = CASE 
                                  WHEN new_tier = 'diamond' THEN 3
                                  WHEN new_tier = 'platinum' THEN 2  
                                  WHEN new_tier = 'gold' THEN 1
                                  ELSE 0 END,
    featured_judge = (new_tier IN ('platinum', 'diamond')),
    mentor_status = (new_tier = 'diamond')
  WHERE judge_id = target_judge_id;
  
  -- Update profile with new tier
  UPDATE public.profiles
  SET 
    judge_tier = new_tier,
    judge_rating = current_performance,
    judge_total_verdicts = total_verdicts,
    is_mentor = (new_tier = 'diamond'),
    is_featured_judge = (new_tier IN ('platinum', 'diamond'))
  WHERE id = target_judge_id;
  
  RETURN new_tier;
END;
$$;

-- Function to get judge leaderboard
CREATE OR REPLACE FUNCTION public.get_judge_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  judge_id uuid,
  judge_tier text,
  judge_rating decimal(3,2),
  total_verdicts integer,
  tier_points integer,
  is_featured boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.judge_tier,
    p.judge_rating,
    p.judge_total_verdicts,
    COALESCE(jt.tier_points, 0),
    p.is_featured_judge
  FROM public.profiles p
  LEFT JOIN public.judge_tiers jt ON p.id = jt.judge_id
  WHERE p.is_judge = true
    AND p.can_judge = true
    AND NOT p.is_suspended
  ORDER BY p.judge_rating DESC, p.judge_total_verdicts DESC
  LIMIT limit_count;
$$;

-- 9. Triggers to automatically update judge performance

-- Trigger to update judge metrics when verdict is submitted
CREATE OR REPLACE FUNCTION public.update_judge_performance_on_verdict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profile stats
  UPDATE public.profiles 
  SET 
    judge_total_verdicts = judge_total_verdicts + 1,
    judge_last_active = now()
  WHERE id = NEW.judge_id;
  
  -- Update tier asynchronously (in background)
  PERFORM public.update_judge_tier(NEW.judge_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_judge_performance_trigger
  AFTER INSERT ON public.verdict_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_judge_performance_on_verdict();

-- Trigger to update performance when quality rating is added
CREATE OR REPLACE FUNCTION public.update_judge_performance_on_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate and update tier
  PERFORM public.update_judge_tier(NEW.judge_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_judge_performance_rating_trigger
  AFTER INSERT OR UPDATE ON public.verdict_quality_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_judge_performance_on_rating();