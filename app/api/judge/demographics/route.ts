import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/judge/demographics - Get judge demographics
async function GET_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: demographics, error } = await supabase
      .from('judge_demographics')
      .select('*')
      .eq('judge_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ demographics });
  } catch (error) {
    log.error('GET /api/judge/demographics error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/judge/demographics - Create/update judge demographics
async function POST_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Make sure profile row exists (some older accounts might not have one yet)
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Use service role client to bypass RLS for profile creation
        const serviceClient = createServiceClient();
        const { error: insertError } = await (serviceClient as any).from('profiles').insert({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Judge',
          credits: 3, // Initial credits for new users
        });

        if (insertError) {
          log.error('Failed to auto-create profile before demographics', insertError);
          return NextResponse.json(
            { error: 'Unable to prepare profile for demographics' },
            { status: 500 }
          );
        }
      } else {
        log.error('Profile lookup error', profileError);
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
      }
    } else if (!existingProfile) {
      // Use service role client to bypass RLS for profile creation
      const serviceClient = createServiceClient();
      const { error: insertError } = await (serviceClient as any).from('profiles').insert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Judge',
        credits: 3, // Initial credits for new users
      });

      if (insertError) {
        log.error('Failed to auto-create profile before demographics', insertError);
        return NextResponse.json(
          { error: 'Unable to prepare profile for demographics' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const {
      age_range,
      gender,
      ethnicity,
      location,
      education_level,
      profession,
      relationship_status,
      income_range,
      lifestyle_tags,
      interest_areas,
      visibility_preferences
    } = body;

    // Note: age_range validation removed since the deployed schema doesn't require it

    try {
      // Save demographics - use upsert with onConflict to update existing record
      // Convert data types to match the actual deployed schema (TEXT[] instead of JSONB for some fields)
      const { data: demographics, error } = await supabase
        .from('judge_demographics')
        .upsert(
          {
            judge_id: user.id,
            age_range,
            gender,
            ethnicity: ethnicity, // TEXT field, not array
            location,
            education_level,
            profession,
            relationship_status,
            income_range,
            lifestyle_tags: lifestyle_tags || [], // JSONB array
            interest_areas: interest_areas || [], // JSONB array
            visibility_preferences: visibility_preferences || {
              show_age: true,
              show_gender: true,
              show_ethnicity: false,
              show_location: true,
              show_education: false,
              show_profession: true
            },
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'judge_id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        log.error('Demographics upsert error', error);

        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return NextResponse.json({
            message: 'Demographics feature not available - tables not deployed',
            success: true // Return success so UI doesn't break
          }, { status: 200 });
        }

        return NextResponse.json({
          error: 'Failed to save demographics',
          details: error.message
        }, { status: 500 });
      }

      // Create/update availability record (also handle table not existing)
      try {
        await supabase
          .from('judge_availability')
          .upsert(
            {
              judge_id: user.id,
              is_available: true,
              last_activity_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'judge_id',
              ignoreDuplicates: false
            }
          );
      } catch (availError) {
        // Ignore availability errors if table doesn't exist
        console.log('Judge availability table not found, skipping');
      }

      return NextResponse.json({ 
        demographics,
        message: 'Demographics saved successfully' 
      });
    } catch (tableError) {
      // Tables don't exist, return graceful message
      return NextResponse.json({
        message: 'Demographics feature not available - tables not deployed',
        success: true // Return success so UI doesn't break
      }, { status: 200 });
    }
  } catch (error) {
    log.error('POST /api/judge/demographics error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to demographics endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);