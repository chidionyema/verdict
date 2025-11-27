// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { AGE_RANGES, GENDERS } from '@/lib/validations';

export async function PATCH(request: NextRequest) {
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
      updateData.is_judge = is_judge;
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
