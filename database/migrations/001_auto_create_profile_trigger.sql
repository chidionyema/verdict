-- ============================================================================
-- AUTO-CREATE PROFILE WITH 3 CREDITS ON USER SIGNUP
-- ============================================================================
--
-- This trigger ensures every user gets a profile with 3 credits immediately
-- when they sign up. No application code needed. No race conditions. No RLS issues.
--
-- This is the ONLY place profiles should be created. All application code
-- that creates profiles should be removed or converted to read-only.
-- ============================================================================

-- Function that creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with elevated privileges, bypasses RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    full_name,
    avatar_url,
    credits,  -- Always 3 for new users
    is_judge,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    3,  -- INITIAL CREDITS - single source of truth
    true,  -- Everyone can judge by default
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent - safe if profile already exists

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify with:
--
-- 1. Check trigger exists:
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- 2. Check function exists:
--    SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
--
-- 3. Test by creating a new user - profile should auto-create with 3 credits
-- ============================================================================
