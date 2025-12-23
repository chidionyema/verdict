/**
 * Credit Guard System - Prevents race conditions and double spending
 */
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// Hash function for generating consistent lock IDs
function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

interface CreditOperation {
  userId: string;
  requestId: string;
  credits: number;
  operation: 'deduct' | 'refund';
}

// Database-level operation tracking for serverless safety

/**
 * Safe credit deduction with multiple protection layers
 */
export async function safeDeductCredits(userId: string, credits: number, requestId: string): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> {
  const operationKey = `${userId}-${credits}-deduct`;
  
  const supabase = await createClient();
  
  // Layer 1: Database-level operation locking (PostgreSQL advisory locks)  
  const lockId = hashText(`${userId}-credit-deduct`);
  
  try {
    // Acquire exclusive lock for this user's credit operations
    const { data: lockAcquired } = await (supabase as any).rpc('try_advisory_lock', {
      lock_id: lockId
    });
    
    if (!lockAcquired) {
      return {
        success: false,
        newBalance: 0,
        message: 'Credit operation already in progress for this user'
      };
    }
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
    // Release the database lock
    await (supabase as any).rpc('advisory_unlock', {
      lock_id: lockId
    }).catch((unlockError: any) => {
      log.warn('Failed to release advisory lock', { lockId, error: unlockError });
    });
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