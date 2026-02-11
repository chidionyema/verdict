import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function GET_Handler() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Select profile fields needed by account page and other components
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        display_name,
        avatar_url,
        credits,
        is_judge,
        is_expert,
        pricing_tier,
        country,
        age_range,
        gender,
        created_at,
        updated_at,
        onboarding_completed,
        notification_preferences
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    log.error('GET /api/me error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to user info endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
