import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sseConnectionRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { log } from '@/lib/logger';

// Maximum connection duration: 5 minutes (forces reconnect to prevent memory buildup)
const MAX_CONNECTION_DURATION = 5 * 60 * 1000;

// GET /api/requests/[id]/stream - SSE stream for a single request's verdict progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Pre-auth rate limiting check
  const supabasePreCheck = await createClient();
  const { data: { user: preCheckUser }, error: preAuthError } = await supabasePreCheck.auth.getUser();

  if (!preAuthError && preCheckUser) {
    const rateLimitCheck = await checkRateLimit(sseConnectionRateLimiter, preCheckUser.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
        }
      );
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Connection closed
        }
      };

      const sendError = (error: string) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error })}\n\n`
            )
          );
        } catch {
          // Connection closed
        }
      };

      let interval: NodeJS.Timeout | null = null;
      let maxDurationTimeout: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (interval) clearInterval(interval);
        if (maxDurationTimeout) clearTimeout(maxDurationTimeout);
        interval = null;
        maxDurationTimeout = null;
      };

      try {
        const { id } = await params;
        const supabase: any = await createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          sendError('Unauthorized');
          cleanup();
          controller.close();
          return;
        }

        // Fetch the request and check access
        const { data: verdictRequest, error: requestError } = await (supabase as any)
          .from('verdict_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (requestError || !verdictRequest) {
          sendError('Request not found');
          cleanup();
          controller.close();
          return;
        }

        if (verdictRequest.user_id !== user.id) {
          // Not owner – allow judges/admins to watch
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('is_judge, is_admin')
            .eq('id', user.id)
            .single();

          if (!profile?.is_judge && !profile?.is_admin) {
            sendError('Forbidden');
            cleanup();
            controller.close();
            return;
          }
        }

        const sendSnapshot = (requestRow: any) => {
          const payload = {
            type: 'snapshot',
            request: {
              id: requestRow.id,
              status: requestRow.status,
              received_verdict_count: requestRow.received_verdict_count,
              target_verdict_count: requestRow.target_verdict_count,
              updated_at: requestRow.updated_at,
            },
            timestamp: new Date().toISOString(),
          };
          send(JSON.stringify(payload));
        };

        // Send initial snapshot
        sendSnapshot(verdictRequest);

        // Poll for updates every 30 seconds (reduced from 3s to minimize DB load at scale)
        interval = setInterval(async () => {
          try {
            const { data: latest, error: latestError } = await (supabase as any)
              .from('verdict_requests')
              .select(
                'id, status, received_verdict_count, target_verdict_count, updated_at'
              )
              .eq('id', id)
              .single();

            if (latestError || !latest) {
              return;
            }

            sendSnapshot(latest);

            // Stop streaming once closed/cancelled (schema uses 'closed', not 'completed')
            if (latest.status === 'closed' || latest.status === 'cancelled') {
              cleanup();
              try {
                controller.close();
              } catch {
                // ignore
              }
            }
          } catch {
            // Poll error - continue trying
          }
        }, 30000);

        // Enforce maximum connection duration
        maxDurationTimeout = setTimeout(() => {
          send(JSON.stringify({
            type: 'reconnect',
            message: 'Connection timeout, please reconnect'
          }));
          cleanup();
          try {
            controller.close();
          } catch {
            // ignore
          }
        }, MAX_CONNECTION_DURATION);

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          cleanup();
          try {
            controller.close();
          } catch {
            // ignore
          }
        });
      } catch (error) {
        log.error('SSE /api/requests/[id]/stream error', error);
        sendError('Internal server error');
        cleanup();
        try {
          controller.close();
        } catch {
          // ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
