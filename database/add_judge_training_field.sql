-- Add judge training completion field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS judge_training_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_judge_training 
ON profiles (judge_training_completed);

-- Update existing users who have made judgments to skip training
UPDATE profiles 
SET judge_training_completed = TRUE 
WHERE id IN (
  SELECT DISTINCT reviewer_id 
  FROM feedback_responses 
  WHERE reviewer_id IS NOT NULL
);