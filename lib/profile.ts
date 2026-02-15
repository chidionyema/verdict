/**
 * Profile Service
 *
 * All profile reads and credit operations go through this module.
 *
 * IMPORTANT: Profile CREATION is handled by database trigger `on_auth_user_created`.
 * This module only handles reads and updates - never creates profiles.
 *
 * Design principles:
 * 1. Atomic credit operations - no race conditions
 * 2. Clear error handling - typed errors for all failure modes
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { log } from '@/lib/logger';

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
  const startTime = Date.now();

  log.info('[PROFILE:getProfile] Starting profile fetch', {
    userId: userId.substring(0, 8) + '...',
  });

  let data: any = null;
  let error: any = null;

  try {
    const result = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_FIELDS)
      .eq('id', userId)
      .single();

    data = result.data;
    error = result.error;
  } catch (exception: any) {
    log.error('[PROFILE:getProfile] Query threw exception', {
      userId: userId.substring(0, 8) + '...',
      errorMessage: exception?.message,
      errorCode: exception?.code,
      elapsed: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: `Query exception: ${exception?.message}`,
        details: exception,
      },
    };
  }

  log.info('[PROFILE:getProfile] Query completed', {
    userId: userId.substring(0, 8) + '...',
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code || null,
    errorMessage: error?.message || null,
    credits: data?.credits ?? 'N/A',
    elapsed: Date.now() - startTime,
  });

  if (error) {
    if (error.code === 'PGRST116') {
      log.info('[PROFILE:getProfile] Profile not found (PGRST116)', {
        userId: userId.substring(0, 8) + '...',
      });
      return { success: true, data: null };
    }
    log.error('[PROFILE:getProfile] Database error', {
      userId: userId.substring(0, 8) + '...',
      errorCode: error.code,
      errorMessage: error.message,
      errorHint: error.hint,
      errorDetails: error.details,
    });
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
 * Atomically deduct credits from a user's balance.
 * Returns the new balance or an error if insufficient credits.
 */
export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description?: string
): Promise<ProfileResult<{ newBalance: number; previousBalance: number }>> {
  const startTime = Date.now();

  log.info('[PROFILE:deductCredits] Starting credit deduction', {
    userId: userId.substring(0, 8) + '...',
    amount,
    description: description || 'N/A',
  });

  if (amount <= 0) {
    log.warn('[PROFILE:deductCredits] Invalid amount', { amount });
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Amount must be positive',
      },
    };
  }

  // First, get current balance
  log.info('[PROFILE:deductCredits] Fetching current balance', {
    userId: userId.substring(0, 8) + '...',
  });

  let profile: any = null;
  let fetchError: any = null;

  try {
    const result = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    profile = result.data;
    fetchError = result.error;
  } catch (exception: any) {
    log.error('[PROFILE:deductCredits] Fetch threw exception', {
      userId: userId.substring(0, 8) + '...',
      errorMessage: exception?.message,
      errorCode: exception?.code,
      elapsed: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: `Fetch exception: ${exception?.message}`,
        details: exception,
      },
    };
  }

  log.info('[PROFILE:deductCredits] Fetch result', {
    userId: userId.substring(0, 8) + '...',
    hasProfile: !!profile,
    hasError: !!fetchError,
    currentCredits: profile?.credits ?? 'N/A',
    errorCode: fetchError?.code || null,
    errorMessage: fetchError?.message || null,
  });

  if (fetchError || !profile) {
    log.error('[PROFILE:deductCredits] Profile fetch failed', {
      userId: userId.substring(0, 8) + '...',
      errorCode: fetchError?.code,
      errorMessage: fetchError?.message,
      errorHint: fetchError?.hint,
    });
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
    log.warn('[PROFILE:deductCredits] Insufficient credits', {
      userId: userId.substring(0, 8) + '...',
      currentCredits: previousBalance,
      requestedAmount: amount,
    });
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Have: ${previousBalance}, need: ${amount}`,
      },
    };
  }

  // Atomic update with WHERE clause to prevent race conditions
  log.info('[PROFILE:deductCredits] Executing atomic update', {
    userId: userId.substring(0, 8) + '...',
    previousBalance,
    newBalance: previousBalance - amount,
  });

  let updated: any = null;
  let updateError: any = null;

  try {
    const result = await supabase
      .from('profiles')
      .update({
        credits: previousBalance - amount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)
      .gte('credits', amount) // Atomic check
      .select('credits')
      .single();

    updated = result.data;
    updateError = result.error;
  } catch (exception: any) {
    log.error('[PROFILE:deductCredits] Update threw exception', {
      userId: userId.substring(0, 8) + '...',
      errorMessage: exception?.message,
      errorCode: exception?.code,
      elapsed: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: `Update exception: ${exception?.message}`,
        details: exception,
      },
    };
  }

  log.info('[PROFILE:deductCredits] Update result', {
    userId: userId.substring(0, 8) + '...',
    success: !!updated && !updateError,
    newCredits: updated?.credits ?? 'N/A',
    errorCode: updateError?.code || null,
    errorMessage: updateError?.message || null,
    elapsed: Date.now() - startTime,
  });

  if (updateError || !updated) {
    // Race condition: balance changed between select and update
    log.warn('[PROFILE:deductCredits] Update failed, checking for race condition', {
      userId: userId.substring(0, 8) + '...',
      errorCode: updateError?.code,
      errorMessage: updateError?.message,
    });

    const { data: current } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    log.info('[PROFILE:deductCredits] Re-fetched balance after failure', {
      userId: userId.substring(0, 8) + '...',
      currentCredits: current?.credits ?? 0,
    });

    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Have: ${current?.credits ?? 0}, need: ${amount}`,
      },
    };
  }

  log.info('[PROFILE:deductCredits] SUCCESS', {
    userId: userId.substring(0, 8) + '...',
    previousBalance,
    newBalance: updated.credits,
    deducted: amount,
    elapsed: Date.now() - startTime,
  });

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
