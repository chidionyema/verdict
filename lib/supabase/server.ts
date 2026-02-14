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

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    // During build, env vars may not be set - provide placeholder
    // The actual API calls will fail, but build can complete
    if (typeof window !== 'undefined') {
      // Runtime error in browser
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }
    return 'https://placeholder.supabase.co';
  }

  return supabaseUrl;
}

function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey || anonKey === 'placeholder-anon-key') {
    if (typeof window !== 'undefined') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    }
    return 'placeholder-anon-key';
  }
  return anonKey;
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not set - service client will not work');
  }
  return key || '';
}

/**
 * Check if service key is properly configured (not just present, but valid).
 */
export function hasServiceKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  // Reject placeholder values
  if (key === 'your-service-role-key' || key.startsWith('placeholder')) return false;
  // Service keys are JWTs, should be reasonably long
  if (key.length < 100) return false;
  return true;
}

/**
 * Get service client or throw if not properly configured.
 * Use this when service client is REQUIRED (e.g., user initialization).
 */
export function requireServiceClient(): SupabaseClient<Database> {
  if (!hasServiceKey()) {
    throw new Error(
      '[Supabase] SUPABASE_SERVICE_ROLE_KEY is not properly configured. ' +
      'User initialization requires a valid service role key to bypass RLS.'
    );
  }
  return createServiceClient();
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
