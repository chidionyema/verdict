import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import crypto from 'crypto';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// Generate unsubscribe token for a user
export function generateUnsubscribeToken(userId: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const data = `${userId}:${email}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const token = hmac.digest('base64url');
  // Encode userId and email in the token for verification
  return Buffer.from(`${userId}:${email}:${token}`).toString('base64url');
}

// Verify and decode unsubscribe token
function decodeUnsubscribeToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [userId, email] = decoded.split(':');
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

// GET /api/email/unsubscribe - Handle unsubscribe link clicks
async function GET_Handler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const category = searchParams.get('category'); // Optional: specific category to unsubscribe from

    if (!token) {
      return new Response(getUnsubscribeHTML('error', 'Invalid unsubscribe link'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const decoded = decodeUnsubscribeToken(token);
    if (!decoded) {
      return new Response(getUnsubscribeHTML('error', 'Invalid or expired unsubscribe link'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const supabase = createServiceClient();
    const { userId, email } = decoded;

    // Verify user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(getUnsubscribeHTML('error', 'User not found'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Update notification preferences
    if (category) {
      // Unsubscribe from specific category
      const { data: prefs } = await (supabase
        .from('notification_preferences') as any)
        .select('categories')
        .eq('user_id', userId)
        .single();

      const updatedCategories = {
        ...((prefs as any)?.categories || {}),
        [category]: false
      };

      await (supabase
        .from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      log.info('User unsubscribed from category', { userId, category });
    } else {
      // Unsubscribe from all emails
      await (supabase
        .from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          email_enabled: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      log.info('User unsubscribed from all emails', { userId });
    }

    return new Response(getUnsubscribeHTML('success', category ? `You have been unsubscribed from ${category} emails` : 'You have been unsubscribed from all emails'), {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    log.error('Unsubscribe error', error);
    return new Response(getUnsubscribeHTML('error', 'An error occurred. Please try again later.'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// POST /api/email/unsubscribe - Handle unsubscribe form submission
async function POST_Handler(request: NextRequest) {
  try {
    const { token, category, resubscribe } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decoded = decodeUnsubscribeToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { userId } = decoded;

    if (resubscribe) {
      // Re-subscribe to emails
      await (supabase
        .from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          email_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      log.info('User resubscribed to emails', { userId });
      return NextResponse.json({ success: true, message: 'You have been resubscribed' });
    }

    if (category) {
      const { data: prefs } = await (supabase
        .from('notification_preferences') as any)
        .select('categories')
        .eq('user_id', userId)
        .single();

      const updatedCategories = {
        ...((prefs as any)?.categories || {}),
        [category]: false
      };

      await (supabase
        .from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } else {
      await (supabase
        .from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          email_enabled: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Unsubscribe POST error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to unsubscribe endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);

function getUnsubscribeHTML(status: 'success' | 'error', message: string): string {
  const bgColor = status === 'success' ? '#10B981' : '#EF4444';
  const icon = status === 'success' ? '✓' : '✕';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Verdict</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #F3F4F6;
    }
    .card {
      background: white;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${bgColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1F2937;
      margin: 0 0 16px;
      font-size: 24px;
    }
    p {
      color: #6B7280;
      margin: 0 0 24px;
      line-height: 1.6;
    }
    .link {
      color: #4F46E5;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${status === 'success' ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://verdict.app'}" class="link">
        Return to Verdict
      </a>
    </p>
  </div>
</body>
</html>
  `;
}
