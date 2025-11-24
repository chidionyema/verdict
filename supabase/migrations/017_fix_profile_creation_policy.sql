-- Fix the profile creation issue
-- This adds the missing INSERT policy for profiles table

-- Allow users to create their own profile (needed when trigger fails)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also ensure the service role can insert profiles (for the trigger)
-- Note: Service role bypasses RLS, but let's be explicit

-- Optional: Allow authenticated users to check if they have a profile
CREATE POLICY "Users can check profile existence"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND id = auth.uid());

-- Drop and recreate the update policy to ensure it works properly
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);