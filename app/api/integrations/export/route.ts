import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const exportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']),
  data_type: z.enum(['requests', 'responses', 'users', 'analytics']),
  filters: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    user_id: z.string().optional(),
  }).optional(),
  include_fields: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = exportSchema.parse(body);

    let data: any[] = [];
    let filename = '';

    switch (validated.data_type) {
      case 'requests':
    const { data: requests } = await exportRequests(supabase as any, validated.filters);
        data = requests || [];
        filename = `verdict_requests_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'responses':
        const { data: responses } = await exportResponses(supabase as any, validated.filters);
        data = responses || [];
        filename = `verdict_responses_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        const { data: users } = await exportUsers(supabase as any, validated.filters);
        data = users || [];
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'analytics':
        const { data: analytics } = await exportAnalytics(supabase as any, validated.filters);
        data = analytics || [];
        filename = `analytics_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    // Filter fields if specified
    if (validated.include_fields && validated.include_fields.length > 0) {
      data = data.map(item => {
        const filtered: any = {};
        validated.include_fields!.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    // Format data based on requested format
    let exportData: string | object;
    let contentType: string;
    let fileExtension: string;

    switch (validated.format) {
      case 'json':
        exportData = data;
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      case 'csv':
        exportData = convertToCSV(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'xlsx':
        // For XLSX, we'll return JSON and let the client handle Excel conversion
        exportData = data;
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // For large exports, you might want to store the file and return a download URL
    if (validated.format === 'json' || validated.format === 'xlsx') {
      return NextResponse.json({
        data: exportData,
        filename: `${filename}.${fileExtension}`,
        record_count: data.length,
      });
    } else {
      // Return CSV as download
      return new Response(exportData as string, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        },
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid export parameters', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function exportRequests(supabase: any, filters: any = {}) {
  let query = supabase
    .from('verdict_requests')
    .select(`
      id,
      category,
      subcategory,
      media_type,
      context,
      status,
      target_verdict_count,
      received_verdict_count,
      created_at,
      updated_at,
      profiles!user_id(email, full_name)
    `);

  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  return query;
}

async function exportResponses(supabase: any, filters: any = {}) {
  let query = supabase
    .from('verdict_responses')
    .select(`
      id,
      verdict_request_id,
      response_text,
      rating,
      helpful_count,
      created_at,
      profiles!judge_id(email, full_name),
      verdict_requests!verdict_request_id(category, status)
    `);

  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  return query;
}

async function exportUsers(supabase: any, filters: any = {}) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      credits,
      is_judge,
      is_admin,
      created_at,
      last_sign_in_at
    `);

  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  return query;
}

async function exportAnalytics(supabase: any, filters: any = {}) {
  // This would aggregate various metrics
  const { data: requestStats } = await supabase
    .from('verdict_requests')
    .select('category, status, created_at')
    .gte('created_at', filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .lte('created_at', filters.end_date || new Date().toISOString());

  const { data: responseStats } = await supabase
    .from('verdict_responses')
    .select('rating, created_at')
    .gte('created_at', filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .lte('created_at', filters.end_date || new Date().toISOString());

  // Aggregate the data
  const analytics = {
    request_stats: requestStats || [],
    response_stats: responseStats || [],
    summary: {
      total_requests: requestStats?.length || 0,
      total_responses: responseStats?.length || 0,
      average_rating:
        (responseStats?.reduce(
          (sum: number, r: any) => sum + (r.rating || 0),
          0
        ) || 0) / (responseStats?.length || 1),
    },
  };

  return { data: [analytics] };
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  // Create header row
  const header = allKeys.join(',');

  // Create data rows
  const rows = data.map(item => {
    return allKeys.map(key => {
      const value = item[key];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  return [header, ...rows].join('\n');
}