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
    const { display_name, is_judge, country, age_range, gender } = body;

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

    if (is_judge !== undefined) {
      if (typeof is_judge !== 'boolean') {
        return NextResponse.json(
          { error: 'is_judge must be a boolean' },
          { status: 400 }
        );
      }

      // If trying to become a judge, verify they have completed qualification
      if (is_judge === true) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('is_judge, judge_qualification_date')
          .eq('id', user.id)
          .single();

        // SECURITY FIX: Only allow becoming a judge if:
        // 1. Already a judge (no-op), OR
        // 2. Has passed the quiz (indicated by providing judge_qualification_date in THIS request)
        //    This is only valid when called from the qualification page after passing the quiz
        // The qualification date must be a valid recent date (within last hour) to prevent replay attacks
        const requestQualificationDate = body.judge_qualification_date;
        const existingQualificationDate = (currentProfile as any)?.judge_qualification_date;

        if (!(currentProfile as any)?.is_judge) {
          if (!requestQualificationDate && !existingQualificationDate) {
            return NextResponse.json(
              { error: 'Must complete judge qualification first' },
              { status: 403 }
            );
          }

          // If providing a new qualification date, validate it's recent (within last hour)
          // This prevents users from replaying old qualification dates
          if (requestQualificationDate && !existingQualificationDate) {
            const qualDate = new Date(requestQualificationDate);
            const now = new Date();
            const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            if (isNaN(qualDate.getTime()) || qualDate < hourAgo || qualDate > now) {
              return NextResponse.json(
                { error: 'Invalid qualification date' },
                { status: 400 }
              );
            }
          }
        }
      }

      updateData.is_judge = is_judge;
    }

    // Handle judge_qualification_date (only set during qualification completion)
    // SECURITY: Only allow setting if user doesn't already have a qualification date
    if (body.judge_qualification_date !== undefined) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('judge_qualification_date')
        .eq('id', user.id)
        .single();

      // Only set if not already set (prevent tampering)
      if (!(currentProfile as any)?.judge_qualification_date) {
        updateData.judge_qualification_date = body.judge_qualification_date;
      }
    }

    // Handle judge_training_completed (set during qualification or training completion)
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
