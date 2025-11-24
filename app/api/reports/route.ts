import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/reports - Create a content report
export async function POST(request: NextRequest) {
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
    const { 
      content_type, 
      content_id, 
      report_reason, 
      report_description 
    } = body;

    // Validate required fields
    if (!content_type || !content_id || !report_reason) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id, report_reason' }, 
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['verdict_request', 'verdict_response'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content_type. Must be verdict_request or verdict_response' }, 
        { status: 400 }
      );
    }

    // Validate report reason
    const validReasons = [
      'inappropriate_content', 
      'harassment', 
      'spam', 
      'illegal_content', 
      'personal_information', 
      'copyright_violation',
      'other'
    ];
    if (!validReasons.includes(report_reason)) {
      return NextResponse.json(
        { error: 'Invalid report_reason' }, 
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (report_description && report_description.length > 1000) {
      return NextResponse.json(
        { error: 'Report description must be 1000 characters or less' }, 
        { status: 400 }
      );
    }

    // Check if user has already reported this content
    const { data: existingReport } = await supabase
      .from('content_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_content_type', content_type)
      .eq('reported_content_id', content_id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' }, 
        { status: 400 }
      );
    }

    // Verify the content exists
    const contentTable = content_type === 'verdict_request' ? 'verdict_requests' : 'verdict_responses';
    const { data: contentExists } = await supabase
      .from(contentTable)
      .select('id')
      .eq('id', content_id)
      .single();

    if (!contentExists) {
      return NextResponse.json(
        { error: 'Content not found' }, 
        { status: 404 }
      );
    }

    // Create the report
    const { data: report, error: insertError } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        reported_content_type: content_type,
        reported_content_id: content_id,
        report_reason,
        report_description: report_description || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Auto-flag content for review
    await supabase
      .from('content_flags')
      .insert({
        content_type,
        content_id,
        flag_type: 'user_reported',
        confidence_score: 0.8,
        reviewed: false
      });

    return NextResponse.json({ 
      success: true, 
      report_id: report.id,
      message: 'Report submitted successfully. Our moderation team will review it.'
    });

  } catch (error) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reports - Get user's reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's reports
    const { data: reports, error: fetchError } = await supabase
      .from('content_reports')
      .select(`
        id,
        created_at,
        reported_content_type,
        reported_content_id,
        report_reason,
        report_description,
        status,
        resolution,
        resolved_at
      `)
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching reports:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}