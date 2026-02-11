import { NextRequest, NextResponse } from 'next/server';

// Analytics event types
interface AnalyticsEvent {
  type: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  [key: string]: any;
}

interface EventsBatch {
  events: AnalyticsEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EventsBatch = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events format' },
        { status: 400 }
      );
    }

    // Process events (in production, send to analytics service)
    // For now, we'll just log them in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Received events:', events.length);
      events.forEach(event => {
        console.log(`  [${event.type}]`, JSON.stringify(event, null, 2));
      });
    }

    // In production, you would:
    // 1. Validate and sanitize events
    // 2. Enrich with server-side data (IP, user agent, etc.)
    // 3. Send to analytics backend (Mixpanel, Amplitude, PostHog, etc.)

    // Example: Send to PostHog or similar
    // await sendToAnalyticsBackend(events);

    // Store in database for internal analytics
    // await storeEventsInDatabase(events);

    return NextResponse.json({ success: true, received: events.length });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

// Handle beacon requests (used during page unload)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
