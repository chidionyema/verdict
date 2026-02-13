import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVerificationStatus } from '@/lib/judge/verification';

/**
 * GET /api/judge/verification-status
 *
 * Returns the current verification status for the authenticated user.
 * Includes current tier, completed steps, next step, and privileges.
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

    // Get verification status using the service
    const status = await getVerificationStatus(supabase, user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Verification Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load verification status' },
      { status: 500 }
    );
  }
}
