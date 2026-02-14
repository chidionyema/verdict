/**
 * User Initialization Service
 *
 * SINGLE SOURCE OF TRUTH for new user setup.
 *
 * This module handles everything that needs to happen when a user
 * signs up or signs in for the first time:
 * 1. Create profile with initial credits
 * 2. Set up any other required user data
 *
 * This is called from ONE place: the auth callback.
 * All other code assumes the user is already initialized.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Configuration - single source of truth
export const USER_CONFIG = {
  INITIAL_CREDITS: 3,
  DEFAULT_IS_JUDGE: true,
} as const;

export interface InitializeUserResult {
  success: boolean;
  isNewUser: boolean;
  profile: UserProfile | null;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  is_judge: boolean;
  created_at: string;
}

/**
 * Initialize a user after authentication.
 *
 * This function:
 * 1. Checks if the user already has a profile
 * 2. If not, creates one with initial credits
 * 3. Returns the profile data
 *
 * MUST be called with a service client (bypasses RLS).
 * Will throw if profile creation fails - this is intentional.
 */
export async function initializeUser(
  supabase: SupabaseClient,
  user: User
): Promise<InitializeUserResult> {
  // Check if profile already exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, display_name, credits, is_judge, created_at')
    .eq('id', user.id)
    .single();

  // Profile exists - user is already initialized
  if (existingProfile && !fetchError) {
    return {
      success: true,
      isNewUser: false,
      profile: existingProfile as UserProfile,
    };
  }

  // Profile doesn't exist (PGRST116 = no rows) - create it
  if (fetchError && fetchError.code !== 'PGRST116') {
    // Unexpected error
    return {
      success: false,
      isNewUser: false,
      profile: null,
      error: `Failed to check profile: ${fetchError.message}`,
    };
  }

  // Create new profile with initial credits
  const displayName = extractDisplayName(user);

  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || null,
      display_name: displayName,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      credits: USER_CONFIG.INITIAL_CREDITS,
      is_judge: USER_CONFIG.DEFAULT_IS_JUDGE,
      is_admin: false,
      onboarding_completed: false,
    })
    .select('id, email, display_name, credits, is_judge, created_at')
    .single();

  if (createError || !newProfile) {
    return {
      success: false,
      isNewUser: true,
      profile: null,
      error: `Failed to create profile: ${createError?.message || 'Unknown error'}`,
    };
  }

  console.log(`[InitializeUser] Created profile for ${user.id} with ${USER_CONFIG.INITIAL_CREDITS} credits`);

  return {
    success: true,
    isNewUser: true,
    profile: newProfile as UserProfile,
  };
}

/**
 * Extract display name from user metadata
 */
function extractDisplayName(user: User): string {
  return (
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.display_name as string) ||
    user.email?.split('@')[0] ||
    'User'
  );
}
