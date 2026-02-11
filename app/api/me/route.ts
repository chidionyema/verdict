import { NextResponse } from 'next/server';
import { createClient, createServiceClient, hasServiceKey } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function GET_Handler() {
  try {
    // First, verify authentication using the user's session
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('GET /api/me unauthorized', {
        authError: authError?.message,
        code: authError?.code
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS for profile fetch
    // This ensures we can always read the user's profile after auth verification
    let profileClient;
    if (hasServiceKey()) {
      profileClient = createServiceClient();
    } else {
      // Fallback to regular client if no service key (dev mode)
      profileClient = supabase;
    }

    // Select profile fields needed by account page and other components
    const { data: profile, error: profileError } = await profileClient
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
      log.error('Profile query failed', {
        userId: user.id,
        error: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      });

      // If profile doesn't exist, try to create it
      if (profileError.code === 'PGRST116') {
        log.info('Profile not found, creating new profile', { userId: user.id });

        const newProfile = {
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] ||
                        'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          credits: 3, // Initial free credits
          is_judge: true, // Everyone can review by default
          is_admin: false,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await (profileClient as any)
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          log.error('Profile creation failed', {
            userId: user.id,
            error: createError.message,
            code: createError.code
          });
          return NextResponse.json({
            error: 'Failed to create profile',
            code: createError.code
          }, { status: 500 });
        }

        return NextResponse.json({
          user: { id: user.id, email: user.email },
          profile: createdProfile,
          created: true
        });
      }

      return NextResponse.json({
        error: 'Profile not found',
        code: profileError.code
      }, { status: 404 });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
    });
  } catch (error) {
    log.error('GET /api/me error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to user info endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
