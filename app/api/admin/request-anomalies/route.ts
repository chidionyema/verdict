import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/request-anomalies - list requests that look "stuck" or over-filled
export async function GET(request: NextRequest) {
  try {
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

    const { data: candidates, error } = await (supabase as any)
      .from('verdict_requests')
      .select(
        'id, user_id, status, category, target_verdict_count, received_verdict_count, created_at, updated_at'
      )
      .in('status', ['in_progress', 'open'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[admin] request-anomalies query error', error);
      return NextResponse.json(
        { error: 'Failed to fetch anomalies' },
        { status: 500 }
      );
    }

    const anomalies =
      candidates?.filter(
        (r: any) =>
          (r.received_verdict_count || 0) >= (r.target_verdict_count || 0)
      ) ?? [];

    return NextResponse.json({ requests: anomalies });
  } catch (err) {
    console.error('GET /api/admin/request-anomalies error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


