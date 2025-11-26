import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// GET /api/discover - Get discovery content (trending, featured, popular)
export async function GET(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    const url = new URL(request.url);
    const section = url.searchParams.get('section') || 'all'; // 'featured', 'trending', 'popular', 'all'

    const results: Record<string, unknown> = {};

    // Get featured content
    if (section === 'featured' || section === 'all') {
      const { data: featured } = await supabase
        .from('verdict_requests')
        .select(`
          id,
          category,
          subcategory,
          context,
          media_type,
          media_url,
          text_content,
          status,
          created_at,
          view_count,
          featured,
          user_id,
          profiles!verdict_requests_user_id_fkey(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get average ratings for featured content
      if (featured && featured.length > 0) {
        const featuredIds = featured.map((r: any) => r.id);
        const { data: ratings } = await supabase
          .from('verdict_responses')
          .select('request_id, rating')
          .in('request_id', featuredIds)
          .not('rating', 'is', null);

        const ratingsByRequest =
          ratings?.reduce((acc: Record<string, number[]>, rating: any) => {
            if (!acc[rating.request_id]) acc[rating.request_id] = [];
            acc[rating.request_id].push(rating.rating);
            return acc;
          }, {} as Record<string, number[]>) || {};

        results.featured = featured.map((request: any) => ({
          ...request,
          average_rating: ratingsByRequest[request.id]
            ? ratingsByRequest[request.id].reduce(
                (sum: number, r: number) => sum + r,
                0
              ) / ratingsByRequest[request.id].length
            : null,
          response_count: ratingsByRequest[request.id]?.length || 0,
          preview_text: request.text_content 
            ? request.text_content.substring(0, 150) + (request.text_content.length > 150 ? '...' : '')
            : request.context.substring(0, 150) + (request.context.length > 150 ? '...' : ''),
        }));
      } else {
        results.featured = [];
      }
    }

    // Get trending content (most viewed in last 7 days)
    if (section === 'trending' || section === 'all') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: trending } = await supabase
        .from('verdict_requests')
        .select(`
          id,
          category,
          subcategory,
          context,
          media_type,
          media_url,
          text_content,
          status,
          created_at,
          view_count,
          user_id,
          profiles!verdict_requests_user_id_fkey(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('view_count', { ascending: false })
        .limit(10);

      results.trending =
        trending?.map((request: any) => ({
        ...request,
        preview_text: request.text_content 
          ? request.text_content.substring(0, 150) + (request.text_content.length > 150 ? '...' : '')
          : request.context.substring(0, 150) + (request.context.length > 150 ? '...' : ''),
      })) || [];
    }

    // Get popular categories
    if (section === 'popular' || section === 'all') {
      const { data: categoryStats } = await supabase
        .from('verdict_requests')
        .select('category')
        .eq('is_public', true)
        .eq('moderation_status', 'approved');

      const categoryCounts =
        categoryStats?.reduce((acc: Record<string, number>, request: any) => {
          acc[request.category] = (acc[request.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const popularCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      results.popular_categories = popularCategories;

      // Get popular tags
      const { data: popularTags } = await supabase
        .from('content_tags')
        .select('name, usage_count, category, description')
        .order('usage_count', { ascending: false })
        .limit(12);

      results.popular_tags = popularTags || [];
    }

    // Get recent activity for "all" section
    if (section === 'all') {
      const { data: recent } = await supabase
        .from('verdict_requests')
        .select(`
          id,
          category,
          subcategory,
          context,
          media_type,
          created_at,
          view_count,
          user_id,
          profiles!verdict_requests_user_id_fkey(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8);

      results.recent_activity = recent?.map((request: any) => ({
        ...request,
        preview_text: request.context.substring(0, 100) + (request.context.length > 100 ? '...' : ''),
      })) || [];

      // Get popular searches
      const { data: popularSearches } = await supabase
        .from('popular_searches')
        .select('search_query, search_count')
        .order('search_count', { ascending: false })
        .limit(10);

      results.popular_searches = popularSearches || [];
    }

    // Add metadata
    results.metadata = {
      section,
      generated_at: new Date().toISOString(),
      cache_duration: 300 // 5 minutes
    };

    return NextResponse.json(results);

  } catch (error) {
    log.error('GET /api/discover error:', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}