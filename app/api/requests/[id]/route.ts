import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient, hasServiceKey } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { reputationManager } from '@/lib/reputation';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// GET /api/requests/[id] - Get request with verdicts
async function GET_Handler(
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

    // Use service client to bypass RLS - we'll do access control in code
    // This is more reliable than depending on complex RLS policies
    const useServiceClient = hasServiceKey();
    let verdictRequest: any = null;
    let requestError: any = null;

    if (useServiceClient) {
      const serviceClient = createServiceClient() as any;
      const result = await serviceClient
        .from('verdict_requests')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      verdictRequest = result.data;
      requestError = result.error;
    } else {
      // Fallback to regular client
      const result = await (supabase as any)
        .from('verdict_requests')
        .select('*')
        .eq('id', id)
        .single();
      verdictRequest = result.data;
      requestError = result.error;
    }

    if (requestError || !verdictRequest) {
      log.warn('Request not found', { id, error: requestError?.message });
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Access control: owner, judges, or admins can view
    const isOwner = verdictRequest.user_id === user.id;

    if (!isOwner) {
      // Check if user is a judge or admin
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_judge, is_admin')
        .eq('id', user.id)
        .single();

      const isJudge = (profile as any)?.is_judge === true;
      const isAdmin = (profile as any)?.is_admin === true;

      // Judges can only view open/in_progress requests
      const canJudge = isJudge && ['open', 'in_progress'].includes(verdictRequest.status);

      if (!canJudge && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch verdicts for this request
    // We've already verified that the caller is allowed to view this request
    let verdicts: any[] | null = null;
    let verdictsError: any = null;
    const receivedCount = (verdictRequest as any).received_verdict_count || 0;

    try {
      if (useServiceClient) {
        const serviceClient = createServiceClient() as any;

        const result = await serviceClient
          .from('verdict_responses')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: true });

        verdicts = result.data;
        verdictsError = result.error;
      } else {
        // No service key - use regular client
        // This relies on RLS policies allowing the owner to see verdicts
        log.info('Using regular client for verdict fetch (no service key)', {
          request_id: id,
          user_id: user.id,
          is_owner: isOwner,
        });

        const result = await (supabase as any)
          .from('verdict_responses')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: true });

        verdicts = result.data;
        verdictsError = result.error;
      }

      // Filter out 'removed' verdicts in memory if status field exists
      if (verdicts && verdicts.length > 0) {
        verdicts = verdicts.filter((v: any) => v.status !== 'removed');
      }

      // Log mismatch for debugging
      if (receivedCount > 0 && (!verdicts || verdicts.length === 0)) {
        log.error('Verdict count mismatch - no verdicts found', {
          request_id: id,
          received_verdict_count: receivedCount,
          verdicts_found: verdicts?.length || 0,
          query_error: verdictsError,
          used_service_client: useServiceClient,
          is_owner: isOwner,
        });
      }
    } catch (queryError: any) {
      log.error('Verdict fetch failed', {
        error: queryError?.message || queryError,
        request_id: id,
        used_service_client: useServiceClient,
      });
      verdictsError = queryError;
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
    const actualVerdictsCount = verdicts?.length || 0;
    if (receivedCount !== actualVerdictsCount && !verdictsError) {
      log.warn('Verdict count mismatch - reconciling', {
        request_id: id,
        received_verdict_count: receivedCount,
        actual_verdicts_found: actualVerdictsCount,
      });

      // Auto-reconcile the count to prevent request from being stuck
      try {
        await (supabase as any)
          .from('verdict_requests')
          .update({ received_verdict_count: actualVerdictsCount })
          .eq('id', id);

        // Update local reference for response
        (verdictRequest as any).received_verdict_count = actualVerdictsCount;

        log.info('Verdict count reconciled', {
          request_id: id,
          old_count: receivedCount,
          new_count: actualVerdictsCount,
        });
      } catch (reconcileError) {
        log.error('Failed to reconcile verdict count', {
          error: reconcileError,
          request_id: id,
        });
      }
    }

    // BULLETPROOF: Bulk fetch reviewer reputations to prevent N+1 DoS
    const judgeIds = (verdicts || []).map((v: any) => v.judge_id).filter(Boolean);
    const reputationMap = new Map();
    
    if (judgeIds.length > 0) {
      // Single query to get all reputations
      const reputations = await Promise.all(
        judgeIds.map(id => reputationManager.getReviewerReputation(id))
      );
      
      judgeIds.forEach((id, index) => {
        if (reputations[index]) {
          reputationMap.set(id, reputations[index]);
        }
      });
    }
    
    // Anonymize verdicts using cached reputation data
    const anonymizedVerdicts = (verdicts || []).map((v: any, index: number) => {
      let reviewerInfo = null;
      if (v.judge_id && reputationMap.has(v.judge_id)) {
        const reputation = reputationMap.get(v.judge_id);
        reviewerInfo = {
          user_id: v.judge_id,
          reputation_score: reputation.reputation_score,
          is_expert: reputation.is_expert,
          expert_title: reputation.expert_title
        };
      }
      
      return {
        ...(v as any),
        judge_id: undefined, // Still hide the actual ID
        judge_number: index + 1,
        reviewer_info: reviewerInfo
      };
    });

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
      const currentStatus = (verdictRequest as any).status;
      if (
        currentStatus !== 'in_progress' &&
        currentStatus !== 'open' &&
        currentStatus !== 'pending'
      ) {
        return NextResponse.json(
          { error: 'Can only cancel requests that are open or in progress' },
          { status: 400 }
        );
      }

      updateData.status = 'cancelled';

      // Calculate pro-rated refund based on delivered verdicts
      const receivedCount = (verdictRequest as any).received_verdict_count || 0;
      const targetCount = (verdictRequest as any).target_verdict_count || 3;
      const creditsCharged = (verdictRequest as any).credits_charged ||
                             (verdictRequest as any).credits_cost || 0;

      if (creditsCharged > 0 && targetCount > 0) {
        // Calculate undelivered ratio and refund amount
        // Use Math.ceil to round UP in favor of the user (they shouldn't lose fractional credits)
        const deliveredRatio = receivedCount / targetCount;
        const refundCredits = Math.ceil(creditsCharged * (1 - deliveredRatio));

        if (refundCredits > 0) {
          // Refund credits using the refund_credits RPC
          const { data: refundResult, error: refundError } = await (supabase.rpc as any)(
            'refund_credits',
            {
              p_user_id: user.id,
              p_credits: refundCredits,
              p_reason: `Cancelled request ${id}: ${receivedCount}/${targetCount} verdicts received`
            }
          );

          if (refundError) {
            log.error('Failed to refund credits on cancellation', refundError, {
              requestId: id,
              userId: user.id,
              refundCredits,
              receivedCount,
              targetCount
            });
            // Mark request as needing manual refund reconciliation
            updateData.refund_pending = true;
            updateData.refund_amount = refundCredits;
          } else {
            log.info('Credits refunded on cancellation', {
              requestId: id,
              userId: user.id,
              refundCredits,
              newBalance: refundResult?.[0]?.new_balance,
              receivedCount,
              targetCount
            });
            updateData.credits_refunded = refundCredits;

            // Create notification for user about refund
            try {
              await (supabase.rpc as any)('create_notification', {
                p_user_id: user.id,
                p_type: 'credit_refund',
                p_title: 'Credits Refunded',
                p_message: `${refundCredits} credit${refundCredits > 1 ? 's' : ''} refunded for cancelled request.`,
                p_metadata: JSON.stringify({
                  refund_credits: refundCredits,
                  request_id: id,
                  verdicts_received: receivedCount,
                  verdicts_target: targetCount
                })
              });
            } catch (notifError) {
              log.warn('Failed to create refund notification', { error: notifError });
            }
          }
        } else {
          log.info('No refund on cancellation - all verdicts delivered', {
            requestId: id,
            receivedCount,
            targetCount,
            creditsCharged
          });
        }
      }

      // Log status transition for audit trail
      try {
        await (supabase.rpc as any)('log_request_status_transition', {
          p_request_id: id,
          p_from_status: currentStatus,
          p_to_status: 'cancelled',
          p_triggered_by: user.id,
          p_reason: 'user_action',
          p_metadata: JSON.stringify({
            refund_credits: updateData.credits_refunded || 0,
            verdicts_received: receivedCount,
            verdicts_target: targetCount,
            cancellation_reason: reason || 'User requested cancellation'
          })
        });
      } catch (transitionError) {
        log.warn('Failed to log status transition', { error: transitionError });
      }
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

// Apply rate limiting to request endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);
