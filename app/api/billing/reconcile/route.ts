import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { log } from '@/lib/logger';

// POST /api/billing/reconcile - Reconcile payments between Stripe and our database
export async function POST(request: NextRequest) {
  try {
    // Only allow admin users to trigger reconciliation
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!(profile as any)?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (isDemoMode() || !stripe) {
      return NextResponse.json({ 
        success: true, 
        demo: true,
        message: 'Demo mode - reconciliation would be performed'
      });
    }

    const { hours = 24 } = await request.json();
    const startTime = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);

    log.info('Starting payment reconciliation', { hoursBack: hours, startTime });

    // Get all successful checkout sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: startTime },
      status: 'complete',
      limit: 100 // Process in batches
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
        
        // Skip non-credit purchases
        if (!session.metadata?.credits) continue;

        const userId = session.metadata.user_id;
        const creditsExpected = parseInt(session.metadata.credits);
        
        if (!userId || !creditsExpected) continue;

        // Check if we have a transaction record
        const { data: transaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (!transaction) {
          // Missing transaction - create it and add credits
          log.warn('Missing transaction record, creating...', { 
            sessionId: session.id, 
            userId, 
            credits: creditsExpected 
          });

          // Add credits atomically
          const { data: creditResult, error: creditError } = await (supabase.rpc as any)('add_credits', {
            p_user_id: userId,
            p_credits: creditsExpected
          });

          if (creditError) {
            log.error('Failed to add missing credits', creditError);
            results.errors++;
            continue;
          }

          // Create transaction record
          const { error: txError } = await (supabase
            .from('transactions')
            .insert as any)({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              type: 'purchase',
              credits_delta: creditsExpected,
              amount_cents: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'completed'
            });

          if (txError) {
            log.error('Failed to create transaction record', txError);
            results.errors++;
            continue;
          }

          results.creditsAdded += creditsExpected;
          results.fixedDiscrepancies++;
          
          log.info('Fixed missing transaction', {
            sessionId: session.id,
            userId,
            credits: creditsExpected
          });
        } else if ((transaction as any).status !== 'completed') {
          // Transaction exists but not completed - update status
          log.warn('Updating incomplete transaction', { 
            transactionId: (transaction as any).id,
            currentStatus: (transaction as any).status 
          });

          const { error: updateError } = await (supabase
            .from('transactions')
            .update as any)({
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string
            })
            .eq('id', (transaction as any).id);

          if (!updateError) {
            results.fixedDiscrepancies++;
            log.info('Fixed transaction status', { transactionId: (transaction as any).id });
          } else {
            log.error('Failed to update transaction status', updateError);
            results.errors++;
          }
        }
      } catch (sessionError) {
        log.error('Error processing session during reconciliation', sessionError, {
          sessionId: session.id
        });
        results.errors++;
      }
    }

    log.info('Payment reconciliation completed', results);

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} sessions, fixed ${results.fixedDiscrepancies} discrepancies`
    });

  } catch (error) {
    log.error('Payment reconciliation failed', error);
    
    return NextResponse.json(
      { error: 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

// GET /api/billing/reconcile - Get reconciliation status and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!(profile as any)?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get recent transactions that might need reconciliation
    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get successful transactions from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      pendingTransactions: pendingTransactions || [],
      recentTransactions: recentTransactions || [],
      stats: {
        pendingCount: pendingTransactions?.length || 0,
        recentCount: recentTransactions?.length || 0
      }
    });

  } catch (error) {
    log.error('Failed to get reconciliation status', error);
    
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}