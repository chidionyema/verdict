import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { log } from '@/lib/logger';

const deletionSchema = z.object({
  reason: z.enum(['privacy_concerns', 'no_longer_needed', 'switching_services', 'other']),
  feedback: z.string().optional(),
  confirm_deletion: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = deletionSchema.parse(body);

    if (!validated.confirm_deletion) {
      return NextResponse.json({ error: 'Deletion confirmation required' }, { status: 400 });
    }

    // Check if user has any pending obligations (active subscriptions, pending payouts, etc.)
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    const obligations = [];

    // Check for active subscriptions
    const { data: activeSubscriptions } = await (supabase as any)
      .from('subscriptions')
      .select('id, plan_name, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing']);

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      obligations.push(
        `Active subscriptions: ${activeSubscriptions
          .map((s: any) => s.plan_name)
          .join(', ')}`
      );
    }

    // Check for pending judge payouts
    if (profile?.is_judge) {
      const { data: pendingPayouts } = await (supabase as any)
        .from('payouts')
        .select('id, gross_amount_cents')
        .eq('judge_id', user.id)
        .in('status', ['pending', 'processing']);

      if (pendingPayouts && pendingPayouts.length > 0) {
        const totalPending = pendingPayouts.reduce(
          (sum: number, p: any) => sum + p.gross_amount_cents,
          0
        );
        obligations.push(
          `Pending payouts: $${(totalPending / 100).toFixed(2)}`
        );
      }

      // Check for available earnings
      const { data: availableEarnings } = await (supabase.rpc as any)('get_available_payout_amount', {
        target_judge_id: user.id,
      });

      if (availableEarnings && availableEarnings > 100) { // More than $1
        obligations.push(`Available earnings: $${(availableEarnings / 100).toFixed(2)}`);
      }
    }

    // If there are obligations, don't proceed with deletion
    if (obligations.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete account with pending obligations',
        obligations,
        message: 'Please resolve these issues before requesting account deletion.'
      }, { status: 400 });
    }

    // Create deletion request
    const { data: deletionRequest, error: deletionError } = await (supabase as any)
      .from('data_deletion_requests')
      .insert({
        user_id: user.id,
        reason: validated.reason,
        feedback: validated.feedback,
        status: 'pending',
        requested_at: new Date().toISOString(),
        // Set deletion date to 30 days from now (grace period)
        scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (deletionError) {
      log.error('Error creating deletion request', deletionError, { userId: user.id });
      return NextResponse.json({ error: 'Failed to create deletion request' }, { status: 500 });
    }

    // Immediately disable the account
    await (supabase as any)
      .from('profiles')
      .update({ 
        is_active: false,
        deletion_requested_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Send notification to user (in real app, this would be an email)
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'account_deletion_requested',
        title: 'Account Deletion Requested',
        message: 'Your account deletion has been requested and will be processed in 30 days. You can cancel this request by logging in before then.',
        metadata: {
          deletion_request_id: (deletionRequest as any).id,
          scheduled_date: (deletionRequest as any).scheduled_deletion_date,
        },
      });

    return NextResponse.json({
      success: true,
      deletion_request: deletionRequest,
      message: 'Account deletion has been requested. Your account will be deleted in 30 days unless you log in to cancel.',
      grace_period_days: 30,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid deletion request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Data deletion request error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's deletion request status
    const { data: deletionRequest } = await (supabase as any)
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      has_pending_deletion: !!deletionRequest && (deletionRequest as any).status === 'pending',
      deletion_request: deletionRequest,
    });

  } catch (error) {
    log.error('Get deletion status error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cancel pending deletion request
    const { data: deletionRequest, error: cancelError } = await (supabase as any)
      .from('data_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (cancelError) {
      log.error('Error cancelling deletion request', cancelError, { userId: user.id });
      return NextResponse.json({ error: 'Failed to cancel deletion request' }, { status: 500 });
    }

    // Reactivate the account
    await (supabase as any)
      .from('profiles')
      .update({ 
        is_active: true,
        deletion_requested_at: null
      })
      .eq('id', user.id);

    // Send notification
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'account_deletion_cancelled',
        title: 'Account Deletion Cancelled',
        message: 'Your account deletion request has been cancelled. Your account is now active again.',
        metadata: {
          deletion_request_id: (deletionRequest as any)?.id,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Account deletion request has been cancelled successfully.',
    });

  } catch (error) {
    log.error('Cancel deletion error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}