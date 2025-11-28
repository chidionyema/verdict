import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

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
    const { data: verdictRequest, error: requestError } = await (supabase as any)
      .from('verdict_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if user owns this request
    if ((verdictRequest as any).user_id !== user.id) {
      // Check if user is a judge (can view for judging)
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_judge, is_admin')
        .eq('id', user.id)
        .single();

      if (!(profile as any)?.is_judge && !(profile as any)?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch verdicts for this request using service client to avoid RLS edge-cases,
    // after we've already verified that the caller is allowed to view this request.
    let verdicts: any[] | null = null;
    let verdictsError: any = null;

    try {
      const serviceClient = createServiceClient() as any;
      const result = await (serviceClient as any)
        .from('verdict_responses')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true });
      
      verdicts = result.data;
      verdictsError = result.error;
    } catch (serviceClientError) {
      log.error('Service client creation failed', serviceClientError);
      // Fallback: try with regular client (might work if RLS allows)
      try {
        const result = await (supabase as any)
          .from('verdict_responses')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: true });
        
        verdicts = result.data;
        verdictsError = result.error;
      } catch (fallbackError) {
        log.error('Fallback verdict fetch also failed', fallbackError);
        verdictsError = fallbackError;
      }
    }

    if (verdictsError) {
      log.error('Fetch verdicts error', verdictsError, {
        request_id: id,
        user_id: user.id,
        received_count: (verdictRequest as any).received_verdict_count,
        service_role_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      // Don't fail the request, but log the issue - return empty array
      // This allows the page to load even if verdicts can't be fetched
    }

    // Log if there's a mismatch between count and actual verdicts
    const receivedCount = (verdictRequest as any).received_verdict_count || 0;
    const actualVerdictsCount = verdicts?.length || 0;
    if (receivedCount > 0 && actualVerdictsCount === 0) {
      log.warn('Verdict count mismatch', {
        request_id: id,
        received_verdict_count: receivedCount,
        actual_verdicts_found: actualVerdictsCount,
        verdicts_error: verdictsError,
      });
    }

    // For seekers, don't expose judge IDs (anonymize)
    const anonymizedVerdicts = verdicts?.map((v: any, index: number) => ({
      ...(v as any),
      judge_id: undefined,
      judge_number: index + 1,
    })) || [];

    return NextResponse.json({
      request: verdictRequest,
      verdicts: anonymizedVerdicts,
    });
  } catch (error) {
    log.error('GET /api/requests/[id] error', error);
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
    const { data: verdictRequest, error: requestError } = await (supabase as any)
      .from('verdict_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check ownership
    if ((verdictRequest as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'flag') {
      updateData.is_flagged = true;
      updateData.flagged_reason = reason || 'Flagged by user';
    } else if (action === 'cancel') {
      if (
        (verdictRequest as any).status !== 'in_progress' &&
        (verdictRequest as any).status !== 'pending'
      ) {
        return NextResponse.json(
          { error: 'Can only cancel requests that are in progress' },
          { status: 400 }
        );
      }
      updateData.status = 'cancelled';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from('verdict_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      log.error('Update request error', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    log.error('PATCH /api/requests/[id] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
