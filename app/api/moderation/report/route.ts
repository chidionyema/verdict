import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// POST /api/moderation/report - Report inappropriate content
async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentType, contentId, reason, description } = await request.json();

    // Validate input
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Content type, content ID, and reason are required' },
        { status: 400 }
      );
    }

    const validContentTypes = ['request', 'verdict', 'judge'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate contentId as UUID to prevent injection
    if (!isValidUUID(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID format' },
        { status: 400 }
      );
    }

    const validReasons = ['inappropriate', 'unhelpful', 'offensive', 'spam', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const { data: existingReport } = await (supabase as any)
      .from('content_reports')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('reported_by', user.id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 409 }
      );
    }

    // Create the report
    const { data: report, error: reportError } = await (supabase as any)
      .from('content_reports')
      .insert({
        content_type: contentType,
        content_id: contentId,
        reported_by: user.id,
        reason,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (reportError) {
      log.error('Error creating content report', reportError);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    // Check if this content should be auto-hidden (handled by database trigger)
    const { data: reportCount } = await supabase
      .from('content_reports')
      .select('id', { count: 'exact' })
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('status', 'pending');

    log.info('Content report submitted', {
      reportId: report.id,
      contentType,
      contentId,
      reason,
      reportedBy: user.id,
      totalReports: reportCount?.length || 0
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully. We will review it within 24 hours.'
    }, { status: 200 });

  } catch (error) {
    log.error('Report submission error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/moderation/report - Get user's reports (for their own reference)
async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reports, error } = await supabase
      .from('content_reports')
      .select(`
        id,
        content_type,
        content_id,
        reason,
        description,
        status,
        created_at,
        reviewed_at,
        action_taken
      `)
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      log.error('Error fetching user reports', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports }, { status: 200 });

  } catch (error) {
    log.error('Get reports error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to prevent report spam
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);