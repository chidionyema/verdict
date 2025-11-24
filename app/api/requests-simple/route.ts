import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple requests API: Starting...');
    
    const supabase = await createClient();
    console.log('Simple requests API: Supabase client created');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('Simple requests API: Auth check', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    console.log('Simple requests API: Querying for user:', user.id);

    const { data: requests, error } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    console.log('Simple requests API: Query result', { 
      requestCount: requests?.length, 
      error: error?.message 
    });

    if (error) {
      console.error('Simple requests API: Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Simple requests API: Returning success');
    return NextResponse.json({ 
      requests: requests || [],
      count: requests?.length || 0,
      user_id: user.id
    });

  } catch (error) {
    console.error('Simple requests API: Catch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}