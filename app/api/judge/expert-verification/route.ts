import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  submitExpertVerificationRequest,
  getVerificationStatus,
} from '@/lib/judge/verification';

/**
 * POST /api/judge/expert-verification
 *
 * Submit an expert verification request.
 * Requires user to be at least linkedin_verified tier.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { expertiseCategory, proofType, proofUrl, proofDescription, yearsExperience } = body;

    // Validate required fields
    if (!expertiseCategory || !proofType || !proofDescription || !yearsExperience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user meets prerequisites (linkedin_verified)
    const verificationStatus = await getVerificationStatus(supabase, user.id);

    if (verificationStatus.tierIndex < 4) {
      return NextResponse.json(
        {
          error: 'You must complete LinkedIn verification before applying for Expert status',
          currentTier: verificationStatus.currentTier,
          requiredTier: 'linkedin_verified',
        },
        { status: 403 }
      );
    }

    // Submit the request
    const result = await submitExpertVerificationRequest(supabase, {
      userId: user.id,
      expertiseCategory,
      proofType,
      proofUrl,
      proofDescription,
      yearsExperience,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      message: 'Expert verification request submitted successfully',
    });
  } catch (error) {
    console.error('[Expert Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit expert verification request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/judge/expert-verification
 *
 * Get the current user's expert verification request status.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get existing request
    const { data: existingRequest, error } = await supabase
      .from('expert_verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      hasRequest: !!existingRequest,
      request: existingRequest || null,
    });
  } catch (error) {
    console.error('[Expert Verification Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get expert verification status' },
      { status: 500 }
    );
  }
}
