import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// Escape special characters for LIKE/ILIKE patterns
function escapeLikePattern(input: string): string {
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')     // Escape percent
    .replace(/_/g, '\\_');    // Escape underscore
}

// GET /api/search/suggestions - Get search suggestions and popular searches
async function GET_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const rawLimit = parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 20);

    // Escape query for LIKE pattern matching
    const escapedQuery = escapeLikePattern(query);

    // Get popular searches that match the query
    const { data: popularSearches, error: popularError } = await supabase
      .from('popular_searches')
      .select('search_query, search_count')
      .ilike('search_query', `%${escapedQuery}%`)
      .order('search_count', { ascending: false })
      .limit(limit) as { data: any[] | null; error: any };

    if (popularError) {
      log.error('Error fetching popular searches', popularError);
    }

    // Get trending tags that match the query
    const { data: trendingTags, error: tagsError } = await supabase
      .from('content_tags')
      .select('name, usage_count, category')
      .ilike('name', `%${escapedQuery}%`)
      .order('usage_count', { ascending: false })
      .limit(limit) as { data: any[] | null; error: any };

    if (tagsError) {
      log.error('Error fetching trending tags', tagsError);
    }

    // Get category suggestions
    const categories = [
      { name: 'appearance', description: 'Photos and styling' },
      { name: 'profile', description: 'Dating and professional profiles' },
      { name: 'writing', description: 'Text content and communication' },
      { name: 'decision', description: 'Life choices and purchases' },
    ];

    const categorySuggestions = categories.filter(cat => 
      cat.name.includes(query.toLowerCase()) || 
      cat.description.toLowerCase().includes(query.toLowerCase())
    );

    // Combine and format suggestions
    const suggestions = [
      // Popular searches
      ...(popularSearches || []).map((search: any) => ({
        type: 'search',
        text: search.search_query,
        popularity: search.search_count,
        category: null
      })),
      // Trending tags
      ...(trendingTags || []).map((tag: any) => ({
        type: 'tag',
        text: tag.name,
        popularity: tag.usage_count,
        category: tag.category
      })),
      // Categories
      ...categorySuggestions.map(cat => ({
        type: 'category',
        text: cat.name,
        popularity: 0,
        category: cat.name
      }))
    ];

    // Sort by relevance and popularity
    suggestions.sort((a, b) => {
      // Exact matches first
      const aExact = a.text.toLowerCase() === query.toLowerCase() ? 1 : 0;
      const bExact = b.text.toLowerCase() === query.toLowerCase() ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      // Then by popularity
      return b.popularity - a.popularity;
    });

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit),
      query,
      has_results: suggestions.length > 0
    });

  } catch (error) {
    log.error('GET /api/search/suggestions error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to search suggestions
export const GET = withRateLimit(GET_Handler, rateLimitPresets.search);