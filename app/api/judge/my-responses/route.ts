// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/judge/my-responses - Get judge's submitted verdicts
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: responses, error } = await supabase
      .from('verdict_responses')
      .select(`
        id,
        created_at,
        rating,
        feedback,
        tone,
        request_id,
        verdict_requests (
          category,
          subcategory,
          media_type
        )
      `)
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch responses error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses: responses || [] });
  } catch (error) {
    console.error('GET /api/judge/my-responses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
