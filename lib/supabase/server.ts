import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

/**
 * Get the Supabase URL used by the JS client.
 *
 * IMPORTANT:
 * - Supabase JS expects an HTTP/HTTPS URL like:
 *   https://<project-ref>.supabase.co
 * - Do NOT pass a Postgres connection string (postgres://...)
 * - If SUPABASE_POOLER_URL is set to a non-HTTP URL, we ignore it
 *   and fall back to NEXT_PUBLIC_SUPABASE_URL.
 */
function getSupabaseUrl(): string {
  const poolerUrl = process.env.SUPABASE_POOLER_URL;

  // Only use pooler URL if it's a valid HTTP(S) URL
  if (poolerUrl && /^https?:\/\//.test(poolerUrl)) {
    return poolerUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    // During build, env vars may not be set - provide placeholder
    // The actual API calls will fail, but build can complete
    return 'https://placeholder.supabase.co';
  }

  return supabaseUrl;
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
}

function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
      // Connection pooling options for serverless
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pooling': 'true',
        },
      },
    }
  );
}

// Service role client for admin operations (bypasses RLS)
export function createServiceClient(): SupabaseClient<Database> {
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      // Service client shouldn't have auth state
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Check if connection pooling is properly configured
 */
export function isConnectionPoolingEnabled(): boolean {
  return !!process.env.SUPABASE_POOLER_URL;
}
