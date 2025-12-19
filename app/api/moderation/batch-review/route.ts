import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { batchModerateContent } from '@/lib/moderation/ai-moderation';
import { log } from '@/lib/logger';
import { withRateLimit } from '@/lib/api/with-rate-limit';

// POST /api/moderation/batch-review - Batch process unmoderated content
const POST_Handler = async (request: NextRequest) => {
  try {
    // This is an admin/system endpoint
    const authHeader = request.headers.get('authorization');
    const systemToken = process.env.SYSTEM_API_TOKEN;
    
    if (!systemToken || authHeader !== `Bearer ${systemToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { limit = 50, dryRun = false } = body;

    // Get unmoderated content
    const { data: pendingRequests, error } = await supabase
      .from('verdict_requests')
      .select('id, context, text_content, media_url')
      .is('moderation_status', null)
      .order('created_at', { ascending: true })
      .limit(Math.min(limit, 100)); // Cap at 100 for safety

    if (error) {
      log.error('Failed to fetch pending moderation requests', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({
        message: 'No pending requests found',
        processed: 0,
        results: [],
      });
    }

    // Prepare items for batch moderation
    const items = pendingRequests.map((req: any) => ({
      id: req.id,
      text: req.context || req.text_content || '',
      imageUrl: req.media_url,
    }));

    log.info('Starting batch moderation', {
      requestCount: items.length,
      dryRun,
    });

    // Perform batch moderation
    const results = await batchModerateContent(items);

    if (!dryRun) {
      // Update moderation status in database
      const updates = results.map(({ id, result }) => ({
        id,
        moderation_status: result.approved ? 'approved' : 'rejected',
        moderation_reason: result.reason || null,
        moderation_confidence: result.confidence,
        moderated_at: new Date().toISOString(),
      }));

      // Batch update using RPC function
      const { error: updateError } = await (supabase as any).rpc('batch_update_moderation', {
        updates,
      });

      if (updateError) {
        log.error('Failed to update moderation results', updateError);
        return NextResponse.json(
          { error: 'Failed to update moderation results' },
          { status: 500 }
        );
      }

      log.info('Batch moderation completed', {
        processed: results.length,
        approved: results.filter(r => r.result.approved).length,
        rejected: results.filter(r => !r.result.approved).length,
      });
    }

    // Return summary
    const summary = {
      processed: results.length,
      approved: results.filter(r => r.result.approved).length,
      rejected: results.filter(r => !r.result.approved).length,
      dryRun,
      results: dryRun ? results : results.map(r => ({
        id: r.id,
        approved: r.result.approved,
        confidence: r.result.confidence,
      })),
    };

    return NextResponse.json(summary);

  } catch (error) {
    log.error('Batch moderation endpoint error', error);
    return NextResponse.json(
      { error: 'Batch moderation failed' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(POST_Handler, {
  cost: 10,
  expensive: true,
});

// GET /api/moderation/batch-review/stats - Get moderation statistics
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: stats } = await supabase.rpc('get_moderation_stats');

    return NextResponse.json(stats || {
      total_requests: 0,
      pending_moderation: 0,
      approved: 0,
      rejected: 0,
      avg_confidence: 0,
    });

  } catch (error) {
    log.error('Failed to get moderation stats', error);
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 500 });
  }
}