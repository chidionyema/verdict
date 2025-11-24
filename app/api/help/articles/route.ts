import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  author_id: z.string().uuid().optional(),
});

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { q, category, page, limit } = searchSchema.parse({
      q: searchParams.get('q'),
      category: searchParams.get('category'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const supabase = createClient();

    let query = supabase
      .from('help_articles')
      .select(`
        id,
        title,
        content,
        category,
        tags,
        is_featured,
        view_count,
        helpful_count,
        created_at,
        updated_at,
        profiles(full_name)
      `)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (q) {
      query = query.or(`title.ilike.%${q}%, content.ilike.%${q}%, tags.cs.{${q}}`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Error fetching help articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Get categories for filtering
    const { data: categories } = await supabase
      .from('help_articles')
      .select('category')
      .eq('is_published', true)
      .order('category');

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      categories: uniqueCategories,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.errors }, { status: 400 });
    }

    console.error('Help articles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createArticleSchema.parse(body);

    // Create article
    const { data: article, error } = await supabase
      .from('help_articles')
      .insert({
        title: validated.title,
        content: validated.content,
        category: validated.category,
        tags: validated.tags || [],
        is_featured: validated.is_featured || false,
        author_id: validated.author_id || user.id,
        is_published: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating help article:', error);
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }

    return NextResponse.json({ article });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Create article error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}