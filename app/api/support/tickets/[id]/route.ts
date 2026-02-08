import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

const replySchema = z.object({
  message: z.string().min(1).max(2000),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
  })).optional(),
});

async function GET_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Validate ticketId as UUID
    if (!isValidUUID(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID format' }, { status: 400 });
    }

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
      log.error('Failed to fetch ticket replies', repliesError);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    return NextResponse.json({
      ticket,
      replies: replies || [],
    });

  } catch (error) {
    log.error('Get ticket endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function POST_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Validate ticketId as UUID
    if (!isValidUUID(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID format' }, { status: 400 });
    }

    const body = await request.json();
    const validated = replySchema.parse(body);

    // Verify user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single() as { data: { id: string; status: string } | null; error: any };

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
      } as any)
      .select(`
        *,
        profiles(full_name, is_admin)
      `)
      .single();

    if (replyError) {
      log.error('Failed to create ticket reply', replyError);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    // Update ticket status and last response time
    await (supabase
      .from('support_tickets')
      .update as any)({
        status: 'waiting_for_admin',
        last_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    return NextResponse.json({ 
      reply,
      message: 'Reply sent successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }

    log.error('Create reply endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function PATCH_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Validate ticketId as UUID
    if (!isValidUUID(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    // Verify user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single() as { data: { id: string; status: string } | null; error: any };

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (action === 'close') {
      const { error } = await (supabase
        .from('support_tickets')
        .update as any)({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        log.error('Failed to close ticket', error);
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

      const { error } = await (supabase
        .from('support_tickets')
        .update as any)({
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        log.error('Failed to reopen ticket', error);
        return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Ticket reopened successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    log.error('Update ticket endpoint error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to ticket endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);
export const PATCH = withRateLimit(PATCH_Handler, rateLimitPresets.default);