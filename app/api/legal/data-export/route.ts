import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect all user data across tables
    const userData: any = {
      export_info: {
        user_id: user.id,
        export_date: new Date().toISOString(),
        export_type: 'complete_data_export',
      }
    };

    // Profile data
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      userData.profile = profile;
    }

    // Verdict requests
    const { data: requests } = await (supabase as any)
      .from('verdict_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.verdict_requests = requests || [];

    // Verdict responses (as a judge)
    const { data: responses } = await (supabase as any)
      .from('verdict_responses')
      .select('*')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false });

    userData.verdict_responses = responses || [];

    // Transactions
    const { data: transactions } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.transactions = transactions || [];

    // Notifications
    const { data: notifications } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.notifications = notifications || [];

    // Support tickets
    const { data: supportTickets } = await (supabase as any)
      .from('support_tickets')
      .select(`
        *,
        support_ticket_replies(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.support_tickets = supportTickets || [];

    // Consents
    const { data: consents } = await (supabase as any)
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.consents = consents || [];

    // Payment methods (without sensitive data)
    const { data: paymentMethods } = await (supabase as any)
      .from('payment_methods')
      .select('id, type, card_brand, card_last4, is_default, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.payment_methods = paymentMethods || [];

    // Subscriptions
    const { data: subscriptions } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    userData.subscriptions = subscriptions || [];

    // Judge-specific data
    if ((profile as any)?.is_judge) {
      // Earnings
      const { data: earnings } = await (supabase as any)
        .from('judge_earnings')
        .select('*')
        .eq('judge_id', user.id)
        .order('created_at', { ascending: false });

      userData.judge_earnings = earnings || [];

      // Payouts
      const { data: payouts } = await (supabase as any)
        .from('payouts')
        .select('*')
        .eq('judge_id', user.id)
        .order('created_at', { ascending: false });

      userData.payouts = payouts || [];

      // Payout accounts (without sensitive data)
      const { data: payoutAccounts } = await (supabase as any)
        .from('judge_payout_accounts')
        .select('id, account_type, charges_enabled, payouts_enabled, verification_status, created_at')
        .eq('judge_id', user.id);

      userData.payout_accounts = payoutAccounts || [];
    }

    // Create export record
    const { error: exportError } = await (supabase as any)
      .from('data_exports')
      .insert({
        user_id: user.id,
        export_type: 'complete',
        status: 'completed',
        record_count: Object.keys(userData).length - 1, // Exclude export_info from count
      });

    if (exportError) {
      console.warn('Failed to record export:', exportError);
      // Don't fail the request if we can't record the export
    }

    // Return data as JSON
    return NextResponse.json({
      success: true,
      data: userData,
      summary: {
        profile_included: !!profile,
        verdict_requests_count: userData.verdict_requests.length,
        verdict_responses_count: userData.verdict_responses.length,
        transactions_count: userData.transactions.length,
        notifications_count: userData.notifications.length,
        support_tickets_count: userData.support_tickets.length,
        consents_count: userData.consents.length,
        is_judge: (profile as any)?.is_judge || false,
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    
    // Record failed export attempt
    try {
      const supa = await createClient();
      const {
        data: { user },
      } = await supa.auth.getUser();
      
      if (user) {
        await (supa as any)
          .from('data_exports')
          .insert({
            user_id: user.id,
            export_type: 'complete',
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
      }
    } catch (recordError) {
      console.warn('Failed to record export failure:', recordError);
    }

    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's export history
    const { data: exports, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching export history:', error);
      return NextResponse.json({ error: 'Failed to fetch export history' }, { status: 500 });
    }

    return NextResponse.json({ exports });

  } catch (error) {
    console.error('Get exports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}