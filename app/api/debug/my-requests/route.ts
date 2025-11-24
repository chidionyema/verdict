// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message,
        user_id: null
      }, { status: 401 });
    }

    console.log('Debug: Fetching requests for user:', user.id);

    // Direct query without cache or rate limiting
    const { data: requests, error, count } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('Debug: Query result:', { requests, error, count });

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        user_id: user.id
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      requests: requests || [],
      count: count || 0,
      total_found: requests?.length || 0
    });

  } catch (error) {
    console.error('Debug requests error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}