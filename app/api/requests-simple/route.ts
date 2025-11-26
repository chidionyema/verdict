import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    log.info('Simple requests API: Starting...');

    const supabase = await createClient();
    log.debug('Simple requests API: Supabase client created');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    log.debug('Simple requests API: Auth check', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    log.debug('Simple requests API: Querying for user', { userId: user.id });

    const { data: requests, error } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    log.debug('Simple requests API: Query result', {
      requestCount: requests?.length,
      error: error?.message
    });

    if (error) {
      log.error('Simple requests API: Database error', error, {
        code: error.code,
        userId: user.id
      });
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    log.info('Simple requests API: Returning success', { count: requests?.length || 0 });
    return NextResponse.json({
      requests: requests || [],
      count: requests?.length || 0,
      user_id: user.id
    });

  } catch (error) {
    log.error('Simple requests API: Catch error', error, {
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}