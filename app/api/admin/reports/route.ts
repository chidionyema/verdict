import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/admin/reports - Get all reports for moderation
async function GET_Handler(request: NextRequest) {
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
      .single() as { data: { is_admin: boolean } | null; error: unknown };

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

    const { data: reports, error: fetchError } = await query as { data: Array<{ content_type: string; content_id: string; reporter?: { email?: string }; [key: string]: unknown }> | null; error: unknown };

    if (fetchError) {
      log.error('Error fetching reports', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    if (!reports) {
      return NextResponse.json({ reports: [] });
    }

    // BULLETPROOF: Use bulk queries instead of N+1 pattern to prevent DoS
    const requestIds = reports
      .filter(r => r.content_type === 'verdict_request' || r.content_type === 'request')
      .map(r => r.content_id);
    
    const responseIds = reports
      .filter(r => r.content_type === 'verdict_response' || r.content_type === 'response')
      .map(r => r.content_id);
    
    // Bulk fetch all request content
    const requestsMap = new Map();
    if (requestIds.length > 0) {
      const { data: requests } = await supabase
        .from('verdict_requests')
        .select('id, text_content, context')
        .in('id', requestIds);
      
      requests?.forEach((req: any) => {
        requestsMap.set(req.id, req);
      });
    }
    
    // Bulk fetch all response content  
    const responsesMap = new Map();
    if (responseIds.length > 0) {
      const { data: responses } = await supabase
        .from('verdict_responses')
        .select('id, feedback')
        .in('id', responseIds);
      
      responses?.forEach((resp: any) => {
        responsesMap.set(resp.id, resp);
      });
    }
    
    // Enhance reports with cached content
    const enhancedReports = reports.map(report => {
      let contentPreview = '';
      
      if (report.content_type === 'verdict_request' || report.content_type === 'request') {
        const request = requestsMap.get(report.content_id);
        contentPreview = request?.text_content || request?.context || 'Image content';
      } else {
        const response = responsesMap.get(report.content_id);
        contentPreview = response?.feedback || 'Content not found';
      }
      
      return {
        ...report,
        reporter_email: report.reporter?.email || 'Unknown',
        content_preview: contentPreview.length > 200 
          ? contentPreview.substring(0, 200) + '...'
          : contentPreview,
      };
    });

    return NextResponse.json({ reports: enhancedReports });

  } catch (error) {
    log.error('GET /api/admin/reports error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to admin reports endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);