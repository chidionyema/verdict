import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['technical', 'billing', 'account', 'content', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    let query = supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        description,
        category,
        priority,
        status,
        created_at,
        updated_at,
        last_response_at,
        response_count
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Error fetching support tickets:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Support tickets error:', error);
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

    const body = await request.json();
    const validated = createTicketSchema.parse(body);

    // Create support ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: validated.subject,
        description: validated.description,
        category: validated.category,
        priority: validated.priority,
        status: 'open',
        attachments: validated.attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    // Send notification to admin (in real app, you'd use email service)
    // For now, we'll create a notification record
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id, // This would be admin user ID in real implementation
          type: 'support_ticket_created',
          title: 'New Support Ticket',
          message: `Ticket #${ticket.id}: ${validated.subject}`,
          metadata: {
            ticket_id: ticket.id,
            category: validated.category,
            priority: validated.priority,
          },
        });
    } catch (notifError) {
      // Non-critical error, log but don't fail the request
      console.warn('Failed to create notification:', notifError);
    }

    return NextResponse.json({ 
      ticket,
      message: 'Support ticket created successfully. We\'ll get back to you within 24 hours.',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}