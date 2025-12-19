import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderateContentWithAI } from '@/lib/moderation/ai-moderation';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/moderation/ai-moderate - AI-powered content moderation
const POST_Handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, imageUrl, filename, fileSize, requestId } = body;

    if (!text && !imageUrl) {
      return NextResponse.json(
        { error: 'Either text or image content is required' },
        { status: 400 }
      );
    }

    // Perform AI moderation
    const result = await moderateContentWithAI(text, imageUrl, filename, fileSize);

    // Log moderation attempt
    log.info('AI moderation request', {
      userId: user.id,
      requestId,
      approved: result.approved,
      confidence: result.confidence,
      reason: result.reason,
      hasText: !!text,
      hasImage: !!imageUrl,
    });

    // If content was flagged and requestId provided, update the request status
    if (!result.approved && requestId) {
      try {
        await (supabase as any)
          .from('verdict_requests')
          .update({
            moderation_status: 'rejected',
            moderation_reason: result.reason,
            moderation_confidence: result.confidence,
          })
          .eq('id', requestId)
          .eq('user_id', user.id); // Ensure user owns the request

        log.info('Request marked as moderation rejected', {
          requestId,
          reason: result.reason,
        });
      } catch (updateError) {
        log.error('Failed to update request moderation status', updateError);
      }
    }

    return NextResponse.json({
      approved: result.approved,
      reason: result.reason,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    log.error('AI moderation endpoint error', error);
    return NextResponse.json(
      { error: 'Moderation service unavailable' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(POST_Handler, {
  cost: 2, // Higher cost due to AI API calls
  expensive: true, // Counts against expensive operation limits
});

// GET /api/moderation/ai-moderate/status - Get moderation service status
export async function GET() {
  const status = {
    available: !!process.env.OPENAI_API_KEY,
    features: {
      textModeration: !!process.env.OPENAI_API_KEY,
      imageModeration: !!process.env.OPENAI_API_KEY,
      batchModeration: !!process.env.OPENAI_API_KEY,
    },
    fallback: 'rule-based moderation',
  };

  return NextResponse.json(status);
}