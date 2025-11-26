// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/requests/[id] - Get request with verdicts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the request
    const { data: verdictRequest, error: requestError } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if user owns this request
    if (verdictRequest.user_id !== user.id) {
      // Check if user is a judge (can view for judging)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_judge, is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_judge && !profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch verdicts for this request using service client to avoid RLS edge-cases,
    // after we've already verified that the caller is allowed to view this request.
    const serviceClient = createServiceClient();

    const { data: verdicts, error: verdictsError } = await serviceClient
      .from('verdict_responses')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: true });

    if (verdictsError) {
      console.error('Fetch verdicts error:', verdictsError);
    }

    // Temporary deep debug for partial-results bug
    console.log('DEBUG verdict_responses', {
      requestId: id,
      verdictsError,
      verdictsLength: verdicts?.length ?? 0,
      sample: verdicts?.[0],
    });

    // For seekers, don't expose judge IDs (anonymize)
    const anonymizedVerdicts = verdicts?.map((v, index) => ({
      ...v,
      judge_id: undefined,
      judge_number: index + 1,
    }));

    return NextResponse.json({
      request: verdictRequest,
      verdicts: anonymizedVerdicts || [],
    });
  } catch (error) {
    console.error('GET /api/requests/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/requests/[id] - Update request (flag, cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    // Fetch the request
    const { data: verdictRequest, error: requestError } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check ownership
    if (verdictRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'flag') {
      updateData.is_flagged = true;
      updateData.flagged_reason = reason || 'Flagged by user';
    } else if (action === 'cancel') {
      if (verdictRequest.status !== 'in_progress' && verdictRequest.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only cancel requests that are in progress' },
          { status: 400 }
        );
      }
      updateData.status = 'cancelled';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('verdict_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update request error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('PATCH /api/requests/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
