import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build, env vars may not be set - provide placeholder values
  // The client won't be used during build anyway
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that throws on actual usage during build
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
