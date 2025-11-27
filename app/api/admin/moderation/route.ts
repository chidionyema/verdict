import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// Check if user has admin privileges using is_admin field
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error || !profile) return false;
  
  return Boolean(profile.is_admin);
}

// GET /api/admin/moderation - Get pending moderation items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all'; // 'reports', 'stuck', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');

    const results: any = {};

    // Get pending content reports
    if (type === 'all' || type === 'reports') {
      const { data: reports, error: reportsError } = await (supabase as any)
        .from('content_reports')
        .select(`
          *,
          reported_by_profile:profiles!reported_by(email),
          content_details:${type === 'reports' ? 'verdict_requests(context)' : 'verdict_requests(*)'}
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reportsError) {
        log.error('Error fetching reports', reportsError);
      } else {
        results.reports = reports || [];
      }
    }

    // Get stuck requests
    if (type === 'all' || type === 'stuck') {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: stuckRequests, error: stuckError } = await (supabase as any)
        .from('verdict_requests')
        .select(`
          *,
          user_profile:profiles!user_id(email),
          responses:verdict_responses(count)
        `)
        .in('status', ['pending', 'in_progress'])
        .or(`created_at.lt.${twentyFourHoursAgo.toISOString()},received_verdict_count.eq.0`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (stuckError) {
        log.error('Error fetching stuck requests', stuckError);
      } else {
        results.stuckRequests = stuckRequests || [];
      }
    }

    // Get auto-hidden content
    if (type === 'all' || type === 'hidden') {
      const { data: hiddenContent, error: hiddenError } = await (supabase as any)
        .from('verdict_requests')
        .select(`
          *,
          user_profile:profiles!user_id(email)
        `)
        .eq('auto_hidden', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (hiddenError) {
        log.error('Error fetching hidden content', hiddenError);
      } else {
        results.hiddenContent = hiddenContent || [];
      }
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    log.error('Admin moderation API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/moderation - Take moderation action
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, type, id, reason } = await request.json();

    if (!action || !type || !id) {
      return NextResponse.json(
        { error: 'Action, type, and id are required' },
        { status: 400 }
      );
    }

    const results: any = {};

    switch (action) {
      case 'approve_report':
        // Mark report as reviewed and dismiss
        const { error: approveError } = await (supabase as any)
          .from('content_reports')
          .update({
            status: 'dismissed',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: 'Approved - no violation found'
          })
          .eq('id', id);

        if (approveError) {
          return NextResponse.json({ error: 'Failed to approve report' }, { status: 500 });
        }

        results.message = 'Report dismissed - content approved';
        break;

      case 'ban_content':
        // Hide the content and mark reports as upheld
        if (type === 'request') {
          await (supabase as any)
            .from('verdict_requests')
            .update({
              auto_hidden: true,
              moderation_status: 'rejected',
              moderation_reason: reason || 'Violated community guidelines'
            })
            .eq('id', id);
        }

        // Update all pending reports for this content
        await (supabase as any)
          .from('content_reports')
          .update({
            status: 'upheld',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: `Content hidden - ${reason || 'Policy violation'}`
          })
          .eq('content_id', id)
          .eq('content_type', type)
          .eq('status', 'pending');

        results.message = 'Content banned and hidden';
        break;

      case 'refund_stuck':
        // Mark request as cancelled and issue refund
        const { data: request } = await (supabase as any)
          .from('verdict_requests')
          .select('user_id, credit_cost')
          .eq('id', id)
          .single();

        if (request) {
          // Update request status
          await (supabase as any)
            .from('verdict_requests')
            .update({
              status: 'cancelled',
              moderation_reason: reason || 'Refunded due to lack of judge availability'
            })
            .eq('id', id);

          // Refund credits using RPC for atomic operation
          await (supabase as any).rpc('add_credits', {
            p_user_id: request.user_id,
            p_credits: request.credit_cost || 1
          });

          // Log the refund
          await (supabase as any)
            .from('moderation_log')
            .insert({
              content_type: 'request',
              content_id: id,
              action: 'refunded',
              reason: reason || 'Stuck request refund',
              automated: false,
              moderator_id: user.id,
              metadata: { credit_amount: request.credit_cost }
            });

          results.message = `Request cancelled and ${request.credit_cost} credits refunded`;
        }
        break;

      case 'suspend_judge':
        // Suspend judge account
        await (supabase as any)
          .from('profiles')
          .update({
            judge_status: 'suspended',
            judge_status_reason: reason || 'Suspended by admin',
            judge_suspended_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          })
          .eq('id', id);

        await (supabase as any)
          .from('judge_performance')
          .update({
            status: 'suspended'
          })
          .eq('judge_id', id);

        results.message = 'Judge suspended for 7 days';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    log.info('Admin moderation action taken', {
      action,
      type,
      id,
      reason,
      adminId: user.id
    });

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    log.error('Admin moderation action error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}