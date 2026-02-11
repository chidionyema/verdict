-- ============================================================================
-- MIGRATION 004: Fix RLS Policies for Feed Access and Profile Loading
-- ============================================================================
--
-- PROBLEM:
-- The existing "Judges can view open requests" policy requires users to have
-- is_judge = true in their profile before they can see requests in the feed.
-- This creates a chicken-and-egg problem: users can't become judges without
-- seeing requests, but they can't see requests without being judges.
--
-- SOLUTION:
-- Replace the restrictive policy with one that allows any authenticated user
-- to view public open requests. Users can still always see their own requests.
--
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING RESTRICTIVE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Judges can view open requests" ON verdict_requests;

-- ============================================================================
-- 2. CREATE NEW INCLUSIVE POLICY
-- ============================================================================

-- Allow any authenticated user to view:
-- 1. Public requests that are open or in_progress (for the feed)
-- 2. Their own requests (regardless of visibility or status)

CREATE POLICY "Users can view public open requests"
ON verdict_requests
FOR SELECT
TO authenticated
USING (
  -- Public requests available for judging
  (
    visibility = 'public'
    AND status IN ('open', 'in_progress')
    AND deleted_at IS NULL
  )
  -- OR user's own requests (handled by existing policy, but included for completeness)
  OR (auth.uid() = user_id)
);

-- ============================================================================
-- 3. VERIFY EXISTING POLICIES ARE CORRECT
-- ============================================================================

-- Ensure users can view their own requests (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verdict_requests'
    AND policyname = 'Users can view own requests'
  ) THEN
    CREATE POLICY "Users can view own requests"
    ON verdict_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure users can create requests (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verdict_requests'
    AND policyname = 'Users can create requests'
  ) THEN
    CREATE POLICY "Users can create requests"
    ON verdict_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 4. ADD UPDATE POLICY FOR REQUEST OWNERS
-- ============================================================================

-- Allow users to update their own requests (e.g., cancel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verdict_requests'
    AND policyname = 'Users can update own requests'
  ) THEN
    CREATE POLICY "Users can update own requests"
    ON verdict_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 5. ADD POLICY FOR JUDGES TO UPDATE VERDICT COUNTS
-- ============================================================================

-- Service role handles verdict count updates, but adding policy for safety
-- This allows the system to increment received_verdict_count

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verdict_requests'
    AND policyname = 'System can update verdict counts'
  ) THEN
    CREATE POLICY "System can update verdict counts"
    ON verdict_requests
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 6. FIX PROFILES RLS POLICIES
-- ============================================================================
-- The profiles table needs proper RLS for users to read their own profile

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Allow users to insert their own profile (for new signups)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to confirm)
-- ============================================================================
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'verdict_requests';
--
-- Expected policies:
-- 1. "Users can view own requests" - SELECT - auth.uid() = user_id
-- 2. "Users can create requests" - INSERT - auth.uid() = user_id
-- 3. "Users can view public open requests" - SELECT - public + open/in_progress OR own
-- 4. "Users can update own requests" - UPDATE - auth.uid() = user_id
-- 5. "System can update verdict counts" - UPDATE (service_role)
-- ============================================================================
