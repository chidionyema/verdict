import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic performance metrics
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('metric_type, metric_name, value, recorded_at')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching performance metrics:', error);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      metrics: metrics || [] 
    });

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { metric_type, metric_name, value, metadata } = body;

    // Validate required fields
    if (!metric_type || !metric_name || value === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: metric_type, metric_name, value' 
      }, { status: 400 });
    }

    // Record performance metric
    const { error } = await (supabase as any)
      .from('performance_metrics')
      .insert({
        user_id: user.id,
        metric_type,
        metric_name,
        value,
        metadata: metadata || {},
        recorded_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording performance metric:', error);
      return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully'
    });

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Apply rate limiting to performance analytics endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);