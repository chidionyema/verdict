import { createClient } from '@/lib/supabase/client';
import { stripe, isDemoMode } from '@/lib/stripe';
import { log } from '@/lib/logger';

export interface PaymentDiscrepancy {
  type: 'missing_transaction' | 'pending_transaction' | 'credit_mismatch';
  sessionId: string;
  userId: string;
  expectedCredits: number;
  actualCredits?: number;
  transactionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionRequired: string;
}

export interface ReconciliationReport {
  discrepancies: PaymentDiscrepancy[];
  summary: {
    totalSessions: number;
    totalDiscrepancies: number;
    criticalIssues: number;
    totalCreditsAffected: number;
  };
  recommendations: string[];
}

export class PaymentReconciliationManager {
  private supabase = createClient();

  /**
   * Analyze payment discrepancies without making changes
   */
  async analyzeDiscrepancies(hoursBack = 24): Promise<ReconciliationReport> {
    if (isDemoMode() || !stripe) {
      return {
        discrepancies: [],
        summary: { totalSessions: 0, totalDiscrepancies: 0, criticalIssues: 0, totalCreditsAffected: 0 },
        recommendations: ['Demo mode - no reconciliation needed']
      };
    }

    const startTime = Math.floor((Date.now() - (hoursBack * 60 * 60 * 1000)) / 1000);
    const discrepancies: PaymentDiscrepancy[] = [];

    try {
      // Get successful sessions from Stripe
      const sessions = await stripe.checkout.sessions.list({
        created: { gte: startTime },
        status: 'complete',
        limit: 100
      });

      for (const session of sessions.data) {
        if (!session.metadata?.credits || !session.metadata.user_id) continue;

        const userId = session.metadata.user_id;
        const expectedCredits = parseInt(session.metadata.credits);

        // Check our transaction record
        const { data: transaction } = await this.supabase
          .from('transactions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (!transaction) {
          // Missing transaction entirely
          discrepancies.push({
            type: 'missing_transaction',
            sessionId: session.id,
            userId,
            expectedCredits,
            severity: 'critical',
            description: `Payment succeeded in Stripe but no transaction record exists. User paid but didn't receive ${expectedCredits} credits.`,
            actionRequired: 'Add credits to user account and create transaction record'
          });
        } else if ((transaction as any).status === 'pending') {
          // Transaction stuck in pending state
          discrepancies.push({
            type: 'pending_transaction',
            sessionId: session.id,
            userId,
            expectedCredits,
            transactionId: (transaction as any).id,
            severity: 'high',
            description: `Transaction record exists but status is still pending. User may not have received credits.`,
            actionRequired: 'Update transaction status to completed and verify credits were added'
          });
        } else if ((transaction as any).credits_delta !== expectedCredits) {
          // Credit amount mismatch
          discrepancies.push({
            type: 'credit_mismatch',
            sessionId: session.id,
            userId,
            expectedCredits,
            actualCredits: (transaction as any).credits_delta,
            transactionId: (transaction as any).id,
            severity: 'medium',
            description: `Credit amount mismatch: expected ${expectedCredits}, recorded ${(transaction as any).credits_delta}`,
            actionRequired: 'Adjust user credits to match payment amount'
          });
        }
      }

      // Generate summary
      const summary = {
        totalSessions: sessions.data.length,
        totalDiscrepancies: discrepancies.length,
        criticalIssues: discrepancies.filter(d => d.severity === 'critical').length,
        totalCreditsAffected: discrepancies.reduce((sum, d) => sum + d.expectedCredits, 0)
      };

      // Generate recommendations
      const recommendations: string[] = [];
      if (summary.criticalIssues > 0) {
        recommendations.push(`${summary.criticalIssues} critical issues need immediate attention`);
      }
      if (summary.totalDiscrepancies > 5) {
        recommendations.push('High number of discrepancies - review webhook delivery');
      }
      if (summary.totalCreditsAffected > 100) {
        recommendations.push('Large credit amount affected - prioritize resolution');
      }
      if (summary.totalDiscrepancies === 0) {
        recommendations.push('No discrepancies found - payment system healthy');
      }

      return { discrepancies, summary, recommendations };

    } catch (error) {
      log.error('Failed to analyze payment discrepancies', error);
      throw new Error('Analysis failed');
    }
  }

  /**
   * Automatically fix discrepancies that can be safely resolved
   */
  async autoFixDiscrepancies(discrepancies: PaymentDiscrepancy[]): Promise<{
    fixed: number;
    errors: number;
    details: { type: string; sessionId: string; success: boolean; error?: string }[];
  }> {
    const results = { fixed: 0, errors: 0, details: [] as any[] };

    for (const discrepancy of discrepancies) {
      try {
        if (discrepancy.type === 'missing_transaction') {
          // Add missing credits and create transaction
          const { data: creditResult, error: creditError } = await (this.supabase.rpc as any)('add_credits', {
            p_user_id: discrepancy.userId,
            p_credits: discrepancy.expectedCredits
          });

          if (creditError) throw creditError;

          // Create transaction record
          const { error: txError } = await (this.supabase
            .from('transactions')
            .insert as any)({
              user_id: discrepancy.userId,
              stripe_session_id: discrepancy.sessionId,
              type: 'purchase',
              credits_delta: discrepancy.expectedCredits,
              status: 'completed'
            });

          if (txError) throw txError;

          results.fixed++;
          results.details.push({
            type: discrepancy.type,
            sessionId: discrepancy.sessionId,
            success: true
          });

        } else if (discrepancy.type === 'pending_transaction') {
          // Update transaction status
          const { error: updateError } = await (this.supabase
            .from('transactions')
            .update as any)({ status: 'completed' })
            .eq('id', discrepancy.transactionId);

          if (updateError) throw updateError;

          results.fixed++;
          results.details.push({
            type: discrepancy.type,
            sessionId: discrepancy.sessionId,
            success: true
          });
        }
        // Skip credit_mismatch - too risky to auto-fix
      } catch (error) {
        results.errors++;
        results.details.push({
          type: discrepancy.type,
          sessionId: discrepancy.sessionId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        log.error('Failed to auto-fix discrepancy', error, { discrepancy });
      }
    }

    return results;
  }

  /**
   * Get payment health metrics
   */
  async getPaymentHealthMetrics(): Promise<{
    webhookDeliveryRate: number;
    transactionSuccessRate: number;
    averageProcessingTime: number;
    pendingTransactions: number;
    failedTransactions: number;
  }> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: transactions } = await this.supabase
      .from('transactions')
      .select('*')
      .gte('created_at', yesterday);

    if (!transactions) {
      return {
        webhookDeliveryRate: 0,
        transactionSuccessRate: 0,
        averageProcessingTime: 0,
        pendingTransactions: 0,
        failedTransactions: 0
      };
    }

    const total = transactions.length;
    const completed = transactions.filter((t: any) => t.status === 'completed').length;
    const pending = transactions.filter((t: any) => t.status === 'pending').length;
    const failed = transactions.filter((t: any) => t.status === 'failed').length;

    return {
      webhookDeliveryRate: total > 0 ? (completed / total) * 100 : 0,
      transactionSuccessRate: total > 0 ? (completed / total) * 100 : 0,
      averageProcessingTime: 0, // Would need timestamp analysis
      pendingTransactions: pending,
      failedTransactions: failed
    };
  }
}

export const reconciliationManager = new PaymentReconciliationManager();