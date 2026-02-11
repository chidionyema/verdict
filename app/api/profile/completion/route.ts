import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/profile/completion - Get profile completion status
async function GET_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get completion status
    // @ts-ignore - RPC function types not generated
    const { data: completionStatus, error: statusError } = await supabase
      .rpc('get_profile_completion_status', { target_user_id: user.id }) as { data: any; error: any };

    if (statusError) {
      log.error('Error getting completion status', statusError);
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
      .single() as { data: {
        email_verified: boolean;
        full_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_judge: boolean;
      } | null };

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
        completed: steps?.some((s: any) => s.step_name === 'preferences' && s.completed) || false,
        title: 'Set Preferences',
        description: 'Choose notification and privacy settings',
        required: false,
      },
      first_request: {
        completed: steps?.some((s: any) => s.step_name === 'first_request' && s.completed) || false,
        title: 'First Request',
        description: 'Submit your first verdict request',
        required: false,
      },
      judge_qualification: {
        completed: steps?.some((s: any) => s.step_name === 'judge_qualification' && s.completed) || false,
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
    log.error('GET /api/profile/completion error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile/completion - Mark completion step
async function POST_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();

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

    // Mark step as completed using upsert
    // @ts-ignore - Supabase upsert types
    const { error: insertError } = await supabase
      .from('profile_completion_steps')
      .upsert({
        user_id: user.id,
        step_name,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,step_name'
      });

    if (insertError) {
      log.error('Error marking step completion', insertError);
      return NextResponse.json({
        error: 'Failed to mark step as completed'
      }, { status: 500 });
    }

    // Get updated completion status
    // @ts-ignore - RPC function types not generated
    const { data: updatedStatus } = await supabase
      .rpc('get_profile_completion_status', { target_user_id: user.id }) as { data: any };

    // If profile is now complete, create celebration notification
    if (updatedStatus?.is_completed) {
      try {
        // @ts-ignore - RPC function types not generated
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'profile_completed',
          p_title: 'Profile Complete!',
          p_message: 'Congratulations! You\'ve completed your profile and unlocked all features.',
          p_metadata: JSON.stringify({
            action_label: 'Explore Platform',
            action_url: '/dashboard',
            priority: 'high'
          })
        });
      } catch (notifError) {
        // Non-critical - log but don't fail
        log.warn('Failed to create profile completion notification', { error: notifError, userId: user.id });
      }
    }

    return NextResponse.json({
      success: true,
      step_completed: step_name,
      completion_status: updatedStatus
    });

  } catch (error) {
    log.error('POST /api/profile/completion error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to profile completion endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);