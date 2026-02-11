// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { AGE_RANGES, GENDERS } from '@/lib/validations';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function PATCH_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, country, age_range, gender } = body;

    // Validate fields
    const updateData: Record<string, unknown> = {};

    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 100) {
        return NextResponse.json(
          { error: 'Invalid display name' },
          { status: 400 }
        );
      }
      updateData.display_name = display_name;
    }

    // SECURITY FIX: is_judge and judge_qualification_date can NO LONGER be set via this endpoint.
    // Judge status must be granted via the secure /api/judge/qualify endpoint which:
    // 1. Verifies quiz answers server-side
    // 2. Sets both is_judge and judge_qualification_date atomically
    // 3. Uses a secure session token to prevent replay attacks
    //
    // Attempting to set these fields via profile update will be silently ignored.
    if (body.is_judge !== undefined || body.judge_qualification_date !== undefined) {
      log.warn('Attempted to set judge status via profile update', {
        userId: user.id,
        attemptedIsJudge: body.is_judge,
        attemptedQualDate: body.judge_qualification_date,
      });
      // Don't add to updateData - silently ignore the attempt
    }

    // Handle judge_training_completed - this is safe to set as it's just a progress marker
    if (body.judge_training_completed !== undefined) {
      if (typeof body.judge_training_completed !== 'boolean') {
        return NextResponse.json(
          { error: 'judge_training_completed must be a boolean' },
          { status: 400 }
        );
      }
      updateData.judge_training_completed = body.judge_training_completed;
    }

    if (country !== undefined) {
      if (typeof country !== 'string' || country.length > 100) {
        return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
      }
      updateData.country = country;
    }

    if (age_range !== undefined) {
      if (age_range !== null && !AGE_RANGES.includes(age_range)) {
        return NextResponse.json({ error: 'Invalid age range' }, { status: 400 });
      }
      updateData.age_range = age_range;
    }

    if (gender !== undefined) {
      if (gender !== null && !GENDERS.includes(gender)) {
        return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
      }
      updateData.gender = gender;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      log.error('Profile update failed', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    log.error('Profile PATCH endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to profile endpoint
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);
