import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profile/completion - Get profile completion status
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

    // Get completion status
    const { data: completionStatus, error: statusError } = await supabase
      .rpc('get_profile_completion_status', { target_user_id: user.id });

    if (statusError) {
      console.error('Error getting completion status:', statusError);
      return NextResponse.json({ 
        error: 'Failed to get profile completion status' 
      }, { status: 500 });
    }

    // Get detailed step information
    const { data: steps } = await supabase
      .from('profile_completion_steps')
      .select('step_name, completed, completed_at')
      .eq('user_id', user.id);

    // Get profile info for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_verified, full_name, avatar_url, bio, is_judge')
      .eq('id', user.id)
      .single();

    const stepDetails = {
      email_verification: {
        completed: profile?.email_verified || false,
        title: 'Verify Email',
        description: 'Confirm your email address',
        required: true,
      },
      basic_profile: {
        completed: !!(profile?.full_name && profile?.avatar_url && profile?.bio),
        title: 'Complete Profile',
        description: 'Add your name, photo, and bio',
        required: true,
      },
      preferences: {
        completed: steps?.some(s => s.step_name === 'preferences' && s.completed) || false,
        title: 'Set Preferences',
        description: 'Choose notification and privacy settings',
        required: false,
      },
      first_request: {
        completed: steps?.some(s => s.step_name === 'first_request' && s.completed) || false,
        title: 'First Request',
        description: 'Submit your first verdict request',
        required: false,
      },
      judge_qualification: {
        completed: steps?.some(s => s.step_name === 'judge_qualification' && s.completed) || false,
        title: 'Become a Judge',
        description: 'Apply to become a judge and help others',
        required: false,
      },
    };

    return NextResponse.json({
      completion_status: completionStatus,
      step_details: stepDetails,
      profile_info: {
        email_verified: profile?.email_verified || false,
        has_full_name: !!profile?.full_name,
        has_avatar: !!profile?.avatar_url,
        has_bio: !!profile?.bio,
        is_judge: profile?.is_judge || false,
      }
    });

  } catch (error) {
    console.error('GET /api/profile/completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile/completion - Mark completion step
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
    const { step_name } = body;

    const validSteps = [
      'email_verification',
      'basic_profile', 
      'preferences',
      'first_request',
      'judge_qualification'
    ];

    if (!validSteps.includes(step_name)) {
      return NextResponse.json({ 
        error: 'Invalid step name' 
      }, { status: 400 });
    }

    // Mark step as completed
    const { error: insertError } = await supabase
      .from('profile_completion_steps')
      .insert({
        user_id: user.id,
        step_name,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .on('conflict', '(user_id, step_name)', {
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error marking step completion:', insertError);
      return NextResponse.json({ 
        error: 'Failed to mark step as completed' 
      }, { status: 500 });
    }

    // Get updated completion status
    const { data: updatedStatus } = await supabase
      .rpc('get_profile_completion_status', { target_user_id: user.id });

    // If profile is now complete, create celebration notification
    if (updatedStatus?.is_completed) {
      await supabase.rpc('create_notification', {
        target_user_id: user.id,
        notification_type: 'profile_completed',
        notification_title: 'Profile Complete! 🎉',
        notification_message: 'Congratulations! You\'ve completed your profile and unlocked all features.',
        action_label: 'Explore Platform',
        action_url: '/dashboard',
        notification_priority: 'high'
      });
    }

    return NextResponse.json({
      success: true,
      step_completed: step_name,
      completion_status: updatedStatus
    });

  } catch (error) {
    console.error('POST /api/profile/completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}