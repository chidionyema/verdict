/**
 * Credit Guard System - Prevents race conditions and double spending
 */
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// Configuration for credit operations
const CREDIT_OPERATION_TIMEOUT_MS = 10000; // 10 second timeout for credit operations
const MAX_LOCK_RETRY_ATTEMPTS = 3;
const LOCK_RETRY_DELAY_MS = 100;

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

// Timeout wrapper for async operations
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

interface CreditOperation {
  userId: string;
  requestId: string;
  credits: number;
  operation: 'deduct' | 'refund';
}

// Track locks held by this process for cleanup
const heldLocks = new Set<number>();

// Database-level operation tracking for serverless safety

/**
 * Safe credit deduction with multiple protection layers
 */
export async function safeDeductCredits(userId: string, credits: number, requestId: string): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> {
  const supabase = await createClient();

  // Layer 1: Database-level operation locking (PostgreSQL advisory locks)
  const lockId = hashText(`${userId}-credit-deduct`);
  let lockAcquired = false;

  try {
    // Acquire exclusive lock with retry logic and timeout
    for (let attempt = 1; attempt <= MAX_LOCK_RETRY_ATTEMPTS; attempt++) {
      try {
        const lockResult = await withTimeout(
          (supabase as any).rpc('try_advisory_lock', { lock_id: lockId }),
          2000, // 2 second timeout for lock acquisition
          'Advisory lock acquisition'
        ) as { data: boolean | null; error: any };
        const { data: acquired, error: lockError } = lockResult;

        if (lockError) {
          log.warn('Lock acquisition error', { lockId, attempt, error: lockError });
          if (attempt < MAX_LOCK_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY_MS * attempt));
            continue;
          }
          return {
            success: false,
            newBalance: 0,
            message: 'Failed to acquire credit operation lock'
          };
        }

        if (acquired) {
          lockAcquired = true;
          heldLocks.add(lockId);
          break;
        }

        if (attempt < MAX_LOCK_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY_MS * attempt));
        }
      } catch (error) {
        log.warn('Lock acquisition attempt failed', { lockId, attempt, error });
        if (attempt === MAX_LOCK_RETRY_ATTEMPTS) {
          return {
            success: false,
            newBalance: 0,
            message: 'Credit operation lock acquisition timed out'
          };
        }
      }
    }

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
    // Release the database lock with proper error handling
    if (lockAcquired) {
      try {
        await withTimeout(
          (supabase as any).rpc('advisory_unlock', { lock_id: lockId }),
          2000, // 2 second timeout for unlock
          'Advisory lock release'
        );
        heldLocks.delete(lockId);
      } catch (unlockError) {
        // CRITICAL: Log this as an error, not a warning - lock leak can cause issues
        log.error('CRITICAL: Failed to release advisory lock - potential lock leak', unlockError, {
          lockId,
          userId,
          requestId,
          action: 'Manual database intervention may be required'
        });
        heldLocks.delete(lockId); // Remove from local tracking even if DB release failed
      }
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