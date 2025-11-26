// @ts-nocheck
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/requests/[id]/stream - SSE stream for a single request's verdict progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (err) {
          console.error('Error sending SSE data (request stream):', err);
        }
      };

      const sendError = (error: string) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error })}\n\n`
            )
          );
        } catch (err) {
          console.error('Error sending SSE error (request stream):', err);
        }
      };

      let interval: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (interval) clearInterval(interval);
        interval = null;
      };

      try {
        const { id } = await params;
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

        // Fetch the request and check access (same rules as /api/requests/[id])
        const { data: verdictRequest, error: requestError } = await supabase
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
          // Not owner – allow judges/admins to watch, mirroring API route
          const { data: profile } = await supabase
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

        // Poll for updates every 3 seconds (cheap, single-row query)
        interval = setInterval(async () => {
          try {
            const { data: latest, error: latestError } = await supabase
              .from('verdict_requests')
              .select(
                'id, status, received_verdict_count, target_verdict_count, updated_at'
              )
              .eq('id', id)
              .single();

            if (latestError || !latest) {
              console.error(
                '[SSE Request Stream] Error fetching latest request:',
                latestError
              );
              return;
            }

            sendSnapshot(latest);

            // Optionally stop streaming once completed / cancelled
            if (
              latest.status === 'completed' ||
              latest.status === 'cancelled'
            ) {
              cleanup();
              try {
                controller.close();
              } catch {
                // ignore
              }
            }
          } catch (err) {
            console.error('[SSE Request Stream] Poll error:', err);
          }
        }, 3000);

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
        console.error('SSE /api/requests/[id]/stream error:', error);
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
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}


