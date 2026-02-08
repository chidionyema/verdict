import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
});

// GET /api/integrations/email - Check email configuration status
async function GET_Handler() {
  try {
    const supabase: any = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const isConfigured = !!process.env.RESEND_API_KEY;

    return NextResponse.json({
      provider: 'resend',
      configured: isConfigured,
      from_email: process.env.RESEND_FROM_EMAIL || 'Not configured',
    });
  } catch (error) {
    log.error('Email config GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/integrations/email - Send an email (admin only)
async function POST_Handler(request: NextRequest) {
  try {
    const supabase: any = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = sendEmailSchema.parse(body);

    const result = await sendEmail({
      to: validated.to,
      subject: validated.subject,
      html: validated.html,
      text: validated.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Email send error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/integrations/email - Send email (for internal use by notifications)
// SECURITY: This endpoint requires admin authentication to prevent unauthorized email sending
async function PUT_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Handle custom template format from legacy notifications
    if (body.template === 'custom' && body.custom_html) {
      const result = await sendEmail({
        to: body.to,
        subject: body.subject || 'Notification from Verdict',
        html: body.custom_html,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, id: result.id });
    }

    // Standard email format
    const validated = sendEmailSchema.parse(body);
    const result = await sendEmail(validated);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Email PUT error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to email endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
export const PUT = withRateLimit(PUT_Handler, rateLimitPresets.strict);
