import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scanImageContent, batchScanImages } from '@/lib/moderation/image-scanner';
import { log } from '@/lib/logger';
import { withRateLimit } from '@/lib/api/with-rate-limit';

// POST /api/moderation/scan-images - Scan images for inappropriate content
const POST_Handler = async (request: NextRequest) => {
  try {
    // Admin/system endpoint
    const authHeader = request.headers.get('authorization');
    const systemToken = process.env.SYSTEM_API_TOKEN;
    
    if (!systemToken || authHeader !== `Bearer ${systemToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { imageUrl, batch, limit = 20 } = body;

    if (imageUrl) {
      // Single image scan
      const result = await scanImageContent(imageUrl);
      
      return NextResponse.json({
        imageUrl,
        approved: result.approved,
        reason: result.reason,
        confidence: result.confidence,
        categories: result.categories,
        processingTime: result.processingTime,
        service: result.service,
      });
    }

    if (batch) {
      // Batch scan unprocessed images
      const { data: unscannedImages, error } = await supabase
        .from('verdict_requests')
        .select('id, media_url, created_at')
        .eq('media_type', 'photo')
        .not('media_url', 'is', null)
        .is('image_scan_status', null)
        .order('created_at', { ascending: true })
        .limit(Math.min(limit, 50));

      if (error) {
        log.error('Failed to fetch unscanned images', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (!unscannedImages || unscannedImages.length === 0) {
        return NextResponse.json({
          message: 'No unscanned images found',
          processed: 0,
        });
      }

      const images = unscannedImages.map((req: any) => ({
        id: req.id,
        url: req.media_url,
      }));

      log.info('Starting batch image scan', { count: images.length });

      const results = await batchScanImages(images);

      // Update database with scan results
      const updates = results.map(({ id, result }) => ({
        id,
        image_scan_status: result.approved ? 'approved' : 'rejected',
        image_scan_reason: result.reason || null,
        image_scan_confidence: result.confidence,
        image_scan_categories: result.categories,
        image_scanned_at: new Date().toISOString(),
      }));

      // Batch update using RPC function
      const { error: updateError } = await (supabase as any).rpc('batch_update_image_scan', {
        updates,
      });

      if (updateError) {
        log.error('Failed to update image scan results', updateError);
        return NextResponse.json(
          { error: 'Failed to update scan results' },
          { status: 500 }
        );
      }

      const summary = {
        processed: results.length,
        approved: results.filter(r => r.result.approved).length,
        rejected: results.filter(r => !r.result.approved).length,
        avgProcessingTime: results.reduce((sum, r) => sum + r.result.processingTime, 0) / results.length,
        results: results.map(r => ({
          id: r.id,
          approved: r.result.approved,
          confidence: r.result.confidence,
          categories: r.result.categories,
        })),
      };

      log.info('Batch image scan completed', summary);

      return NextResponse.json(summary);
    }

    return NextResponse.json(
      { error: 'Either imageUrl or batch=true required' },
      { status: 400 }
    );

  } catch (error) {
    log.error('Image scan endpoint error', error);
    return NextResponse.json(
      { error: 'Image scan failed' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(POST_Handler, {
  cost: 5,
  expensive: true,
});

// GET /api/moderation/scan-images/stats - Get image scan statistics
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: stats } = await supabase.rpc('get_image_scan_stats');

    return NextResponse.json(stats || {
      total_images: 0,
      pending_scan: 0,
      approved: 0,
      rejected: 0,
      avg_confidence: 0,
      top_categories: [],
    });

  } catch (error) {
    log.error('Failed to get image scan stats', error);
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 500 });
  }
}