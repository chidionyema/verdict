// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const slackConfigSchema = z.object({
  webhook_url: z.string().url(),
  channel: z.string().optional(),
  events: z.array(z.enum(['verdict_completed', 'new_user', 'high_rating', 'report_submitted'])),
  is_active: z.boolean().default(true),
});

const slackNotificationSchema = z.object({
  type: z.enum(['verdict_completed', 'new_user', 'high_rating', 'report_submitted']),
  data: z.object({
    request_id: z.string().optional(),
    user_id: z.string().optional(),
    rating: z.number().optional(),
    report_id: z.string().optional(),
    message: z.string().optional(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'slack')
      .single();

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Slack config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = slackConfigSchema.parse(body);

    // Test the webhook URL
    const testResult = await testSlackWebhook(validated.webhook_url, validated.channel);
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'Slack webhook test failed', 
        details: testResult.error 
      }, { status: 400 });
    }

    // Save or update Slack configuration
    const { data: config, error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_type: 'slack',
        config: {
          webhook_url: validated.webhook_url,
          channel: validated.channel,
          events: validated.events,
        },
        is_active: validated.is_active,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Slack config:', error);
      return NextResponse.json({ error: 'Failed to save Slack configuration' }, { status: 500 });
    }

    return NextResponse.json({ config, message: 'Slack integration configured successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid Slack configuration', details: error.errors }, { status: 400 });
    }

    console.error('Slack config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send notification endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const validated = slackNotificationSchema.parse(body);

    // Get Slack configuration
    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'slack')
      .eq('is_active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Slack integration not configured' }, { status: 404 });
    }

    // Check if this event type is enabled
    const slackConfig = config.config as any;
    if (!slackConfig.events.includes(validated.type)) {
      return NextResponse.json({ message: 'Event type not enabled for Slack' });
    }

    // Format message based on event type
    const message = formatSlackMessage(validated.type, validated.data);
    
    // Send to Slack
    const result = await sendSlackMessage(slackConfig.webhook_url, message, slackConfig.channel);
    
    if (!result.success) {
      console.error('Failed to send Slack message:', result.error);
      return NextResponse.json({ error: 'Failed to send Slack notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Slack notification sent' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid notification data', details: error.errors }, { status: 400 });
    }

    console.error('Slack notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testSlackWebhook(webhookUrl: string, channel?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      text: 'Verdict integration test - configuration successful! 🎉',
      channel: channel || undefined,
      username: 'Verdict Bot',
      icon_emoji: ':white_check_mark:',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendSlackMessage(
  webhookUrl: string, 
  message: string, 
  channel?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      text: message,
      channel: channel || undefined,
      username: 'Verdict Bot',
      icon_emoji: ':scales:',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function formatSlackMessage(type: string, data: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verdict.app';
  
  switch (type) {
    case 'verdict_completed':
      return `✅ *Verdict Completed*\n` +
             `Request ID: ${data.request_id}\n` +
             `Average Rating: ${data.rating || 'N/A'}/10\n` +
             `<${baseUrl}/requests/${data.request_id}|View Request>`;

    case 'new_user':
      return `👋 *New User Registered*\n` +
             `User joined the Verdict community!\n` +
             `<${baseUrl}/admin|View Admin Dashboard>`;

    case 'high_rating':
      return `⭐ *High Rating Alert*\n` +
             `Request received a ${data.rating}/10 rating!\n` +
             `Request ID: ${data.request_id}\n` +
             `<${baseUrl}/requests/${data.request_id}|View Request>`;

    case 'report_submitted':
      return `🚨 *Content Report Submitted*\n` +
             `Report ID: ${data.report_id}\n` +
             `${data.message ? `Message: ${data.message}` : ''}\n` +
             `<${baseUrl}/admin/reports|Review Reports>`;

    default:
      return `📢 *Verdict Notification*\n${data.message || 'Event occurred'}`;
  }
}