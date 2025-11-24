-- Create judge_demographics table
-- Stores demographic information for judges to help match them with relevant requests

CREATE TABLE IF NOT EXISTS judge_demographics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  age_range TEXT NOT NULL CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  gender TEXT CHECK (gender IN ('male', 'female', 'nonbinary', 'prefer_not_say')),
  ethnicity TEXT,
  location TEXT,
  education_level TEXT,
  profession TEXT,
  relationship_status TEXT,
  income_range TEXT,
  lifestyle_tags JSONB DEFAULT '[]'::jsonb,
  interest_areas JSONB DEFAULT '[]'::jsonb,
  visibility_preferences JSONB DEFAULT '{"show_age": true, "show_gender": true, "show_ethnicity": false, "show_location": true, "show_education": false, "show_profession": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(judge_id)
);

-- Create judge_availability table
-- Tracks real-time availability of judges for matching

CREATE TABLE IF NOT EXISTS judge_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(judge_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_demographics_judge_id ON judge_demographics(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_availability_judge_id ON judge_availability(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_availability_is_available ON judge_availability(is_available);

-- Enable Row Level Security
ALTER TABLE judge_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for judge_demographics
-- Judges can read and update their own demographics
CREATE POLICY "Judges can view their own demographics"
  ON judge_demographics FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can insert their own demographics"
  ON judge_demographics FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own demographics"
  ON judge_demographics FOR UPDATE
  USING (auth.uid() = judge_id);

-- Admins can view all demographics (for matching/analytics)
CREATE POLICY "Admins can view all demographics"
  ON judge_demographics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for judge_availability
-- Judges can read and update their own availability
CREATE POLICY "Judges can view their own availability"
  ON judge_availability FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can insert their own availability"
  ON judge_availability FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own availability"
  ON judge_availability FOR UPDATE
  USING (auth.uid() = judge_id);

-- System can read all availability for matching
CREATE POLICY "Anyone can view available judges"
  ON judge_availability FOR SELECT
  USING (is_available = true);

-- Comments for documentation
COMMENT ON TABLE judge_demographics IS 'Stores demographic information for judges to help with request matching';
COMMENT ON TABLE judge_availability IS 'Tracks real-time availability of judges for request assignment';
COMMENT ON COLUMN judge_demographics.visibility_preferences IS 'JSON object controlling what demographic info is visible to seekers';
COMMENT ON COLUMN judge_demographics.lifestyle_tags IS 'Array of lifestyle tags like ["parent", "entrepreneur", "traveler"]';
COMMENT ON COLUMN judge_demographics.interest_areas IS 'Array of interest areas like ["career", "relationships", "health"]';
