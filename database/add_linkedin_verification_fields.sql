-- Add LinkedIn verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS expertise_area TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT;

-- Create verifications table for audit trail
CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'linkedin', 'manual', 'document', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  platform_url TEXT,
  expertise_detected TEXT,
  verification_method VARCHAR(50), -- 'instant', 'manual', 'api', etc.
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_verified 
ON profiles (linkedin_verified);

CREATE INDEX IF NOT EXISTS idx_profiles_expertise_area 
ON profiles (expertise_area);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id 
ON verifications (user_id);

CREATE INDEX IF NOT EXISTS idx_verifications_type_status 
ON verifications (type, status);

-- Update existing users who might already have LinkedIn info
UPDATE profiles 
SET linkedin_verified = TRUE,
    verification_method = 'legacy'
WHERE linkedin_url IS NOT NULL 
  AND linkedin_verified IS FALSE;