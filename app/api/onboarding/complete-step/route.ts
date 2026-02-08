import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeOnboardingStep, type OnboardingState } from '@/lib/onboarding';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/onboarding/complete-step - Complete an onboarding step
async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stepId } = body;

    // Validate step ID
    const validSteps: (keyof OnboardingState)[] = [
      'profile_completed',
      'tutorial_completed', 
      'guidelines_accepted',
      'first_submission_completed',
      'first_judgment_completed',
      'email_verified',
      'safety_training_completed'
    ];

    if (!stepId || !validSteps.includes(stepId)) {
      return NextResponse.json({ 
        error: 'Invalid step ID',
        validSteps
      }, { status: 400 });
    }

    log.info('Completing onboarding step', {
      userId: user.id,
      stepId,
      userEmail: user.email
    });

    // Complete the step
    const success = await completeOnboardingStep(user.id, stepId);
    
    if (!success) {
      log.error('Failed to complete onboarding step', null, {
        userId: user.id,
        stepId,
        severity: 'medium'
      });
      return NextResponse.json({ 
        error: 'Failed to complete step' 
      }, { status: 500 });
    }

    // Get updated onboarding state
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    // If profile doesn't exist, create it first
    if (!updatedProfile && fetchError?.code === 'PGRST116') {
      const { error: createError } = await (supabase
        .from('profiles')
        .insert as any)({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'User',
          credits: 3,
          onboarding_completed: false,
          is_judge: false,
          is_admin: false
        });

      if (createError) {
        log.error('Failed to create profile during onboarding', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
    }

    log.info('Onboarding step completed successfully', {
      userId: user.id,
      stepId,
      onboardingCompleted: (updatedProfile as any)?.onboarding_completed || false
    });

    // Create a mock onboarding state for backwards compatibility
    const mockOnboardingState = {
      profile_completed: true,
      tutorial_completed: stepId === 'tutorial_completed',
      guidelines_accepted: stepId === 'guidelines_accepted',
      first_submission_completed: stepId === 'first_submission_completed',
      first_judgment_completed: stepId === 'first_judgment_completed',
      email_verified: true,
      safety_training_completed: stepId === 'safety_training_completed',
      onboarding_completed: (updatedProfile as any)?.onboarding_completed || false
    };

    return NextResponse.json({
      success: true,
      stepCompleted: stepId,
      onboardingState: mockOnboardingState,
      onboardingCompleted: (updatedProfile as any)?.onboarding_completed || false
    });

  } catch (error) {
    log.error('Onboarding step completion failed', error, {
      severity: 'high'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/onboarding/complete-step - Get user's onboarding state
async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get onboarding state
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    // If profile doesn't exist, create it first
    if (!profile && profileError?.code === 'PGRST116') {
      const { error: createError } = await (supabase
        .from('profiles')
        .insert as any)({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'User',
          credits: 3,
          onboarding_completed: false,
          is_judge: false,
          is_admin: false
        });

      if (createError) {
        log.error('Failed to create profile during onboarding get', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
    }

    // Create a default onboarding state
    const defaultOnboardingState = {
      profile_completed: !!profile, // True if profile exists
      tutorial_completed: false,
      guidelines_accepted: false,
      first_submission_completed: false,
      first_judgment_completed: false,
      email_verified: !!profile, // True if profile exists
      safety_training_completed: false,
      onboarding_completed: (profile as any)?.onboarding_completed || false
    };

    return NextResponse.json({
      success: true,
      onboardingState: defaultOnboardingState,
      userId: user.id
    });

  } catch (error) {
    log.error('Failed to get onboarding state', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to onboarding endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);