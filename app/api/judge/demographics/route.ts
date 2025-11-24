import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/judge/demographics - Get judge demographics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    console.error('GET /api/judge/demographics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/judge/demographics - Create/update judge demographics
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a judge
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (!profile?.is_judge) {
      return NextResponse.json({ 
        error: 'Must be a verified judge to set demographics' 
      }, { status: 403 });
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

    // Validate required fields
    if (!age_range) {
      return NextResponse.json({ 
        error: 'Age range is required' 
      }, { status: 400 });
    }

    // Save demographics
    const { data: demographics, error } = await supabase
      .from('judge_demographics')
      .upsert({
        judge_id: user.id,
        age_range,
        gender,
        ethnicity,
        location,
        education_level,
        profession,
        relationship_status,
        income_range,
        lifestyle_tags: lifestyle_tags || [],
        interest_areas: interest_areas || [],
        visibility_preferences: visibility_preferences || {
          show_age: true,
          show_gender: true,
          show_ethnicity: false,
          show_location: true,
          show_education: false,
          show_profession: true
        },
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Demographics upsert error:', error);
      return NextResponse.json({ 
        error: 'Failed to save demographics',
        details: error.message 
      }, { status: 500 });
    }

    // Create availability record
    await supabase
      .from('judge_availability')
      .upsert({
        judge_id: user.id,
        is_available: true,
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({ 
      demographics,
      message: 'Demographics saved successfully' 
    });
  } catch (error) {
    console.error('POST /api/judge/demographics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}