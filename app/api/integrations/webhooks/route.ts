import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['verdict.completed', 'verdict.rated', 'request.created', 'user.updated'])),
  secret: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
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

    const { data: webhooks, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    return NextResponse.json({ webhooks });

  } catch (error) {
    console.error('Webhooks GET error:', error);
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
    const validated = webhookSchema.parse(body);

    // Create webhook endpoint
    const { data: webhook, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        url: validated.url,
        events: validated.events,
        secret: validated.secret,
        name: validated.name,
        description: validated.description,
        is_active: validated.is_active,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({ webhook });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid webhook data', details: error.errors }, { status: 400 });
    }

    console.error('Webhook creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}