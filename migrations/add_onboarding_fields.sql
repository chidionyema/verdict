-- Add comprehensive onboarding tracking fields to profiles table
-- This migration adds fields to track each step of the mandatory onboarding process

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guidelines_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guidelines_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_submission_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_judgment_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_training_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_training_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS preferred_path VARCHAR(20) CHECK (preferred_path IN ('community', 'private'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_guidelines_accepted ON profiles(guidelines_accepted);

-- Update existing users to have email verified if they're already in the system
-- (assuming they must have verified email to get this far)
UPDATE profiles 
SET email_verified = TRUE 
WHERE email_verified IS NULL OR email_verified = FALSE;

-- Set onboarding completed for existing users who have the old onboarding_completed flag
UPDATE profiles 
SET 
  profile_completed = CASE 
    WHEN display_name IS NOT NULL AND display_name != '' 
         AND country IS NOT NULL AND country != '' 
         AND age_range IS NOT NULL AND age_range != '' 
    THEN TRUE 
    ELSE FALSE 
  END,
  tutorial_completed = onboarding_completed,
  has_completed_tutorial = onboarding_completed
WHERE onboarding_completed = TRUE;

-- Create function to check if all required onboarding steps are completed
CREATE OR REPLACE FUNCTION check_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update onboarding_completed if all required steps are done
  IF NEW.email_verified = TRUE 
     AND NEW.profile_completed = TRUE 
     AND NEW.guidelines_accepted = TRUE 
     AND NEW.safety_training_completed = TRUE 
     AND NEW.tutorial_completed = TRUE
     AND (NEW.onboarding_completed = FALSE OR NEW.onboarding_completed IS NULL)
  THEN
    NEW.onboarding_completed = TRUE;
    NEW.onboarding_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically complete onboarding when all steps are done
DROP TRIGGER IF EXISTS trigger_check_onboarding_completion ON profiles;
CREATE TRIGGER trigger_check_onboarding_completion
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_onboarding_completion();

-- Add helpful view for onboarding analytics
CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_verified = TRUE) as email_verified_count,
  COUNT(*) FILTER (WHERE profile_completed = TRUE) as profile_completed_count,
  COUNT(*) FILTER (WHERE guidelines_accepted = TRUE) as guidelines_accepted_count,
  COUNT(*) FILTER (WHERE safety_training_completed = TRUE) as safety_training_completed_count,
  COUNT(*) FILTER (WHERE tutorial_completed = TRUE) as tutorial_completed_count,
  COUNT(*) FILTER (WHERE onboarding_completed = TRUE) as onboarding_completed_count,
  ROUND(
    COUNT(*) FILTER (WHERE email_verified = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as email_verified_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE profile_completed = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as profile_completed_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE guidelines_accepted = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as guidelines_accepted_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE safety_training_completed = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as safety_training_completed_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE tutorial_completed = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as tutorial_completed_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE onboarding_completed = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as onboarding_completion_rate
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'; -- Last 30 days

COMMENT ON VIEW onboarding_analytics IS 'Analytics view for tracking onboarding completion rates';
COMMENT ON COLUMN profiles.profile_completed IS 'Whether user has completed basic profile setup';
COMMENT ON COLUMN profiles.tutorial_completed IS 'Whether user has completed the platform tutorial';
COMMENT ON COLUMN profiles.guidelines_accepted IS 'Whether user has read and accepted community guidelines';
COMMENT ON COLUMN profiles.safety_training_completed IS 'Whether user has completed safety training';
COMMENT ON COLUMN profiles.first_submission_completed IS 'Whether user has created their first submission';
COMMENT ON COLUMN profiles.first_judgment_completed IS 'Whether user has completed their first judgment';
COMMENT ON COLUMN profiles.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN profiles.preferred_path IS 'User''s preferred path: community or private';