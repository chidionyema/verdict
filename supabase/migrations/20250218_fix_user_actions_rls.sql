-- Fix critical RLS vulnerability in user_actions table
-- SECURITY FIX: Remove overly permissive policy that allowed ANY user to insert actions

-- Drop the dangerous policy
DROP POLICY IF EXISTS "Service can insert actions" ON public.user_actions;

-- Create proper policy that only allows authenticated users to insert their own actions
CREATE POLICY "Users can insert their own actions" ON public.user_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create separate policy for service role (for server-side tracking)
CREATE POLICY "Service role can insert actions" ON public.user_actions
  FOR INSERT TO service_role WITH CHECK (true);

-- Also ensure users can only insert actions for themselves
CREATE POLICY "Users can insert actions" ON public.user_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the security fix
COMMENT ON POLICY "Users can insert their own actions" ON public.user_actions 
  IS 'SECURITY: Only allows users to insert actions for their own user_id';

COMMENT ON POLICY "Service role can insert actions" ON public.user_actions 
  IS 'SECURITY: Only service role can insert actions on behalf of users (for server-side tracking)';