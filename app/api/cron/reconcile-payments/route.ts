import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { log } from '@/lib/logger';
import { trackPaymentReconciliation } from '@/lib/monitoring';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/cron/reconcile-payments - Automated payment reconciliation
// Should be called by cron job every 30 minutes
async function POST_Handler(request: NextRequest) {
  try {
    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      log.error('Unauthorized cron job attempt', { authHeader });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDemoMode() || !stripe) {
      log.info('Skipping payment reconciliation in demo mode');
      return NextResponse.json({ 
        success: true, 
        demo: true,
        message: 'Demo mode - reconciliation skipped'
      });
    }

    const supabase = await createClient();
    
    // Look back 24 hours to catch any delayed webhook deliveries or missed events
    const startTime = Math.floor((Date.now() - (24 * 60 * 60 * 1000)) / 1000);

    log.info('Starting automated payment reconciliation', {
      startTime,
      timestamp: new Date().toISOString(),
      lookbackHours: 24
    });

    // Get successful checkout sessions from Stripe that might be missing
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: startTime },
      status: 'complete',
      limit: 100 // Process more with 24-hour lookback
    });

    const results = {
      processed: 0,
      creditsAdded: 0,
      errors: 0,
      fixedDiscrepancies: 0
    };

    for (const session of sessions.data) {
      try {
        results.processed++;
        
        // Only process credit purchases
        if (!session.metadata?.credits || session.metadata.type !== 'credit_purchase') {
          continue;
        }

        const userId = session.metadata.user_id;
        const creditsExpected = parseInt(session.metadata.credits);
        
        if (!userId || !creditsExpected) continue;

        // Check if transaction exists and is completed
        const { data: transaction } = await (supabase as any)
          .from('transactions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (!transaction) {
          // Missing transaction - this is the main case we're fixing
          log.warn('Cron: Missing transaction detected, initiating fix', { 
            sessionId: session.id, 
            userId, 
            credits: creditsExpected,
            paymentAmount: session.amount_total,
            sessionCreated: session.created,
            severity: 'high',
            actionTaken: 'auto_fix_missing_transaction'
          });

          // Add credits atomically
          const { data: creditResult, error: creditError } = await (supabase.rpc as any)('add_credits', {
            p_user_id: userId,
            p_credits: creditsExpected
          });

          if (creditError) {
            log.error('Cron: Failed to add missing credits', creditError, {
              sessionId: session.id,
              userId,
              credits: creditsExpected,
              severity: 'critical',
              actionRequired: 'Manual intervention required for credit addition'
            });
            results.errors++;
            continue;
          }

          // Create missing transaction record
          const { error: txError } = await (supabase as any)
            .from('transactions')
            .insert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              type: 'purchase',
              credits_delta: creditsExpected,
              amount_cents: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'completed'
            });

          if (!txError) {
            results.creditsAdded += creditsExpected;
            results.fixedDiscrepancies++;
            
            // Log successful fix with detailed context
            log.info('Cron: Successfully fixed missing payment transaction', {
              sessionId: session.id,
              userId,
              credits: creditsExpected,
              paymentAmount: session.amount_total,
              fixedAt: new Date().toISOString(),
              severity: 'resolved',
              impact: 'customer_credits_restored'
            });

            // Optionally notify user their credits were added
            // Could add email notification here
          } else {
            log.error('Cron: Failed to create transaction record', txError, {
              sessionId: session.id,
              userId,
              credits: creditsExpected,
              severity: 'critical',
              actionRequired: 'Manual transaction record creation needed'
            });
            results.errors++;
          }
        } else if (transaction.status === 'pending') {
          // Update pending transaction to completed
          const { error: updateError } = await (supabase as any)
            .from('transactions')
            .update({
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string
            })
            .eq('id', transaction.id);

          if (!updateError) {
            results.fixedDiscrepancies++;
            log.info('Cron: Updated pending transaction to completed', { 
              transactionId: transaction.id,
              sessionId: session.id,
              userId,
              fixedAt: new Date().toISOString(),
              severity: 'resolved'
            });
          } else {
            log.error('Cron: Failed to update transaction status', updateError, {
              transactionId: transaction.id,
              sessionId: session.id,
              severity: 'high',
              actionRequired: 'Manual transaction status update needed'
            });
            results.errors++;
          }
        }
      } catch (sessionError) {
        log.error('Cron: Error processing session', sessionError, {
          sessionId: session.id,
          sessionAmount: session.amount_total,
          sessionStatus: session.status,
          metadata: session.metadata,
          severity: 'high'
        });
        results.errors++;
      }
    }

    // Alert if too many errors
    if (results.errors > 5) {
      log.error('Cron: High error rate in payment reconciliation', null, {
        ...results,
        errorRate: (results.errors / results.processed) * 100,
        severity: 'critical',
        actionRequired: 'Immediate investigation of payment system',
        alertLevel: 'HIGH'
      });
      // Could send alert to admin here
    }

    const duration = Date.now() - (startTime * 1000);
    
    log.info('Cron: Payment reconciliation completed', {
      ...results,
      duration,
      timestamp: new Date().toISOString(),
      errorRate: results.processed > 0 ? (results.errors / results.processed) * 100 : 0,
      successRate: results.processed > 0 ? ((results.processed - results.errors) / results.processed) * 100 : 0
    });

    // Track reconciliation metrics
    trackPaymentReconciliation(
      results.processed,
      results.fixedDiscrepancies,
      results.errors,
      duration,
      {
        creditsAdded: results.creditsAdded,
        lookbackHours: 24
      }
    );

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} sessions, fixed ${results.fixedDiscrepancies} discrepancies`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error('Cron: Payment reconciliation failed', error);
    
    return NextResponse.json(
      { error: 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

// GET /api/cron/reconcile-payments - Health check for cron job
async function GET_Handler() {
  return NextResponse.json({
    service: 'payment-reconciliation-cron',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}

// Apply rate limiting to cron reconcile endpoints (strict to prevent abuse)
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);