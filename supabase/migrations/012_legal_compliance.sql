-- Legal Compliance and Privacy Features
-- Adds GDPR/CCPA compliance tables and data management functionality

-- 1. User Consents Table
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User reference
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type text NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'cookies', 'marketing', 'data_processing')),
  given boolean NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  
  -- Tracking information
  ip_address text,
  user_agent text,
  
  -- Withdrawal
  withdrawn_at timestamptz,
  withdrawal_reason text
);

-- 2. Data Exports Table
CREATE TABLE public.data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User reference
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Export details
  export_type text NOT NULL CHECK (export_type IN ('complete', 'partial', 'specific_data')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Export metadata
  record_count integer,
  file_size_bytes bigint,
  download_url text,
  expires_at timestamptz,
  
  -- Error handling
  error_message text,
  
  -- Privacy
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz
);

-- 3. Data Deletion Requests Table
CREATE TABLE public.data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User reference
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Request details
  reason text NOT NULL CHECK (reason IN ('privacy_concerns', 'no_longer_needed', 'switching_services', 'other')),
  feedback text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'cancelled', 'rejected')),
  
  -- Timing
  requested_at timestamptz DEFAULT now() NOT NULL,
  scheduled_deletion_date timestamptz,
  processed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  
  -- Processing details
  processed_by uuid REFERENCES public.profiles(id),
  rejection_reason text,
  
  -- Verification
  verification_token text,
  verified_at timestamptz
);

-- 4. Legal Document Versions Table
CREATE TABLE public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Document details
  document_type text NOT NULL CHECK (document_type IN ('terms_of_service', 'privacy_policy', 'community_guidelines', 'cookie_policy')),
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  
  -- Status
  is_active boolean DEFAULT false,
  effective_date timestamptz NOT NULL,
  
  -- Author
  created_by uuid REFERENCES public.profiles(id),
  
  -- Change tracking
  changes_summary text,
  previous_version text,
  
  UNIQUE(document_type, version)
);

-- 5. Privacy Settings Table
CREATE TABLE public.user_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User reference
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Privacy preferences
  allow_analytics boolean DEFAULT true,
  allow_marketing_emails boolean DEFAULT true,
  allow_product_updates boolean DEFAULT true,
  allow_profile_discovery boolean DEFAULT true,
  
  -- Data sharing preferences
  allow_anonymous_feedback boolean DEFAULT true,
  allow_research_participation boolean DEFAULT false,
  
  -- Visibility settings
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'judges_only', 'private')),
  show_judge_status boolean DEFAULT true,
  show_activity_status boolean DEFAULT true,
  
  UNIQUE(user_id)
);

-- 6. Audit Logs Table (for compliance tracking)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- User and action
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Action details
  action_type text NOT NULL,
  resource_type text,
  resource_id uuid,
  
  -- Change tracking
  old_values jsonb,
  new_values jsonb,
  
  -- Context
  ip_address text,
  user_agent text,
  session_id text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- 7. INDEXES for performance

-- User consents
CREATE INDEX user_consents_user_id_idx ON public.user_consents(user_id, created_at DESC);
CREATE INDEX user_consents_type_idx ON public.user_consents(consent_type, given);

-- Data exports
CREATE INDEX data_exports_user_id_idx ON public.data_exports(user_id, created_at DESC);
CREATE INDEX data_exports_status_idx ON public.data_exports(status, created_at);

-- Deletion requests
CREATE INDEX deletion_requests_user_id_idx ON public.data_deletion_requests(user_id);
CREATE INDEX deletion_requests_status_idx ON public.data_deletion_requests(status, scheduled_deletion_date);

-- Legal documents
CREATE INDEX legal_documents_type_idx ON public.legal_document_versions(document_type, is_active);
CREATE INDEX legal_documents_effective_idx ON public.legal_document_versions(effective_date DESC);

-- Privacy settings
CREATE INDEX privacy_settings_user_idx ON public.user_privacy_settings(user_id);

-- Audit logs
CREATE INDEX audit_logs_user_idx ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON public.audit_logs(action_type, created_at DESC);
CREATE INDEX audit_logs_resource_idx ON public.audit_logs(resource_type, resource_id);

-- 8. RLS Policies

-- User consents - users can only see their own
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents" ON public.user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON public.user_consents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Data exports - users can only see their own
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports" ON public.data_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export requests" ON public.data_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all exports" ON public.data_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Deletion requests - users can only see their own
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests" ON public.data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON public.data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deletion requests" ON public.data_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deletion requests" ON public.data_deletion_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Legal documents - public read, admin write
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active documents" ON public.legal_document_versions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all documents" ON public.legal_document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Privacy settings - users can only manage their own
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own privacy settings" ON public.user_privacy_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all privacy settings" ON public.user_privacy_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Audit logs - admins only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- 9. Functions for compliance

-- Function to create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  target_user_id uuid,
  action_type_param text,
  resource_type_param text DEFAULT NULL,
  resource_id_param uuid DEFAULT NULL,
  old_values_param jsonb DEFAULT NULL,
  new_values_param jsonb DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    performed_by,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    target_user_id,
    auth.uid(),
    action_type_param,
    resource_type_param,
    resource_id_param,
    old_values_param,
    new_values_param,
    metadata_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to get user's current consent status
CREATE OR REPLACE FUNCTION public.get_user_consent_status(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  consent_status jsonb := '{}';
  consent_record record;
BEGIN
  -- Get latest consent for each type
  FOR consent_record IN
    SELECT DISTINCT ON (consent_type) 
      consent_type, given, version, created_at
    FROM public.user_consents
    WHERE user_id = target_user_id
      AND withdrawn_at IS NULL
    ORDER BY consent_type, created_at DESC
  LOOP
    consent_status := jsonb_set(
      consent_status,
      ARRAY[consent_record.consent_type],
      jsonb_build_object(
        'given', consent_record.given,
        'version', consent_record.version,
        'date', consent_record.created_at
      )
    );
  END LOOP;
  
  RETURN consent_status;
END;
$$;

-- 10. Triggers

-- Auto-update updated_at timestamps
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_exports_updated_at
  BEFORE UPDATE ON public.data_exports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deletion_requests_updated_at
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trail triggers
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      NEW.id,
      'profile_updated',
      'profile',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 11. Initialize default privacy settings for existing users
INSERT INTO public.user_privacy_settings (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_privacy_settings);

-- 12. Insert current legal document versions
INSERT INTO public.legal_document_versions (
  document_type, 
  version, 
  title, 
  content, 
  is_active, 
  effective_date,
  changes_summary
) VALUES
(
  'terms_of_service',
  '1.0',
  'Terms of Service',
  'Current Terms of Service content...',
  true,
  now(),
  'Initial version'
),
(
  'privacy_policy',
  '1.0', 
  'Privacy Policy',
  'Current Privacy Policy content...',
  true,
  now(),
  'Initial version'
),
(
  'community_guidelines',
  '1.0',
  'Community Guidelines', 
  'Current Community Guidelines content...',
  true,
  now(),
  'Initial version'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.legal_document_versions TO anon, authenticated;
GRANT ALL ON public.user_consents TO authenticated;
GRANT ALL ON public.data_exports TO authenticated;
GRANT ALL ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.user_privacy_settings TO authenticated;