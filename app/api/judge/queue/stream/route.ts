// @ts-nocheck
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/judge/queue/stream - Server-Sent Events stream for real-time request updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (err) {
          console.error('Error sending SSE data:', err);
        }
      };

      const sendError = (error: string) => {
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error })}\n\n`));
        } catch (err) {
          console.error('Error sending SSE error:', err);
        }
      };

      let interval: NodeJS.Timeout | null = null;
      let heartbeat: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        interval = null;
        heartbeat = null;
      };

      try {
        const supabase = await createClient();

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

        // Check if user is a judge
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_judge')
          .eq('id', user.id)
          .single();

        if (!profile?.is_judge) {
          sendError('Must be a judge to view requests');
          cleanup();
          controller.close();
          return;
        }

        // Send initial connection message
        send(JSON.stringify({ type: 'connected', message: 'Stream connected' }));

        // Function to fetch and send requests
        const fetchAndSendRequests = async () => {
          try {
            // Get requests the judge hasn't responded to yet
            const { data: respondedRequestIds } = await supabase
              .from('verdict_responses')
              .select('request_id')
              .eq('judge_id', user.id);

            const excludeIds = respondedRequestIds?.map((r) => r.request_id) || [];

            let query = supabase
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
              console.error('Error fetching requests:', error);
              return;
            }

            // Send the requests
            const requestsData = {
              type: 'requests',
              requests: requests || [],
              timestamp: new Date().toISOString(),
            };
            console.log('[SSE Stream] Sending requests:', requests?.length || 0);
            send(JSON.stringify(requestsData));
          } catch (err) {
            console.error('Error in fetchAndSendRequests:', err);
          }
        };

        // Send initial data
        await fetchAndSendRequests();

        // Set up polling interval (every 3 seconds)
        interval = setInterval(async () => {
          await fetchAndSendRequests();
        }, 3000);

        // Keep connection alive with heartbeat
        heartbeat = setInterval(() => {
          send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
        }, 30000); // Every 30 seconds

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          cleanup();
          try {
            controller.close();
          } catch (err) {
            // Ignore errors on close
          }
        });

      } catch (error) {
        console.error('SSE stream error:', error);
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

