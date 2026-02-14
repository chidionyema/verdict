import { NextResponse } from 'next/server';
import { createClient, hasServiceKey, createServiceClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/profile';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

/**
 * GET /api/me - Get current user's profile
 *
 * This endpoint ONLY reads profiles. Profile creation happens in auth callback.
 * If a profile doesn't exist, the user needs to sign out and sign in again.
 */
async function GET_Handler() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS if available
    const profileClient = hasServiceKey() ? createServiceClient() : supabase;
    const result = await getProfile(profileClient, user.id);

    if (!result.success) {
      log.error('Failed to get profile', { userId: user.id, error: result.error });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!result.data) {
      log.error('Profile not found for authenticated user', { userId: user.id });
      return NextResponse.json({
        error: 'Profile not found. Please refresh and try again.',
        code: 'PROFILE_NOT_FOUND',
      }, { status: 500 });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile: result.data,
    });

  } catch (error) {
    log.error('GET /api/me error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
