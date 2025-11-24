-- Content Moderation System
-- Adds reporting, flagging, and moderation capabilities

-- 1. CONTENT REPORTS TABLE
-- Stores user reports of inappropriate content
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Who reported it
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- What was reported
  reported_content_type text NOT NULL CHECK (reported_content_type IN ('verdict_request', 'verdict_response')),
  reported_content_id uuid NOT NULL,
  
  -- Report details
  report_reason text NOT NULL CHECK (report_reason IN (
    'inappropriate_content', 
    'harassment', 
    'spam', 
    'illegal_content', 
    'personal_information', 
    'copyright_violation',
    'other'
  )),
  report_description text CHECK (char_length(report_description) <= 1000),
  
  -- Moderation status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_notes text,
  resolution text CHECK (resolution IN ('content_removed', 'user_warned', 'user_suspended', 'no_violation', 'other')),
  resolved_at timestamptz
);

-- 2. CONTENT FLAGS TABLE
-- Automatic or manual flags on content
CREATE TABLE public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- What content is flagged
  content_type text NOT NULL CHECK (content_type IN ('verdict_request', 'verdict_response')),
  content_id uuid NOT NULL,
  
  -- Flag details
  flag_type text NOT NULL CHECK (flag_type IN (
    'profanity_detected',
    'nudity_detected', 
    'violence_detected',
    'spam_detected',
    'manual_review_required',
    'user_reported',
    'ai_flagged'
  )),
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Review status
  reviewed boolean DEFAULT false,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_action text CHECK (review_action IN ('approved', 'rejected', 'needs_review')),
  review_notes text
);

-- 3. USER MODERATION ACTIONS TABLE
-- Track moderation actions taken against users
CREATE TABLE public.user_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Target user
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Moderator who took action
  moderator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Action details
  action_type text NOT NULL CHECK (action_type IN (
    'warning',
    'temporary_suspension', 
    'permanent_ban',
    'judge_suspension',
    'credit_adjustment',
    'content_removal'
  )),
  
  -- Duration for temporary actions
  duration_hours integer CHECK (duration_hours > 0),
  expires_at timestamptz,
  
  -- Reason and notes
  reason text NOT NULL,
  internal_notes text,
  
  -- Related content if applicable
  related_content_type text CHECK (related_content_type IN ('verdict_request', 'verdict_response')),
  related_content_id uuid,
  
  -- Status
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason text
);

-- 4. Add moderation fields to existing tables
ALTER TABLE public.verdict_requests 
ADD COLUMN moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'reviewing')),
ADD COLUMN moderation_notes text,
ADD COLUMN moderated_at timestamptz,
ADD COLUMN moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.verdict_responses 
ADD COLUMN moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'reviewing')),
ADD COLUMN moderation_notes text,
ADD COLUMN moderated_at timestamptz,
ADD COLUMN moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Add suspension fields to profiles
ALTER TABLE public.profiles
ADD COLUMN is_suspended boolean DEFAULT false,
ADD COLUMN suspension_reason text,
ADD COLUMN suspended_until timestamptz,
ADD COLUMN can_judge boolean DEFAULT true,
ADD COLUMN can_request boolean DEFAULT true;

-- 6. INDEXES for performance
CREATE INDEX content_reports_status_idx ON public.content_reports(status) WHERE status = 'pending';
CREATE INDEX content_reports_content_idx ON public.content_reports(reported_content_type, reported_content_id);
CREATE INDEX content_flags_content_idx ON public.content_flags(content_type, content_id);
CREATE INDEX content_flags_unreviewed_idx ON public.content_flags(reviewed) WHERE reviewed = false;
CREATE INDEX user_moderation_active_idx ON public.user_moderation_actions(user_id, is_active) WHERE is_active = true;
CREATE INDEX profiles_suspended_idx ON public.profiles(is_suspended) WHERE is_suspended = true;

-- 7. RLS Policies

-- Content reports - users can create and view their own reports, moderators can see all
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON public.content_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true)
    )
  );

-- Content flags - only moderators can view
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only moderators can access flags" ON public.content_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true)
    )
  );

-- User moderation actions - only moderators can access
ALTER TABLE public.user_moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only moderators can access moderation actions" ON public.user_moderation_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true)
    )
  );

-- 8. Functions for common moderation tasks

-- Function to check if user is currently suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN is_suspended = false THEN false
      WHEN suspended_until IS NULL THEN true  -- permanent suspension
      WHEN suspended_until > now() THEN true  -- temporary suspension still active
      ELSE false  -- temporary suspension expired
    END
  FROM public.profiles 
  WHERE id = user_id;
$$;

-- Function to auto-expire temporary suspensions
CREATE OR REPLACE FUNCTION public.check_suspension_expiry()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.profiles 
  SET 
    is_suspended = false,
    suspension_reason = NULL,
    suspended_until = NULL
  WHERE 
    is_suspended = true 
    AND suspended_until IS NOT NULL 
    AND suspended_until <= now();
$$;