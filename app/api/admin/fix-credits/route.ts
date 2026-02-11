import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess, auditAdminAction } from '@/lib/admin-guard';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation for security
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function POST_Handler(request: NextRequest) {
  try {
    // Verify admin access
    const adminAuth = await verifyAdminAccess(request);

    if (!adminAuth.authorized) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const supabase = await createClient();

    // Parse request body with proper error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      log.warn('Invalid JSON in admin fix-credits request', { error: parseError });
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Validate target user ID - must be explicitly provided and valid UUID
    const targetUserId = body.user_id;
    if (!targetUserId || typeof targetUserId !== 'string' || !UUID_REGEX.test(targetUserId)) {
      return NextResponse.json({
        error: 'Valid user_id (UUID) is required for credit adjustment'
      }, { status: 400 });
    }

    // Validate credit amount - must be within reasonable bounds
    const targetCredits = typeof body.credits === 'number' ? body.credits : null;
    if (targetCredits === null || targetCredits < 0 || targetCredits > 1000) {
      return NextResponse.json({
        error: 'credits must be a number between 0 and 1000'
      }, { status: 400 });
    }

    // Require explicit reason for audit trail
    const reason = body.reason;
    if (!reason || typeof reason !== 'string' || reason.length < 10) {
      return NextResponse.json({
        error: 'A reason (at least 10 characters) is required for credit adjustments'
      }, { status: 400 });
    }

    // Log the admin action attempt
    log.info('Admin credit adjustment initiated', {
      adminId: adminAuth.user!.id,
      targetUserId,
      targetCredits,
      reason
    });

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits, email')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Use safe credit operations instead of direct database manipulation
    const { safeRefundCredits, safeDeductCredits } = require('@/lib/credit-guard');

    const currentCredits = (profile as any).credits || 0;

    let result;
    if (targetCredits > currentCredits) {
      // Need to add credits - use refund function
      const creditsToAdd = targetCredits - currentCredits;
      result = await safeRefundCredits(
        targetUserId,
        creditsToAdd,
        `Admin adjustment by ${adminAuth.user!.id}: ${reason}`
      );
    } else if (targetCredits < currentCredits) {
      // Need to deduct credits
      const creditsToRemove = currentCredits - targetCredits;
      const requestId = `admin_fix_${Date.now()}_${adminAuth.user!.id}`;
      result = await safeDeductCredits(targetUserId, creditsToRemove, requestId);
    } else {
      // Credits already at target amount
      result = { success: true, newBalance: currentCredits, message: 'Credits already at target amount' };
    }
    
    if (!result.success) {
      return NextResponse.json({ error: `Failed to adjust credits: ${result.message}` }, { status: 500 });
    }

    // CRITICAL: Audit the action with full context - audit MUST succeed for compliance
    // If audit fails, we still succeeded in changing credits but must report the audit failure
    try {
      await auditAdminAction(adminAuth.user!, 'fix_credits', {
        target_user_id: targetUserId,
        target_email: (profile as any).email,
        old_credits: currentCredits,
        new_credits: result.newBalance,
        reason: reason,
        admin_id: adminAuth.user!.id
      }, { failOnError: true });
    } catch (auditError) {
      // Log critical error - action succeeded but audit failed
      log.error('CRITICAL: Credit adjustment succeeded but audit logging failed', auditError, {
        adminId: adminAuth.user!.id,
        targetUserId,
        oldCredits: currentCredits,
        newCredits: result.newBalance,
        reason
      });

      // Return success but flag the audit failure for investigation
      return NextResponse.json({
        message: 'Credits adjusted but audit logging failed - requires investigation',
        target_user: targetUserId,
        old_credits: currentCredits,
        new_credits: result.newBalance,
        audit_warning: 'Audit logging failed - this action requires manual audit review'
      }, { status: 200 });
    }

    return NextResponse.json({
      message: 'Credits adjusted successfully',
      target_user: targetUserId,
      old_credits: currentCredits,
      new_credits: result.newBalance
    });

  } catch (error) {
    log.error('Admin fix-credits endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function GET_Handler() {
  return NextResponse.json({ message: 'Use POST to fix credits' });
}

// Apply strict rate limiting to credit manipulation endpoints
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);