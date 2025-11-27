import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// POST /api/admin/requests/[id]/status - update a request status with audit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, note } = body;

    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status; must be completed or cancelled.' },
        { status: 400 }
      );
    }

    // Load current request
    const { data: current, error: fetchError } = await (supabase as any)
      .from('verdict_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update status
    const { data: updated, error: updateError } = await (supabase as any)
      .from('verdict_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      log.error('Admin update request status failed', updateError, { requestId: id });
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      );
    }

    // Write audit log
    await (supabase as any).from('admin_request_actions').insert({
      admin_id: user.id,
      request_id: id,
      old_status: current.status,
      new_status: status,
      note: note || null,
    });

    return NextResponse.json({ request: updated });
  } catch (err) {
    log.error('Admin request status endpoint error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


