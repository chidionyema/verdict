import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const pushConfigSchema = z.object({
  provider: z.enum(['firebase', 'onesignal', 'pusher']),
  config: z.object({
    server_key: z.string().min(1),
    app_id: z.string().optional(),
    cluster: z.string().optional(),
    project_id: z.string().optional(),
  }),
  notification_types: z.array(z.enum([
    'verdict_completed',
    'new_response',
    'payment_received',
    'subscription_reminder',
    'daily_digest'
  ])),
  is_active: z.boolean().default(true),
});

const sendNotificationSchema = z.object({
  user_id: z.string(),
  device_tokens: z.array(z.string()).optional(),
  notification_type: z.enum([
    'verdict_completed',
    'new_response', 
    'payment_received',
    'subscription_reminder',
    'daily_digest',
    'custom'
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.any()).optional(),
  action_url: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'push_notifications')
      .single();

    // Don't expose sensitive keys in response
    if (config?.config) {
      const sanitizedConfig = { ...config };
      sanitizedConfig.config = {
        ...sanitizedConfig.config,
        server_key: sanitizedConfig.config.server_key ? '***hidden***' : null,
      };
      return NextResponse.json({ config: sanitizedConfig });
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Push notifications config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = pushConfigSchema.parse(body);

    // Test the push notification configuration
    const testResult = await testPushConfig(validated);
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'Push notification configuration test failed', 
        details: testResult.error 
      }, { status: 400 });
    }

    // Save or update push notification configuration
    const { data: config, error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_type: 'push_notifications',
        config: validated.config,
        notification_types: validated.notification_types,
        is_active: validated.is_active,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving push notification config:', error);
      return NextResponse.json({ error: 'Failed to save push notification configuration' }, { status: 500 });
    }

    return NextResponse.json({ config, message: 'Push notification integration configured successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid push notification configuration', details: error.errors }, { status: 400 });
    }

    console.error('Push notification config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send notification endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const body = await request.json();
    const validated = sendNotificationSchema.parse(body);

    // Get push notification configuration
    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'push_notifications')
      .eq('is_active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Push notifications not configured' }, { status: 404 });
    }

    const pushConfig = config.config as any;
    
    // Check if this notification type should be sent
    if (!config.notification_types?.includes(validated.notification_type)) {
      return NextResponse.json({ message: 'Notification type not enabled' });
    }

    // Get user's device tokens if not provided
    let deviceTokens = validated.device_tokens;
    if (!deviceTokens || deviceTokens.length === 0) {
      const { data: tokens } = await supabase
        .from('user_device_tokens')
        .select('token')
        .eq('user_id', validated.user_id)
        .eq('is_active', true);
      
      deviceTokens = tokens?.map(t => t.token) || [];
    }

    if (deviceTokens.length === 0) {
      return NextResponse.json({ message: 'No device tokens found for user' });
    }

    // Send push notification
    const result = await sendPushNotification(pushConfig, {
      ...validated,
      device_tokens: deviceTokens,
    });
    
    if (!result.success) {
      console.error('Failed to send push notification:', result.error);
      return NextResponse.json({ error: 'Failed to send push notification' }, { status: 500 });
    }

    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        user_id: validated.user_id,
        notification_type: validated.notification_type,
        title: validated.title,
        body: validated.body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider: config.provider,
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Push notification sent successfully',
      sent_to_devices: deviceTokens.length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid notification data', details: error.errors }, { status: 400 });
    }

    console.error('Push notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testPushConfig(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (config.provider) {
      case 'firebase':
        return await testFirebase(config.config);
      case 'onesignal':
        return await testOneSignal(config.config);
      case 'pusher':
        return await testPusher(config.config);
      default:
        return { success: false, error: 'Unsupported push notification provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testFirebase(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Firebase FCM test - would need to validate server key format
    if (!config.server_key || config.server_key.length < 100) {
      return { success: false, error: 'Invalid Firebase server key' };
    }
    
    // In a real implementation, you'd make a test call to FCM
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testOneSignal(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.app_id || !config.server_key) {
      return { success: false, error: 'OneSignal app ID and server key required' };
    }

    // Test OneSignal API
    const response = await fetch(`https://onesignal.com/api/v1/apps/${config.app_id}`, {
      headers: {
        'Authorization': `Basic ${config.server_key}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `OneSignal API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testPusher(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.app_id || !config.server_key || !config.cluster) {
      return { success: false, error: 'Pusher app ID, server key, and cluster required' };
    }

    // Pusher test would require Pusher SDK
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendPushNotification(config: any, notificationData: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (config.provider) {
      case 'firebase':
        return await sendWithFirebase(config, notificationData);
      case 'onesignal':
        return await sendWithOneSignal(config, notificationData);
      case 'pusher':
        return await sendWithPusher(config, notificationData);
      default:
        return { success: false, error: 'Unsupported push notification provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWithFirebase(config: any, notificationData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      registration_ids: notificationData.device_tokens,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
      },
      data: {
        ...notificationData.data,
        action_url: notificationData.action_url,
      },
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${config.server_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firebase FCM error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWithOneSignal(config: any, notificationData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      app_id: config.app_id,
      include_player_ids: notificationData.device_tokens,
      headings: { en: notificationData.title },
      contents: { en: notificationData.body },
      data: notificationData.data,
      url: notificationData.action_url,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${config.server_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `OneSignal error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWithPusher(config: any, notificationData: any): Promise<{ success: boolean; error?: string }> {
  // Pusher push notifications would require specific SDK implementation
  return { success: false, error: 'Pusher push notifications not implemented' };
}