import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/search - Search verdict requests with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    
    // Extract search parameters
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || null;
    const status = url.searchParams.get('status') || null;
    const sortBy = url.searchParams.get('sort') || 'relevance';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Get user info for analytics
    const { data: { user } } = await supabase.auth.getUser();

    // Perform search using the database function
    const { data: results, error: searchError } = await supabase
      .rpc('search_requests', {
        search_query: query,
        filter_category: category,
        filter_status: status,
        sort_by: sortBy,
        limit_count: limit,
        offset_count: offset
      });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Get total count for pagination (simplified)
    const { count: totalCount } = await supabase
      .from('verdict_requests')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('moderation_status', 'approved')
      .ilike('category', category ? `%${category}%` : '%')
      .ilike('status', status ? `%${status}%` : '%');

    // Track search analytics
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0] || 'unknown';

    await supabase.rpc('track_search', {
      user_id: user?.id || null,
      search_query: query,
      search_filters: JSON.stringify({ category, status, sort: sortBy }),
      results_count: results?.length || 0,
      request_ip: clientIp,
      request_user_agent: userAgent,
      session_id: null // Could implement session tracking
    });

    // Format results
    const formattedResults = results?.map(result => ({
      ...result,
      preview_text: result.text_content 
        ? result.text_content.substring(0, 200) + (result.text_content.length > 200 ? '...' : '')
        : result.context.substring(0, 200) + (result.context.length > 200 ? '...' : ''),
      search_score: result.search_rank
    })) || [];

    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / limit),
        has_more: (offset + limit) < (totalCount || 0)
      },
      filters_applied: {
        query,
        category,
        status,
        sort: sortBy
      }
    });

  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}