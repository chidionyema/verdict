-- Add verification system for judges
-- This enables LinkedIn and other social proof verification

-- Table for storing verification requests and status
CREATE TABLE IF NOT EXISTS public.judge_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL DEFAULT 'linkedin', -- 'linkedin', 'twitter', 'website', etc.
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  company_name TEXT,
  job_title TEXT,
  years_experience INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_category VARCHAR(50), -- 'hr', 'tech', 'design', 'marketing', 'finance', 'general'
  verified_level VARCHAR(20) DEFAULT 'linkedin', -- 'linkedin', 'expert', 'elite'
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add verification fields to judge_reputation table
ALTER TABLE public.judge_reputation 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verified_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS verified_level VARCHAR(20) DEFAULT 'linkedin',
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Table for admin notifications (for verification review requests)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_verifications_user_id ON public.judge_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_status ON public.judge_verifications(status);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_type ON public.judge_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_judge_reputation_verification ON public.judge_reputation(verification_status);

-- Function to update judge_reputation when verification is approved
CREATE OR REPLACE FUNCTION update_judge_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If verification is approved, update judge_reputation
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.judge_reputation 
    SET 
      verification_status = 'verified',
      verified_category = NEW.verified_category,
      verified_level = NEW.verified_level,
      verification_date = NEW.reviewed_at
    WHERE user_id = NEW.user_id;
    
    -- Also update the is_verified flag if it exists
    UPDATE public.judge_reputation 
    SET is_verified = TRUE
    WHERE user_id = NEW.user_id;
  
  -- If verification is rejected, ensure status is unverified
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.judge_reputation 
    SET 
      verification_status = 'unverified',
      verified_category = NULL,
      verified_level = 'linkedin',
      verification_date = NULL,
      is_verified = FALSE
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update judge reputation when verification status changes
CREATE TRIGGER trigger_update_judge_verification
  AFTER UPDATE ON public.judge_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_judge_verification_status();

-- RLS policies
ALTER TABLE public.judge_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own verification requests
CREATE POLICY "Users can manage their verifications" ON public.judge_verifications
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their verification status
CREATE POLICY "Users can view their verification status" ON public.judge_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all verifications (you'll need to implement admin role checking)
-- CREATE POLICY "Admins can manage verifications" ON public.judge_verifications
--   FOR ALL USING (is_admin(auth.uid()));

-- Public can view approved verification badges (through judge_reputation)
-- This is handled by existing judge_reputation policies

-- Admin notifications - only visible to admins
-- CREATE POLICY "Admins can view notifications" ON public.admin_notifications
--   FOR SELECT USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT ALL ON public.judge_verifications TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;

-- Insert some sample verification categories for reference
INSERT INTO public.judge_verifications (user_id, verification_type, status, verified_category, verified_level) VALUES
  ('00000000-0000-0000-0000-000000000000', 'linkedin', 'approved', 'hr', 'expert')
ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.judge_verifications IS 'Stores verification requests and status for judges, enabling LinkedIn and social proof verification';
COMMENT ON TABLE public.admin_notifications IS 'System notifications for admin review tasks like verification requests';
COMMENT ON COLUMN public.judge_reputation.verification_status IS 'Current verification status: unverified, pending, verified';
COMMENT ON COLUMN public.judge_reputation.verified_category IS 'Professional category: hr, tech, design, marketing, finance, general';
COMMENT ON COLUMN public.judge_reputation.verified_level IS 'Verification level: linkedin, expert, elite';