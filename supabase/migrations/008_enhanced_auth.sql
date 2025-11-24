-- Enhanced Authentication System
-- Adds email verification, password reset, and profile management

-- 1. Add email verification tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN email_verified boolean DEFAULT false,
ADD COLUMN email_verification_token text,
ADD COLUMN email_verification_sent_at timestamptz,
ADD COLUMN password_reset_token text,
ADD COLUMN password_reset_sent_at timestamptz,
ADD COLUMN password_reset_expires_at timestamptz,
ADD COLUMN last_login_at timestamptz,
ADD COLUMN login_count integer DEFAULT 0,
ADD COLUMN profile_completed boolean DEFAULT false,
ADD COLUMN profile_completion_step integer DEFAULT 0;

-- 2. Create email verification tracking table
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  verification_token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  verified boolean DEFAULT false,
  verified_at timestamptz,
  attempts integer DEFAULT 0,
  
  UNIQUE(verification_token)
);

-- 3. Create password reset tracking table  
CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  reset_token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used boolean DEFAULT false,
  used_at timestamptz,
  ip_address inet,
  user_agent text,
  
  UNIQUE(reset_token)
);

-- 4. Create user sessions tracking table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  ended_at timestamptz,
  
  UNIQUE(session_token)
);

-- 5. Profile completion steps tracking
CREATE TABLE public.profile_completion_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_name text NOT NULL CHECK (step_name IN (
    'email_verification',
    'basic_profile',
    'preferences',
    'first_request',
    'judge_qualification'
  )),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  
  UNIQUE(user_id, step_name)
);

-- 6. INDEXES for performance
CREATE INDEX email_verifications_user_id_idx ON public.email_verifications(user_id);
CREATE INDEX email_verifications_token_idx ON public.email_verifications(verification_token);
CREATE INDEX email_verifications_expires_idx ON public.email_verifications(expires_at);
CREATE INDEX password_resets_user_id_idx ON public.password_resets(user_id);
CREATE INDEX password_resets_token_idx ON public.password_resets(reset_token);
CREATE INDEX password_resets_expires_idx ON public.password_resets(expires_at);
CREATE INDEX user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX user_sessions_active_idx ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX profiles_email_verified_idx ON public.profiles(email_verified);
CREATE INDEX profile_completion_user_step_idx ON public.profile_completion_steps(user_id, step_name);

-- 7. RLS Policies

-- Email verifications - users can only see their own
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email verifications" ON public.email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Password resets - users can only see their own
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own password resets" ON public.password_resets
  FOR SELECT USING (auth.uid() = user_id);

-- User sessions - users can only see their own
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Profile completion steps - users can view/update their own
ALTER TABLE public.profile_completion_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completion steps" ON public.profile_completion_steps
  FOR ALL USING (auth.uid() = user_id);

-- 8. Functions for email verification

-- Function to create email verification
CREATE OR REPLACE FUNCTION public.create_email_verification(
  target_user_id uuid,
  target_email text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_token text;
  existing_verification record;
BEGIN
  -- Generate unique verification token
  verification_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Check if there's a recent verification for this user
  SELECT * INTO existing_verification
  FROM public.email_verifications
  WHERE user_id = target_user_id
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If recent verification exists, update it
  IF existing_verification.id IS NOT NULL THEN
    UPDATE public.email_verifications
    SET 
      verification_token = verification_token,
      expires_at = now() + interval '24 hours',
      attempts = 0,
      updated_at = now()
    WHERE id = existing_verification.id;
  ELSE
    -- Create new verification
    INSERT INTO public.email_verifications (
      user_id,
      email,
      verification_token,
      expires_at
    ) VALUES (
      target_user_id,
      target_email,
      verification_token,
      now() + interval '24 hours'
    );
  END IF;
  
  -- Update profile with verification info
  UPDATE public.profiles
  SET 
    email_verification_token = verification_token,
    email_verification_sent_at = now()
  WHERE id = target_user_id;
  
  RETURN verification_token;
END;
$$;

-- Function to verify email
CREATE OR REPLACE FUNCTION public.verify_email(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record record;
BEGIN
  -- Find verification record
  SELECT * INTO verification_record
  FROM public.email_verifications
  WHERE verification_token = token
    AND verified = false
    AND expires_at > now();
  
  IF verification_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Mark as verified
  UPDATE public.email_verifications
  SET 
    verified = true,
    verified_at = now(),
    updated_at = now()
  WHERE id = verification_record.id;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    email_verified = true,
    email_verification_token = NULL
  WHERE id = verification_record.user_id;
  
  -- Mark completion step
  INSERT INTO public.profile_completion_steps (user_id, step_name, completed, completed_at)
  VALUES (verification_record.user_id, 'email_verification', true, now())
  ON CONFLICT (user_id, step_name) 
  DO UPDATE SET completed = true, completed_at = now();
  
  RETURN true;
END;
$$;

-- Function to create password reset
CREATE OR REPLACE FUNCTION public.create_password_reset(
  target_email text,
  user_ip inet DEFAULT NULL,
  user_user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  reset_token text;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    -- Don't reveal whether email exists
    RETURN 'token_sent';
  END IF;
  
  -- Generate reset token
  reset_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Create reset record
  INSERT INTO public.password_resets (
    user_id,
    email,
    reset_token,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id,
    target_email,
    reset_token,
    now() + interval '1 hour',
    user_ip,
    user_user_agent
  );
  
  -- Update profile
  UPDATE public.profiles
  SET 
    password_reset_token = reset_token,
    password_reset_sent_at = now(),
    password_reset_expires_at = now() + interval '1 hour'
  WHERE id = target_user_id;
  
  RETURN reset_token;
END;
$$;

-- Function to check profile completion
CREATE OR REPLACE FUNCTION public.get_profile_completion_status(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  completion_status jsonb;
  completed_steps text[];
  total_steps integer := 5;
  completed_count integer;
BEGIN
  -- Get completed steps
  SELECT array_agg(step_name) INTO completed_steps
  FROM public.profile_completion_steps
  WHERE user_id = target_user_id AND completed = true;
  
  completed_steps := COALESCE(completed_steps, ARRAY[]::text[]);
  completed_count := array_length(completed_steps, 1);
  completed_count := COALESCE(completed_count, 0);
  
  -- Build status object
  completion_status := jsonb_build_object(
    'completed_steps', to_jsonb(completed_steps),
    'completion_percentage', round((completed_count::decimal / total_steps) * 100, 0),
    'is_completed', completed_count = total_steps,
    'next_step', CASE 
      WHEN NOT ('email_verification' = ANY(completed_steps)) THEN 'email_verification'
      WHEN NOT ('basic_profile' = ANY(completed_steps)) THEN 'basic_profile'
      WHEN NOT ('preferences' = ANY(completed_steps)) THEN 'preferences'
      WHEN NOT ('first_request' = ANY(completed_steps)) THEN 'first_request'
      WHEN NOT ('judge_qualification' = ANY(completed_steps)) THEN 'judge_qualification'
      ELSE 'completed'
    END
  );
  
  RETURN completion_status;
END;
$$;

-- Function to track user login
CREATE OR REPLACE FUNCTION public.track_user_login(
  target_user_id uuid,
  session_token text DEFAULT NULL,
  user_ip inet DEFAULT NULL,
  user_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profile login stats
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    login_count = login_count + 1
  WHERE id = target_user_id;
  
  -- Create session record if token provided
  IF session_token IS NOT NULL THEN
    INSERT INTO public.user_sessions (
      user_id,
      session_token,
      ip_address,
      user_agent,
      expires_at
    ) VALUES (
      target_user_id,
      session_token,
      user_ip,
      user_user_agent,
      now() + interval '7 days'
    )
    ON CONFLICT (session_token) 
    DO UPDATE SET 
      updated_at = now(),
      expires_at = now() + interval '7 days';
  END IF;
END;
$$;

-- 9. Triggers for automatic profile completion tracking

-- Trigger to mark basic profile completion
CREATE OR REPLACE FUNCTION public.check_basic_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if basic profile is now complete
  IF NEW.full_name IS NOT NULL AND NEW.avatar_url IS NOT NULL AND NEW.bio IS NOT NULL THEN
    INSERT INTO public.profile_completion_steps (user_id, step_name, completed, completed_at)
    VALUES (NEW.id, 'basic_profile', true, now())
    ON CONFLICT (user_id, step_name) 
    DO UPDATE SET completed = true, completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER basic_profile_completion_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_basic_profile_completion();

-- Trigger to mark first request completion
CREATE OR REPLACE FUNCTION public.mark_first_request_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profile_completion_steps (user_id, step_name, completed, completed_at)
  VALUES (NEW.user_id, 'first_request', true, now())
  ON CONFLICT (user_id, step_name) 
  DO UPDATE SET completed = true, completed_at = now();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER first_request_completion_trigger
  AFTER INSERT ON public.verdict_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_first_request_completion();

-- 10. Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Clean up expired email verifications
  DELETE FROM public.email_verifications
  WHERE expires_at < now() AND verified = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up expired password resets
  DELETE FROM public.password_resets
  WHERE expires_at < now() AND used = false;
  
  -- Clean up expired sessions
  UPDATE public.user_sessions
  SET is_active = false, ended_at = now()
  WHERE expires_at < now() AND is_active = true;
  
  -- Clean up profile tokens
  UPDATE public.profiles
  SET 
    email_verification_token = NULL,
    password_reset_token = NULL
  WHERE 
    (email_verification_sent_at < now() - interval '24 hours') OR
    (password_reset_expires_at < now());
  
  RETURN deleted_count;
END;
$$;