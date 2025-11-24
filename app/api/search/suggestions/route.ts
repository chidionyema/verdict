// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/search/suggestions - Get search suggestions and popular searches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

    // Get popular searches that match the query
    const { data: popularSearches, error: popularError } = await supabase
      .from('popular_searches')
      .select('search_query, search_count')
      .ilike('search_query', `%${query}%`)
      .order('search_count', { ascending: false })
      .limit(limit);

    if (popularError) {
      console.error('Error fetching popular searches:', popularError);
    }

    // Get trending tags that match the query
    const { data: trendingTags, error: tagsError } = await supabase
      .from('content_tags')
      .select('name, usage_count, category')
      .ilike('name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (tagsError) {
      console.error('Error fetching trending tags:', tagsError);
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
      ...(popularSearches || []).map(search => ({
        type: 'search',
        text: search.search_query,
        popularity: search.search_count,
        category: null
      })),
      // Trending tags
      ...(trendingTags || []).map(tag => ({
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
    console.error('GET /api/search/suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}