import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const replySchema = z.object({
  message: z.string().min(1).max(2000),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticketId = params.id;

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get ticket replies
    const { data: replies, error: repliesError } = await supabase
      .from('support_ticket_replies')
      .select(`
        *,
        profiles(full_name, is_admin)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    return NextResponse.json({
      ticket,
      replies: replies || [],
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const validated = replySchema.parse(body);

    // Verify user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Cannot reply to closed ticket' }, { status: 400 });
    }

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from('support_ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: validated.message,
        attachments: validated.attachments || [],
        is_from_admin: false,
      })
      .select(`
        *,
        profiles(full_name, is_admin)
      `)
      .single();

    if (replyError) {
      console.error('Error creating reply:', replyError);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    // Update ticket status and last response time
    await supabase
      .from('support_tickets')
      .update({
        status: 'waiting_for_admin',
        last_response_at: new Date().toISOString(),
        response_count: supabase.raw('response_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    return NextResponse.json({ 
      reply,
      message: 'Reply sent successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Create reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const { action } = body;

    // Verify user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (action === 'close') {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error closing ticket:', error);
        return NextResponse.json({ error: 'Failed to close ticket' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Ticket closed successfully',
      });
    }

    if (action === 'reopen') {
      if (ticket.status !== 'closed') {
        return NextResponse.json({ error: 'Ticket is not closed' }, { status: 400 });
      }

      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error reopening ticket:', error);
        return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Ticket reopened successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}