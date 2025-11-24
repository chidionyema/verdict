// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/reports - Get all reports for moderation
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null; error: any };

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build query
    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:profiles!content_reports_reporter_id_fkey(email)
      `)
      .order('created_at', { ascending: false });

    // Filter by status if specified
    if (status && status !== 'all') {
      if (status === 'resolved') {
        query = query.in('status', ['resolved', 'dismissed']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: reports, error: fetchError } = await query as { data: Array<{ reported_content_type: string; reported_content_id: string; reporter?: { email?: string }; [key: string]: any }> | null; error: any };

    if (fetchError) {
      console.error('Error fetching reports:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    if (!reports) {
      return NextResponse.json({ reports: [] });
    }

    // Enhance reports with content previews
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        let contentPreview = '';
        
        try {
          if (report.reported_content_type === 'verdict_request') {
            const { data: request } = await supabase
              .from('verdict_requests')
              .select('text_content, context')
              .eq('id', report.reported_content_id)
              .single() as { data: { text_content?: string; context?: string } | null };
            
            contentPreview = request?.text_content || request?.context || 'Image content';
          } else {
            const { data: response } = await supabase
              .from('verdict_responses')
              .select('feedback')
              .eq('id', report.reported_content_id)
              .single() as { data: { feedback?: string } | null };
            
            contentPreview = response?.feedback || '';
          }
        } catch (error) {
          contentPreview = 'Content not found';
        }

        return {
          ...report,
          reporter_email: report.reporter?.email || 'Unknown',
          content_preview: contentPreview.length > 200 
            ? contentPreview.substring(0, 200) + '...'
            : contentPreview,
        };
      })
    );

    return NextResponse.json({ reports: enhancedReports });

  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}