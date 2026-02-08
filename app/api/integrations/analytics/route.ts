import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

const analyticsConfigSchema = z.object({
  provider: z.enum(['mixpanel', 'amplitude', 'segment']),
  api_key: z.string().min(1),
  project_id: z.string().optional(),
  events: z.array(z.enum([
    'user_signup',
    'request_created',
    'verdict_submitted',
    'payment_completed',
    'subscription_created',
    'subscription_cancelled'
  ])),
  properties: z.object({
    track_user_properties: z.boolean().default(true),
    track_request_details: z.boolean().default(true),
    track_payment_info: z.boolean().default(false),
  }),
  is_active: z.boolean().default(true),
});

const trackEventSchema = z.object({
  event_name: z.string().min(1),
  user_id: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().optional(),
});

async function GET_Handler(request: NextRequest) {
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

    const { data: config } = await (supabase as any)
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'analytics')
      .single();

    // Don't expose API keys in response
    if (config?.config) {
      const sanitizedConfig = { ...config };
      sanitizedConfig.config = {
        ...sanitizedConfig.config,
        api_key: sanitizedConfig.config.api_key ? '***hidden***' : null,
      };
      return NextResponse.json({ config: sanitizedConfig });
    }

    return NextResponse.json({ config });

  } catch (error) {
    log.error('Analytics config GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function POST_Handler(request: NextRequest) {
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
    const validated = analyticsConfigSchema.parse(body);

    // Test the analytics configuration
    const testResult = await testAnalyticsConfig(validated);
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'Analytics configuration test failed', 
        details: testResult.error 
      }, { status: 400 });
    }

    // Save or update analytics configuration
    const { data: config, error } = await (supabase as any)
      .from('integration_configs')
      .upsert({
        integration_type: 'analytics',
        config: {
          provider: validated.provider,
          api_key: validated.api_key,
          project_id: validated.project_id,
          events: validated.events,
          properties: validated.properties,
        },
        is_active: validated.is_active,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      log.error('Error saving analytics config', error);
      return NextResponse.json({ error: 'Failed to save analytics configuration' }, { status: 500 });
    }

    return NextResponse.json({ config, message: 'Analytics integration configured successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid analytics configuration', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Analytics config error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Track event endpoint - REQUIRES AUTH
async function PUT_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();

    // SECURITY: Require authentication for event tracking
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = trackEventSchema.parse(body);

    // Get analytics configuration
    const { data: config } = await (supabase as any)
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'analytics')
      .eq('is_active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Analytics integration not configured' }, { status: 404 });
    }

    const analyticsConfig = config.config as any;
    
    // Check if this event should be tracked
    if (!analyticsConfig.events.includes(validated.event_name)) {
      return NextResponse.json({ message: 'Event not configured for tracking' });
    }
    
    // Track event based on provider
    const result = await trackEvent(analyticsConfig, validated);
    
    if (!result.success) {
      log.error('Failed to track event', new Error(result.error));
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Event tracked successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Analytics tracking error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testAnalyticsConfig(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Test based on provider
    switch (config.provider) {
      case 'mixpanel':
        return await testMixpanel(config.api_key, config.project_id);
      case 'amplitude':
        return await testAmplitude(config.api_key);
      case 'segment':
        return await testSegment(config.api_key);
      default:
        return { success: false, error: 'Unsupported analytics provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testMixpanel(apiKey: string, projectId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Test Mixpanel with a dummy event
    const testEvent = {
      event: 'config_test',
      properties: {
        distinct_id: 'test_user',
        time: Date.now(),
        test: true,
      },
    };

    const data = Buffer.from(JSON.stringify([testEvent])).toString('base64');
    
    const response = await fetch(`https://api.mixpanel.com/track/?data=${data}&api_key=${apiKey}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return { success: false, error: `Mixpanel API error: ${response.status}` };
    }

    const result = await response.json();
    if (result.status !== 1) {
      return { success: false, error: 'Mixpanel test event failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testAmplitude(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testEvent = {
      user_id: 'test_user',
      event_type: 'config_test',
      time: Date.now(),
      event_properties: {
        test: true,
      },
    };

    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        events: [testEvent],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Amplitude API error: ${response.status}` };
    }

    const result = await response.json();
    if (result.code !== 200) {
      return { success: false, error: 'Amplitude test event failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testSegment(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testEvent = {
      userId: 'test_user',
      event: 'Config Test',
      properties: {
        test: true,
      },
      timestamp: new Date().toISOString(),
    };

    const credentials = Buffer.from(apiKey + ':').toString('base64');

    const response = await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(testEvent),
    });

    if (!response.ok) {
      return { success: false, error: `Segment API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function trackEvent(config: any, eventData: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (config.provider) {
      case 'mixpanel':
        return await trackWithMixpanel(config, eventData);
      case 'amplitude':
        return await trackWithAmplitude(config, eventData);
      case 'segment':
        return await trackWithSegment(config, eventData);
      default:
        return { success: false, error: 'Unsupported analytics provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function trackWithMixpanel(config: any, eventData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const event = {
      event: eventData.event_name,
      properties: {
        distinct_id: eventData.user_id || 'anonymous',
        time: eventData.timestamp ? new Date(eventData.timestamp).getTime() : Date.now(),
        ...eventData.properties,
      },
    };

    const data = Buffer.from(JSON.stringify([event])).toString('base64');
    
    const response = await fetch(`https://api.mixpanel.com/track/?data=${data}&api_key=${config.api_key}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Mixpanel error: ${response.status} ${errorText}` };
    }

    const result = await response.json();
    if (result.status !== 1) {
      return { success: false, error: 'Mixpanel event tracking failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function trackWithAmplitude(config: any, eventData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const event = {
      user_id: eventData.user_id || 'anonymous',
      event_type: eventData.event_name,
      time: eventData.timestamp ? new Date(eventData.timestamp).getTime() : Date.now(),
      event_properties: eventData.properties,
    };

    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.api_key,
        events: [event],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Amplitude error: ${response.status} ${errorText}` };
    }

    const result = await response.json();
    if (result.code !== 200) {
      return { success: false, error: 'Amplitude event tracking failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function trackWithSegment(config: any, eventData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const event = {
      userId: eventData.user_id || 'anonymous',
      event: eventData.event_name,
      properties: eventData.properties,
      timestamp: eventData.timestamp || new Date().toISOString(),
    };

    const credentials = Buffer.from(config.api_key + ':').toString('base64');

    const response = await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Segment error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Apply rate limiting to analytics endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);
export const PUT = withRateLimit(PUT_Handler, rateLimitPresets.default);