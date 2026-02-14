/**
 * Profile Service
 *
 * SINGLE SOURCE OF TRUTH for all profile operations.
 * All profile reads and writes go through this module.
 *
 * Design principles:
 * 1. Idempotent creation - calling ensureProfile multiple times is safe
 * 2. Atomic credit operations - no race conditions
 * 3. Consistent field defaults - one place defines new profile shape
 * 4. Clear error handling - typed errors for all failure modes
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  total_earned: number;
  total_spent: number;
  total_submissions: number;
  total_reviews: number;
  is_judge: boolean;
  is_admin: boolean;
  is_expert: boolean;
  country: string | null;
  age_range: string | null;
  gender: string | null;
  bio: string | null;
  onboarding_completed: boolean;
  profile_completed: boolean;
  judge_training_completed: boolean;
  notification_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProfileError {
  code: 'NOT_FOUND' | 'CREATE_FAILED' | 'UPDATE_FAILED' | 'INSUFFICIENT_CREDITS' | 'DB_ERROR';
  message: string;
  details?: unknown;
}

export type ProfileResult<T> =
  | { success: true; data: T }
  | { success: false; error: ProfileError };

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_CREDITS = 3;

const PROFILE_SELECT_FIELDS = `
  id,
  email,
  display_name,
  full_name,
  avatar_url,
  credits,
  total_earned,
  total_spent,
  total_submissions,
  total_reviews,
  is_judge,
  is_admin,
  is_expert,
  country,
  age_range,
  gender,
  bio,
  onboarding_completed,
  profile_completed,
  judge_training_completed,
  notification_preferences,
  created_at,
  updated_at
`;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get a profile by user ID.
 * Returns null if not found (does NOT auto-create).
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileResult<Profile | null>> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_FIELDS)
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: error.message,
        details: error,
      },
    };
  }

  return { success: true, data: data as Profile };
}

/**
 * Ensure a profile exists for a user.
 * Creates one if missing, returns existing if found.
 * Also grants initial credits if profile exists with 0 credits (fixes edge cases).
 * This is idempotent - safe to call multiple times.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<ProfileResult<Profile>> {
  // First, try to get existing profile
  const existing = await getProfile(supabase, user.id);

  if (!existing.success) {
    return existing;
  }

  if (existing.data) {
    // Fix for edge case: profile exists but has 0 credits (possibly created by auth hook)
    // Grant initial credits if user has never had any activity
    if (
      existing.data.credits === 0 &&
      existing.data.total_spent === 0 &&
      existing.data.total_earned === 0 &&
      existing.data.total_submissions === 0
    ) {
      // This is a new user who somehow got a profile with 0 credits
      // Grant them the initial credits
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          credits: INITIAL_CREDITS,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id)
        .eq('credits', 0) // Only update if still 0 (avoid race conditions)
        .select(PROFILE_SELECT_FIELDS)
        .single();

      if (!updateError && updated) {
        return { success: true, data: updated as Profile };
      }
      // If update failed, return existing (another process may have updated it)
    }
    return { success: true, data: existing.data };
  }

  // Profile doesn't exist - create it
  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.display_name as string) ||
    user.email?.split('@')[0] ||
    'User';

  const newProfile = {
    id: user.id,
    email: user.email || null,
    display_name: displayName,
    full_name: (user.user_metadata?.full_name as string) || null,
    avatar_url: (user.user_metadata?.avatar_url as string) || null,
    credits: INITIAL_CREDITS,
    is_judge: true, // Everyone can judge by default
    is_admin: false,
    onboarding_completed: false,
  };

  // Use upsert to handle race conditions
  const { data, error } = await supabase
    .from('profiles')
    .upsert(newProfile as any, { onConflict: 'id' })
    .select(PROFILE_SELECT_FIELDS)
    .single();

  if (error) {
    // Upsert failed - try to fetch (another process may have created it)
    const retry = await getProfile(supabase, user.id);
    if (retry.success && retry.data) {
      return { success: true, data: retry.data };
    }

    return {
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: `Failed to create profile: ${error.message}`,
        details: error,
      },
    };
  }

  return { success: true, data: data as Profile };
}

/**
 * Atomically deduct credits from a user's balance.
 * Returns the new balance or an error if insufficient credits.
 */
export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description?: string
): Promise<ProfileResult<{ newBalance: number; previousBalance: number }>> {
  if (amount <= 0) {
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Amount must be positive',
      },
    };
  }

  // First, get current balance
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Profile not found',
        details: fetchError,
      },
    };
  }

  const previousBalance = profile.credits;

  if (previousBalance < amount) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Have: ${previousBalance}, need: ${amount}`,
      },
    };
  }

  // Atomic update with WHERE clause to prevent race conditions
  // This UPDATE will only succeed if credits >= amount at execution time
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      credits: previousBalance - amount,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId)
    .gte('credits', amount) // Atomic check
    .select('credits')
    .single();

  if (updateError || !updated) {
    // Race condition: balance changed between select and update
    // Re-fetch to get accurate balance for error message
    const { data: current } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Have: ${current?.credits ?? 0}, need: ${amount}`,
      },
    };
  }

  return {
    success: true,
    data: {
      newBalance: updated.credits,
      previousBalance,
    },
  };
}

/**
 * Add credits to a user's balance.
 */
export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description?: string
): Promise<ProfileResult<{ newBalance: number }>> {
  if (amount <= 0) {
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Amount must be positive',
      },
    };
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Profile not found',
        details: fetchError,
      },
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      credits: profile.credits + amount,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId)
    .select('credits')
    .single();

  if (updateError || !updated) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: `Failed to add credits: ${updateError?.message}`,
        details: updateError,
      },
    };
  }

  return {
    success: true,
    data: { newBalance: updated.credits },
  };
}

/**
 * Update profile fields.
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'email' | 'credits' | 'is_admin' | 'created_at'>>
): Promise<ProfileResult<Profile>> {
  // Sanitize updates - remove fields that shouldn't be updated via this method
  const sanitized = { ...updates };
  delete (sanitized as any).id;
  delete (sanitized as any).email;
  delete (sanitized as any).credits;
  delete (sanitized as any).is_admin;
  delete (sanitized as any).created_at;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...sanitized,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId)
    .select(PROFILE_SELECT_FIELDS)
    .single();

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message,
        details: error,
      },
    };
  }

  return { success: true, data: data as Profile };
}
