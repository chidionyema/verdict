-- Add onboarding_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed boolean DEFAULT false NOT NULL;

-- Update existing users to have onboarding_completed = true 
-- (since they've already been using the app)
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE created_at < NOW() - INTERVAL '1 minute';