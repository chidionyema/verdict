import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/judge/qualify - Submit judge qualification application
export async function POST(request: NextRequest) {
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
    const { experience_level, specialties, motivation_text } = body;

    // Validate input
    if (!experience_level || !specialties || !motivation_text) {
      return NextResponse.json({ 
        error: 'Missing required fields: experience_level, specialties, motivation_text' 
      }, { status: 400 });
    }

    if (!['beginner', 'intermediate', 'expert'].includes(experience_level)) {
      return NextResponse.json({ 
        error: 'Invalid experience_level. Must be: beginner, intermediate, or expert' 
      }, { status: 400 });
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json({ 
        error: 'Specialties must be a non-empty array' 
      }, { status: 400 });
    }

    if (motivation_text.length < 50) {
      return NextResponse.json({ 
        error: 'Motivation text must be at least 50 characters' 
      }, { status: 400 });
    }

    // Check if user already has a qualification record
    const { data: existingQualification } = await supabase
      .from('judge_qualifications')
      .select('id, application_status')
      .eq('user_id', user.id)
      .single();

    if (existingQualification) {
      if (existingQualification.application_status === 'pending') {
        return NextResponse.json({ 
          error: 'You already have a pending application' 
        }, { status: 400 });
      }
      if (existingQualification.application_status === 'approved') {
        return NextResponse.json({ 
          error: 'You are already qualified as a judge' 
        }, { status: 400 });
      }
    }

    // Create or update qualification record
    const qualificationData = {
      user_id: user.id,
      application_status: 'pending',
      experience_level,
      specialties,
      motivation_text: motivation_text.trim(),
      test_attempts: 0,
    };

    let result;
    if (existingQualification) {
      // Update existing record
      const { data, error } = await supabase
        .from('judge_qualifications')
        .update(qualificationData)
        .eq('id', existingQualification.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('judge_qualifications')
        .insert(qualificationData)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Error creating/updating qualification:', result.error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Create notification for admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true);

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.rpc('create_notification', {
          target_user_id: admin.id,
          notification_type: 'judge_application',
          notification_title: 'New judge application',
          notification_message: `A user has applied to become a judge. Experience level: ${experience_level}`,
          related_type: 'judge_qualification',
          related_id: result.data.id,
          action_label: 'Review Application',
          action_url: '/admin/judges',
          notification_priority: 'normal'
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      qualification_id: result.data.id,
      message: 'Application submitted successfully. You will be notified when it is reviewed.'
    });

  } catch (error) {
    console.error('POST /api/judge/qualify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/judge/qualify - Get qualification status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get qualification record
    const { data: qualification, error: fetchError } = await supabase
      .from('judge_qualifications')
      .select(`
        *,
        reviewer:profiles!judge_qualifications_reviewed_by_fkey(email)
      `)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching qualification:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch qualification status' }, { status: 500 });
    }

    return NextResponse.json({ 
      qualification: qualification || null,
      can_apply: !qualification || qualification.application_status === 'rejected'
    });

  } catch (error) {
    console.error('GET /api/judge/qualify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}