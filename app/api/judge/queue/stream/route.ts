import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sseConnectionRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { log } from '@/lib/logger';

// Track active connections per user to prevent multiple connections
const activeConnections = new Map<string, { timestamp: number; controller: ReadableStreamDefaultController }>();

// Maximum connection duration: 5 minutes (forces reconnect to prevent memory buildup)
const MAX_CONNECTION_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/judge/queue/stream - Server-Sent Events stream for real-time request updates
export async function GET(request: NextRequest) {
  // Auth check BEFORE creating stream - prevents unauthorized connections
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting check
  const rateLimitCheck = await checkRateLimit(sseConnectionRateLimiter, user.id);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.error },
      {
        status: 429,
        headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
      }
    );
  }

  // Check if user is a judge before creating stream
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_judge')
    .eq('id', user.id)
    .single();

  if (!profile?.is_judge) {
    return NextResponse.json({ error: 'Must be a judge to view requests' }, { status: 403 });
  }

  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (err) {
          log.error('Error sending SSE data', err);
        }
      };

      const sendError = (error: string) => {
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error })}\n\n`));
        } catch (err) {
          log.error('Error sending SSE error', err);
        }
      };

      let interval: NodeJS.Timeout | null = null;
      let heartbeat: NodeJS.Timeout | null = null;
      let maxDurationTimeout: NodeJS.Timeout | null = null;
      let authCheckInterval: NodeJS.Timeout | null = null;
      let userId: string | null = null;

      const cleanup = () => {
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        if (maxDurationTimeout) clearTimeout(maxDurationTimeout);
        if (authCheckInterval) clearInterval(authCheckInterval);
        interval = null;
        heartbeat = null;
        maxDurationTimeout = null;
        authCheckInterval = null;

        // Remove from active connections
        if (userId) {
          activeConnections.delete(userId);
        }
      };

      try {
        // User and judge status already verified before stream creation
        userId = user.id;

        // Check if user already has an active connection - close the old one
        const existingConnection = activeConnections.get(userId);
        if (existingConnection) {
          log.info('[SSE] Closing existing connection for user', { userId });
          try {
            existingConnection.controller.close();
          } catch (err) {
            // Ignore errors
          }
          activeConnections.delete(userId);
        }

        // Track this connection
        activeConnections.set(userId, { timestamp: Date.now(), controller });

        // Send initial connection message
        send(JSON.stringify({ type: 'connected', message: 'Stream connected' }));

        // Function to fetch and send requests
        const fetchAndSendRequests = async () => {
          try {
            // Get requests the judge hasn't responded to yet
            const { data: respondedRequestIds } = await (supabase as any)
              .from('verdict_responses')
              .select('request_id')
              .eq('judge_id', user.id);

            const excludeIds =
              respondedRequestIds?.map((r: any) => r.request_id) || [];

            let query = (supabase as any)
              .from('verdict_requests')
              .select(`
                id,
                created_at,
                category,
                subcategory,
                media_type,
                media_url,
                text_content,
                context,
                target_verdict_count,
                received_verdict_count,
                status
              `)
              .in('status', ['open', 'in_progress', 'pending'])
              .neq('user_id', user.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: true })
              .limit(50);

            if (excludeIds.length > 0) {
              query = query.not('id', 'in', `(${excludeIds.join(',')})`);
            }

            const { data: requests, error } = await query;

            if (error) {
              log.error('Error fetching requests', error);
              return;
            }

            // Send the requests
            const requestsData = {
              type: 'requests',
              requests: requests || [],
              timestamp: new Date().toISOString(),
            };
            log.debug('[SSE Stream] Sending requests', { count: requests?.length || 0 });
            send(JSON.stringify(requestsData));
          } catch (err) {
            log.error('Error in fetchAndSendRequests', err);
          }
        };

        // Send initial data
        await fetchAndSendRequests();

        // Set up polling interval (every 30 seconds to reduce DB load at scale)
        interval = setInterval(async () => {
          await fetchAndSendRequests();
        }, 30000);

        // Keep connection alive with heartbeat
        heartbeat = setInterval(() => {
          send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
        }, 30000); // Every 30 seconds

        // Enforce maximum connection duration to prevent memory leaks
        maxDurationTimeout = setTimeout(() => {
          log.info('[SSE] Max duration reached for user, closing connection', { userId });
          send(JSON.stringify({
            type: 'reconnect',
            message: 'Connection timeout, please reconnect'
          }));
          cleanup();
          try {
            controller.close();
          } catch (err) {
            // Ignore errors
          }
        }, MAX_CONNECTION_DURATION);

        // Periodically re-validate auth and judge status (every 30 seconds)
        authCheckInterval = setInterval(async () => {
          try {
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !currentUser || currentUser.id !== userId) {
              log.info('[SSE] Auth validation failed for user, closing connection', { userId });
              sendError('Session expired');
              cleanup();
              try {
                controller.close();
              } catch (err) {
                // Ignore errors
              }
              return;
            }

            // Re-check judge status
            const { data: currentProfile } = await (supabase as any)
              .from('profiles')
              .select('is_judge')
              .eq('id', userId)
              .single();

            if (!currentProfile?.is_judge) {
              log.info('[SSE] Judge status revoked for user, closing connection', { userId });
              sendError('Judge access revoked');
              cleanup();
              try {
                controller.close();
              } catch (err) {
                // Ignore errors
              }
            }
          } catch (err) {
            log.error('[SSE] Error in auth re-validation', err);
          }
        }, 30000); // Every 30 seconds

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          log.info('[SSE] Client disconnected', { userId });
          cleanup();
          try {
            controller.close();
          } catch (err) {
            // Ignore errors on close
          }
        });

      } catch (error) {
        log.error('SSE stream error', error);
        sendError('Internal server error');
        cleanup();
        try {
          controller.close();
        } catch (err) {
          // Ignore errors on close
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

