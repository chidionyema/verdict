/**
 * Credit Guard System - Prevents race conditions and double spending
 */
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

interface CreditOperation {
  userId: string;
  requestId: string;
  credits: number;
  operation: 'deduct' | 'refund';
}

// In-memory operation tracking to prevent concurrent operations
const activeOperations = new Map<string, Set<string>>();
const operationTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Safe credit deduction with multiple protection layers
 */
export async function safeDeductCredits(userId: string, credits: number, requestId: string): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> {
  const operationKey = `${userId}-${credits}-deduct`;
  
  // Layer 1: Prevent concurrent operations for same user
  if (activeOperations.has(userId)) {
    const userOps = activeOperations.get(userId)!;
    if (userOps.has(operationKey)) {
      return {
        success: false,
        newBalance: 0,
        message: 'Operation already in progress'
      };
    }
    userOps.add(operationKey);
  } else {
    activeOperations.set(userId, new Set([operationKey]));
  }

  // Set timeout to clean up stuck operations
  const timeoutId = setTimeout(() => {
    activeOperations.get(userId)?.delete(operationKey);
    if (activeOperations.get(userId)?.size === 0) {
      activeOperations.delete(userId);
    }
    operationTimeouts.delete(operationKey);
  }, 30000); // 30 second timeout

  operationTimeouts.set(operationKey, timeoutId);

  try {
    const supabase = await createClient();

    // Layer 2: Pre-flight balance check
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, id')
      .eq('id', userId)
      .single();

    if (!profile || (profile as any).credits < credits) {
      return {
        success: false,
        newBalance: (profile as any)?.credits || 0,
        message: 'Insufficient credits'
      };
    }

    // Layer 3: Check for duplicate request attempts
    const { data: existingRequest } = await supabase
      .from('verdict_requests')
      .select('id, user_id')
      .eq('id', requestId)
      .single();

    if (existingRequest) {
      return {
        success: false,
        newBalance: (profile as any).credits,
        message: 'Request already exists'
      };
    }

    // Layer 4: Atomic deduction with row locking
    const { data: result, error } = await (supabase as any).rpc('deduct_credits', {
      p_user_id: userId,
      p_credits: credits
    });

    if (error) {
      log.error('Credit deduction RPC failed', error);
      return {
        success: false,
        newBalance: (profile as any).credits,
        message: `Deduction failed: ${error.message}`
      };
    }

    const deductionResult = result[0];
    
    // Layer 5: Audit trail
    await (supabase as any)
      .from('credit_audit_log')
      .insert({
        user_id: userId,
        operation: 'deduct',
        credits_amount: credits,
        request_id: requestId,
        before_balance: (profile as any).credits,
        after_balance: deductionResult.new_balance,
        success: deductionResult.success,
        timestamp: new Date().toISOString()
      })
      .catch((auditError: any) => {
        log.warn('Audit log failed', auditError);
      });

    return {
      success: deductionResult.success,
      newBalance: deductionResult.new_balance,
      message: deductionResult.message
    };

  } catch (error) {
    log.error('Safe credit deduction failed', error);
    return {
      success: false,
      newBalance: 0,
      message: 'System error during credit deduction'
    };
  } finally {
    // Cleanup
    clearTimeout(operationTimeouts.get(operationKey));
    operationTimeouts.delete(operationKey);
    activeOperations.get(userId)?.delete(operationKey);
    if (activeOperations.get(userId)?.size === 0) {
      activeOperations.delete(userId);
    }
  }
}

/**
 * Request ID generator to prevent duplicates
 */
export function generateSecureRequestId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const hash = Buffer.from(`${userId}-${timestamp}-${random}`).toString('base64').substring(0, 16);
  return `req_${timestamp}_${hash}`;
}

/**
 * Credit refund with safety checks
 */
export async function safeRefundCredits(userId: string, credits: number, reason: string): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> {
  try {
    const supabase = await createClient();

    const { data: result, error } = await (supabase as any).rpc('refund_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_reason: reason
    });

    if (error) {
      log.error('Credit refund RPC failed', error);
      return {
        success: false,
        newBalance: 0,
        message: `Refund failed: ${error.message}`
      };
    }

    const refundResult = result[0];

    // Audit trail for refunds
    await (supabase as any)
      .from('credit_audit_log')
      .insert({
        user_id: userId,
        operation: 'refund',
        credits_amount: credits,
        reason,
        after_balance: refundResult.new_balance,
        success: refundResult.success,
        timestamp: new Date().toISOString()
      })
      .catch((auditError: any) => {
        log.warn('Refund audit log failed', auditError);
      });

    return {
      success: refundResult.success,
      newBalance: refundResult.new_balance,
      message: refundResult.message
    };

  } catch (error) {
    log.error('Safe credit refund failed', error);
    return {
      success: false,
      newBalance: 0,
      message: 'System error during credit refund'
    };
  }
}