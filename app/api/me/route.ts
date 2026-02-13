import { NextResponse } from 'next/server';
import { createClient, createServiceClient, hasServiceKey } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/profile';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

/**
 * GET /api/me - Get current user's profile
 *
 * Uses the profile service to ensure a profile exists.
 * This is the authoritative endpoint for user profile data.
 */
async function GET_Handler() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS if available
    const profileClient = hasServiceKey() ? createServiceClient() : supabase;

    // Ensure profile exists (creates if missing)
    const result = await ensureProfile(profileClient, user);

    if (!result.success) {
      log.error('Failed to ensure profile', {
        userId: user.id,
        error: result.error,
      });

      return NextResponse.json({
        error: result.error.message,
        code: result.error.code,
      }, { status: result.error.code === 'NOT_FOUND' ? 404 : 500 });
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
