-- Fix existing user onboarding status
-- Mark users as having completed onboarding if they have any activity

-- Update users who have submitted requests
UPDATE profiles 
SET 
  onboarding_completed = true,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  onboarding_completed = false 
  AND id IN (
    SELECT DISTINCT user_id 
    FROM verdict_requests 
    WHERE user_id IS NOT NULL
  );

-- Update users who have submitted verdicts
UPDATE profiles 
SET 
  onboarding_completed = true,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  onboarding_completed = false 
  AND id IN (
    SELECT DISTINCT judge_id 
    FROM verdict_responses 
    WHERE judge_id IS NOT NULL
  );

-- Update total_submissions count for accuracy
UPDATE profiles 
SET total_submissions = (
  SELECT COUNT(*) 
  FROM verdict_requests 
  WHERE verdict_requests.user_id = profiles.id
)
WHERE total_submissions != (
  SELECT COUNT(*) 
  FROM verdict_requests 
  WHERE verdict_requests.user_id = profiles.id
);

-- Update total_reviews count for accuracy  
UPDATE profiles 
SET total_reviews = (
  SELECT COUNT(*) 
  FROM verdict_responses 
  WHERE verdict_responses.judge_id = profiles.id
)
WHERE total_reviews != (
  SELECT COUNT(*) 
  FROM verdict_responses 
  WHERE verdict_responses.judge_id = profiles.id
);

-- Show results
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding,
  COUNT(CASE WHEN total_submissions > 0 THEN 1 END) as users_with_submissions,
  COUNT(CASE WHEN total_reviews > 0 THEN 1 END) as users_with_reviews
FROM profiles;