// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const emailConfigSchema = z.object({
  provider: z.enum(['sendgrid', 'mailgun', 'ses']),
  api_key: z.string().min(1),
  from_email: z.string().email(),
  from_name: z.string().min(1),
  templates: z.object({
    welcome: z.string().optional(),
    verdict_completed: z.string().optional(),
    payment_received: z.string().optional(),
    monthly_digest: z.string().optional(),
  }).optional(),
  is_active: z.boolean().default(true),
});

const sendEmailSchema = z.object({
  to: z.string().email(),
  template: z.enum(['welcome', 'verdict_completed', 'payment_received', 'monthly_digest', 'custom']),
  subject: z.string().optional(),
  data: z.record(z.any()).optional(),
  custom_html: z.string().optional(),
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
      .eq('integration_type', 'email')
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
    console.error('Email config GET error:', error);
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
    const validated = emailConfigSchema.parse(body);

    // Test the email configuration
    const testResult = await testEmailConfig(validated);
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'Email configuration test failed', 
        details: testResult.error 
      }, { status: 400 });
    }

    // Save or update email configuration
    const { data: config, error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_type: 'email',
        config: {
          provider: validated.provider,
          api_key: validated.api_key,
          from_email: validated.from_email,
          from_name: validated.from_name,
          templates: validated.templates,
        },
        is_active: validated.is_active,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email config:', error);
      return NextResponse.json({ error: 'Failed to save email configuration' }, { status: 500 });
    }

    return NextResponse.json({ config, message: 'Email integration configured successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email configuration', details: error.errors }, { status: 400 });
    }

    console.error('Email config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send email endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const validated = sendEmailSchema.parse(body);

    // Get email configuration
    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'email')
      .eq('is_active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Email integration not configured' }, { status: 404 });
    }

    const emailConfig = config.config as any;
    
    // Send email based on provider
    const result = await sendEmail(emailConfig, validated);
    
    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email data', details: error.errors }, { status: 400 });
    }

    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testEmailConfig(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Test based on provider
    switch (config.provider) {
      case 'sendgrid':
        return await testSendGrid(config.api_key, config.from_email);
      case 'mailgun':
        return await testMailgun(config.api_key);
      case 'ses':
        return await testSES(config.api_key);
      default:
        return { success: false, error: 'Unsupported email provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testSendGrid(apiKey: string, fromEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `SendGrid API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testMailgun(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mailgun test would require domain configuration
    // For now, just validate the API key format
    if (!apiKey.startsWith('key-') && !apiKey.startsWith('pubkey-')) {
      return { success: false, error: 'Invalid Mailgun API key format' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testSES(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // AWS SES test would require AWS SDK
    // For now, just validate the API key format
    if (apiKey.length < 20) {
      return { success: false, error: 'Invalid AWS SES credentials' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendEmail(config: any, emailData: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (config.provider) {
      case 'sendgrid':
        return await sendWithSendGrid(config, emailData);
      case 'mailgun':
        return await sendWithMailgun(config, emailData);
      case 'ses':
        return await sendWithSES(config, emailData);
      default:
        return { success: false, error: 'Unsupported email provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWithSendGrid(config: any, emailData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html } = generateEmailContent(emailData, config.templates);
    
    const payload = {
      personalizations: [{
        to: [{ email: emailData.to }],
        subject,
      }],
      from: {
        email: config.from_email,
        name: config.from_name,
      },
      content: [{
        type: 'text/html',
        value: html,
      }],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `SendGrid error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWithMailgun(config: any, emailData: any): Promise<{ success: boolean; error?: string }> {
  // Implement Mailgun sending logic
  return { success: false, error: 'Mailgun integration not implemented' };
}

async function sendWithSES(config: any, emailData: any): Promise<{ success: boolean; error?: string }> {
  // Implement AWS SES sending logic
  return { success: false, error: 'AWS SES integration not implemented' };
}

function generateEmailContent(emailData: any, templates: any = {}): { subject: string; html: string } {
  const data = emailData.data || {};
  
  if (emailData.template === 'custom') {
    return {
      subject: emailData.subject || 'Notification from Verdict',
      html: emailData.custom_html || 'Custom email content',
    };
  }

  switch (emailData.template) {
    case 'welcome':
      return {
        subject: 'Welcome to Verdict!',
        html: `
          <h1>Welcome to Verdict, ${data.name || 'there'}!</h1>
          <p>Thank you for joining our community. Get started by submitting your first request for a verdict.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/new" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Submit Request</a>
        `,
      };

    case 'verdict_completed':
      return {
        subject: 'Your verdict is ready!',
        html: `
          <h1>Your verdict is ready</h1>
          <p>Your request "${data.title || 'Unknown'}" has received ${data.verdict_count || 0} verdicts with an average rating of ${data.average_rating || 'N/A'}/10.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/${data.request_id}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Results</a>
        `,
      };

    case 'payment_received':
      return {
        subject: 'Payment received - Thank you!',
        html: `
          <h1>Payment Received</h1>
          <p>We've received your payment of ${data.amount || '$0.00'} for ${data.credits || 0} credits.</p>
          <p>Your credits have been added to your account and you can now submit requests.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Account</a>
        `,
      };

    case 'monthly_digest':
      return {
        subject: 'Your monthly Verdict digest',
        html: `
          <h1>Monthly Digest</h1>
          <p>Here's your activity summary for this month:</p>
          <ul>
            <li>Requests submitted: ${data.requests_submitted || 0}</li>
            <li>Verdicts received: ${data.verdicts_received || 0}</li>
            <li>Average rating: ${data.average_rating || 'N/A'}/10</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a>
        `,
      };

    default:
      return {
        subject: 'Notification from Verdict',
        html: '<p>You have a new notification from Verdict.</p>',
      };
  }
}