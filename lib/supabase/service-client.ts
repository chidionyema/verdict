import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

let serviceClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseServiceClient() {
  if (!serviceClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service environment variables');
    }

    serviceClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceClientInstance;
}