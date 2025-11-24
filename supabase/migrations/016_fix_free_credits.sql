-- Fix the free credits issue for new users
-- This migration addresses the bug where new users don't get their promised 3 free credits

-- 1. Update the handle_new_user function to explicitly set 3 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, credits)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    3  -- Explicitly set 3 free credits as promised
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- 2. Fix existing users who have 0 credits (they should have gotten 3 free credits)
-- Only update users who have 0 credits and haven't made any transactions
UPDATE public.profiles 
SET credits = 3
WHERE credits = 0 
AND id NOT IN (
  -- Don't give free credits to users who have already made transactions
  SELECT DISTINCT user_id 
  FROM public.transactions 
  WHERE status = 'completed'
);

-- 3. Add a comment to document this fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a new user profile with 3 free credits as promised on signup';