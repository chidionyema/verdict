import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentSystemHealth } from '@/lib/monitoring';
import { reconciliationManager } from '@/lib/payment-reconciliation';
import { log } from '@/lib/logger';

// GET /api/admin/payment-monitoring - Get payment system monitoring data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get monitoring data
    const [healthMetrics, reconciliationReport, paymentHealthMetrics] = await Promise.all([
      getPaymentSystemHealth(),
      reconciliationManager.analyzeDiscrepancies(24), // Last 24 hours
      reconciliationManager.getPaymentHealthMetrics()
    ]);

    // Get recent transaction statistics
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('status, type, credits_delta, amount_cents, created_at')
      .gte('created_at', yesterday);

    const transactionStats = {
      total: transactions?.length || 0,
      completed: transactions?.filter((t: any) => t.status === 'completed').length || 0,
      pending: transactions?.filter((t: any) => t.status === 'pending').length || 0,
      failed: transactions?.filter((t: any) => t.status === 'failed').length || 0,
      totalCreditsIssued: transactions?.reduce((sum: number, t: any) => sum + (t.credits_delta || 0), 0) || 0,
      totalRevenue: transactions?.reduce((sum: number, t: any) => sum + (t.amount_cents || 0), 0) || 0
    };

    log.info('Admin payment monitoring data accessed', {
      userId: user.id,
      healthMetrics,
      transactionStats,
      discrepancyCount: reconciliationReport.discrepancies.length
    });

    return NextResponse.json({
      success: true,
      data: {
        healthMetrics,
        reconciliation: {
          summary: reconciliationReport.summary,
          discrepancies: reconciliationReport.discrepancies.slice(0, 20), // Limit to 20 most recent
          recommendations: reconciliationReport.recommendations
        },
        paymentHealth: paymentHealthMetrics,
        transactions: transactionStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error('Failed to get payment monitoring data', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-monitoring/run-analysis - Manually trigger analysis
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { hoursBack = 24, autoFix = false } = body;

    log.info('Manual payment analysis triggered', {
      userId: user.id,
      hoursBack,
      autoFix
    });

    // Run analysis
    const report = await reconciliationManager.analyzeDiscrepancies(hoursBack);

    let fixResults = null;
    if (autoFix && report.discrepancies.length > 0) {
      // Only auto-fix safe discrepancies
      const safeDiscrepancies = report.discrepancies.filter(d => 
        d.type === 'missing_transaction' || d.type === 'pending_transaction'
      );
      
      if (safeDiscrepancies.length > 0) {
        fixResults = await reconciliationManager.autoFixDiscrepancies(safeDiscrepancies);
      }
    }

    log.info('Manual payment analysis completed', {
      userId: user.id,
      discrepanciesFound: report.discrepancies.length,
      autoFixApplied: !!fixResults,
      fixedCount: fixResults?.fixed || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        report,
        fixResults,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error('Failed to run payment analysis', error);
    return NextResponse.json(
      { error: 'Failed to run analysis' },
      { status: 500 }
    );
  }
}