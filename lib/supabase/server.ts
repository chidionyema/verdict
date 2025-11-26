import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

/**
 * Get the Supabase URL with connection pooling for serverless environments.
 * Connection pooling reduces connection overhead in serverless/edge deployments.
 *
 * Set SUPABASE_POOLER_URL in production for better performance:
 * https://[project-ref].pooler.supabase.com
 */
function getSupabaseUrl(): string {
  // Use pooler URL if available (recommended for production serverless)
  if (process.env.SUPABASE_POOLER_URL) {
    return process.env.SUPABASE_POOLER_URL;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
