import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateContext, validateCategory } from '@/lib/validations';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

const EDIT_WINDOW_MINUTES = 5;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface VerdictRequest {
  id: string;
  user_id: string;
  status: string;
  received_verdict_count: number;
  created_at: string;
  context?: string;
  category?: string;
}

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// PATCH /api/requests/[id]/edit - Edit request details
async function PATCH_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate id as UUID
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid request ID format' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { context, category } = body;

    // Fetch the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: verdictRequest, error: requestError } = await (supabase as any)
      .from('verdict_requests')
      .select('id, user_id, status, received_verdict_count, created_at, context, category')
      .eq('id', id)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const typedRequest = verdictRequest as VerdictRequest;

    // Check ownership
    if (typedRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if request can be edited (status check)
    const status = typedRequest.status;
    if (status === 'closed' || status === 'cancelled' || status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot edit a completed or cancelled request' },
        { status: 400 }
      );
    }

    // Check if any verdicts have been received
    const receivedCount = typedRequest.received_verdict_count || 0;
    if (receivedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot edit after verdicts have been received' },
        { status: 400 }
      );
    }

    // Check edit window (5 minutes from creation)
    const createdAt = new Date(typedRequest.created_at).getTime();
    const now = Date.now();
    const elapsedMs = now - createdAt;
    const windowMs = EDIT_WINDOW_MINUTES * 60 * 1000;

    if (elapsedMs > windowMs) {
      return NextResponse.json(
        { error: 'Edit window has expired (5 minutes from creation)' },
        { status: 400 }
      );
    }

    // Validate inputs
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (context !== undefined) {
      if (typeof context !== 'string') {
        return NextResponse.json({ error: 'Context must be a string' }, { status: 400 });
      }

      const contextValidation = validateContext(context);
      if (!contextValidation.valid) {
        return NextResponse.json({ error: contextValidation.error }, { status: 400 });
      }

      updateData.context = context.trim();
    }

    if (category !== undefined) {
      if (!validateCategory(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      updateData.category = category;
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from('verdict_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      log.error('Failed to update request', updateError, {
        requestId: id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    log.info('Request edited successfully', {
      requestId: id,
      userId: user.id,
      updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at'),
      timeRemainingMs: windowMs - elapsedMs,
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    log.error('PATCH /api/requests/[id]/edit error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);
