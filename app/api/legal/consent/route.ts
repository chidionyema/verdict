import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { z } from 'zod';

const consentSchema = z.object({
  consent_type: z.enum(['terms', 'privacy', 'cookies', 'marketing', 'data_processing']),
  given: z.boolean(),
  version: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = consentSchema.parse(body);

    // Get client IP and user agent from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record consent
    const { data: consent, error } = await (supabase as any)
      .from('user_consents')
      .insert({
        user_id: user.id,
        consent_type: validated.consent_type,
        given: validated.given,
        version: validated.version || '1.0',
        ip_address: validated.ip_address || ip,
        user_agent: validated.user_agent || userAgent,
      })
      .select()
      .single();

    if (error) {
      log.error('Failed to record consent', error);
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      consent,
      message: 'Consent recorded successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid consent data', details: (error as any).errors },
        { status: 400 }
      );
    }

    log.error('Consent recording endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const consentType = searchParams.get('type');

    let query = (supabase as any)
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (consentType) {
      query = query.eq('consent_type', consentType);
    }

    const { data: consents, error } = await query;

    if (error) {
      log.error('Failed to fetch consents', error);
      return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 });
    }

    return NextResponse.json({ consents });

  } catch (error) {
    log.error('Get consents endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}