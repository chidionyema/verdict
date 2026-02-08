import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/judge/my-responses - Get judge's submitted verdicts (with per-verdict earnings)
async function GET_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate and bound pagination params
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    const { data: responses, error } = await supabase
      .from('verdict_responses')
      .select(
        `
        id,
        created_at,
        rating,
        feedback,
        tone,
        request_id,
        verdict_requests (
          category,
          subcategory,
          media_type,
          context
        ),
        judge_earnings!inner (
          amount
        )
      `
      )
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error('Failed to fetch judge responses', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Flatten earnings into a judge_earning field (amount per verdict)
    const mapped =
      responses?.map((r: any) => ({
        ...r,
        judge_earning:
          Array.isArray(r.judge_earnings) && r.judge_earnings.length > 0
            ? Number(r.judge_earnings[0].amount ?? 0)
            : 0,
      })) || [];

    return NextResponse.json({ responses: mapped });
  } catch (error) {
    log.error('Judge my-responses endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to my-responses endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
