import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

async function GET_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: articleId } = await params;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    // Validate UUID format
    if (!isValidUUID(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID format' }, { status: 400 });
    }

    // Get article
    const { data: article, error } = await supabase
      .from('help_articles')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('id', articleId)
      .eq('is_published', true)
      .single() as { data: { view_count?: number; category?: string; [key: string]: any } | null; error: any };

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment view count
    await (supabase
      .from('help_articles')
      .update as any)({ view_count: (article.view_count || 0) + 1 })
      .eq('id', articleId);

    // Get related articles
    const { data: relatedArticles } = await supabase
      .from('help_articles')
      .select('id, title, category, created_at')
      .eq('category', article.category || '')
      .eq('is_published', true)
      .neq('id', articleId)
      .limit(5);

    return NextResponse.json({
      article: {
        ...article,
        view_count: (article.view_count || 0) + 1,
      },
      related_articles: relatedArticles || [],
    });

  } catch (error) {
    log.error('Get article failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function POST_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { id: articleId } = await params;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    // Validate UUID format
    if (!isValidUUID(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'mark_helpful') {
      // Track if user already marked this article as helpful
      let userId = null;
      if (user) {
        const { data: existingFeedback } = await supabase
          .from('help_article_feedback')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .eq('feedback_type', 'helpful')
          .single();

        if (existingFeedback) {
          return NextResponse.json({ error: 'Already marked as helpful' }, { status: 400 });
        }

        userId = user.id;
      }

      // Increment helpful count
      const { error: updateError } = await (supabase.rpc as any)('increment_article_helpful_count', {
        article_id: articleId
      });

      if (updateError) {
        log.error('Failed to update helpful count', updateError, { articleId });
        return NextResponse.json({ error: 'Failed to update helpful count' }, { status: 500 });
      }

      // Record feedback if user is logged in
      if (userId) {
        await supabase
          .from('help_article_feedback')
          .insert({
            article_id: articleId,
            user_id: userId,
            feedback_type: 'helpful',
          } as any);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    log.error('Article action failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to help article endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);