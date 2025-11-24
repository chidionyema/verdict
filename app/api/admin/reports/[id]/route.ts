// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/reports/[id] - Update report status and resolution
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null; error: any };

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, moderator_notes, resolution } = body;

    // Validate action
    const validActions = ['start_review', 'resolve', 'dismiss'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Validate resolution for resolve action
    if (action === 'resolve') {
      const validResolutions = ['content_removed', 'user_warned', 'user_suspended', 'no_violation', 'other'];
      if (!resolution || !validResolutions.includes(resolution)) {
        return NextResponse.json({ error: 'Valid resolution required for resolve action' }, { status: 400 });
      }
    }

    // Get the current report
    const { data: currentReport, error: fetchError } = await supabase
      .from('content_reports')
      .select('*')
      .eq('id', id)
      .single() as { data: { status: string; [key: string]: any } | null; error: any };

    if (fetchError || !currentReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Determine new status
    let newStatus = currentReport.status;
    let resolvedAt = null;

    switch (action) {
      case 'start_review':
        if (currentReport.status !== 'pending') {
          return NextResponse.json({ error: 'Report must be pending to start review' }, { status: 400 });
        }
        newStatus = 'reviewing';
        break;
      
      case 'resolve':
        if (currentReport.status !== 'reviewing') {
          return NextResponse.json({ error: 'Report must be in review to resolve' }, { status: 400 });
        }
        newStatus = 'resolved';
        resolvedAt = new Date().toISOString();
        break;
      
      case 'dismiss':
        if (currentReport.status === 'resolved' || currentReport.status === 'dismissed') {
          return NextResponse.json({ error: 'Report already closed' }, { status: 400 });
        }
        newStatus = 'dismissed';
        resolvedAt = new Date().toISOString();
        break;
    }

    // Update the report
    const updateData: Record<string, any> = {
      status: newStatus,
      moderator_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (moderator_notes) {
      updateData.moderator_notes = moderator_notes;
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (resolvedAt) {
      updateData.resolved_at = resolvedAt;
    }

    const { error: updateError } = await supabase
      .from('content_reports')
      .update(updateData as any)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    // If resolving with content removal or user action, take additional steps
    if (action === 'resolve' && resolution) {
      try {
        await handleModerationAction(supabase, currentReport, resolution, user.id, moderator_notes);
      } catch (actionError) {
        console.error('Error executing moderation action:', actionError);
        // Don't fail the report update, but log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report updated successfully',
      new_status: newStatus 
    });

  } catch (error) {
    console.error('PATCH /api/admin/reports/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleModerationAction(
  supabase: any,
  report: any,
  resolution: string,
  moderatorId: string,
  moderatorNotes?: string
) {
  const contentTable = report.reported_content_type === 'verdict_request' 
    ? 'verdict_requests' 
    : 'verdict_responses';

  switch (resolution) {
    case 'content_removed':
      // Update content moderation status
      await supabase
        .from(contentTable)
        .update({
          moderation_status: 'rejected',
          moderation_notes: moderatorNotes || 'Content removed due to report',
          moderated_at: new Date().toISOString(),
          moderated_by: moderatorId,
        })
        .eq('id', report.reported_content_id);
      
      // Add content flag
      await supabase
        .from('content_flags')
        .insert({
          content_type: report.reported_content_type,
          content_id: report.reported_content_id,
          flag_type: 'manual_review_required',
          confidence_score: 1.0,
          reviewed: true,
          reviewer_id: moderatorId,
          review_action: 'rejected',
          review_notes: 'Content removed by moderator',
        });
      break;

    case 'user_warned':
      // Get the user who created the content
      const { data: contentData } = await supabase
        .from(contentTable)
        .select('user_id')
        .eq('id', report.reported_content_id)
        .single();

      if (contentData?.user_id) {
        await supabase
          .from('user_moderation_actions')
          .insert({
            user_id: contentData.user_id,
            moderator_id: moderatorId,
            action_type: 'warning',
            reason: `Content reported: ${report.report_reason}`,
            internal_notes: moderatorNotes,
            related_content_type: report.reported_content_type,
            related_content_id: report.reported_content_id,
          });
      }
      break;

    case 'user_suspended':
      // Get the user who created the content
      const { data: suspendContentData } = await supabase
        .from(contentTable)
        .select('user_id')
        .eq('id', report.reported_content_id)
        .single();

      if (suspendContentData?.user_id) {
        // Temporary 7-day suspension
        const suspensionEnd = new Date();
        suspensionEnd.setDate(suspensionEnd.getDate() + 7);

        await supabase
          .from('profiles')
          .update({
            is_suspended: true,
            suspension_reason: `Content reported: ${report.report_reason}`,
            suspended_until: suspensionEnd.toISOString(),
          })
          .eq('id', suspendContentData.user_id);

        await supabase
          .from('user_moderation_actions')
          .insert({
            user_id: suspendContentData.user_id,
            moderator_id: moderatorId,
            action_type: 'temporary_suspension',
            duration_hours: 7 * 24,
            expires_at: suspensionEnd.toISOString(),
            reason: `Content reported: ${report.report_reason}`,
            internal_notes: moderatorNotes,
            related_content_type: report.reported_content_type,
            related_content_id: report.reported_content_id,
          });
      }
      break;

    default:
      // For 'no_violation' and 'other', just update content status to approved
      await supabase
        .from(contentTable)
        .update({
          moderation_status: 'approved',
          moderation_notes: moderatorNotes || 'Reviewed - no violation found',
          moderated_at: new Date().toISOString(),
          moderated_by: moderatorId,
        })
        .eq('id', report.reported_content_id);
      break;
  }
}