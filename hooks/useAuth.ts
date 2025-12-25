'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(options: UseAuthOptions = {}): AuthState {
  const { requireAuth = false, redirectTo = '/auth/login' } = options;
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const loadAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (userError) {
          setState(prev => ({ ...prev, loading: false, error: userError }));
          return;
        }

        if (!user && requireAuth) {
          // Redirect to login with current path as redirect param
          const currentPath = window.location.pathname;
          router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        if (user) {
          // Load profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!mounted) return;

          setState({
            user,
            profile: profile as Profile | null,
            loading: false,
            error: profileError as Error | null,
          });
        } else {
          setState({ user: null, profile: null, loading: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, error: error as Error }));
        }
      }
    };

    loadAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, loading: false, error: null });
        if (requireAuth) {
          router.push(redirectTo);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        loadAuth();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requireAuth, redirectTo, router, supabase]);

  return state;
}