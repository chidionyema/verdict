/**
 * Global authentication middleware for API routes
 * Prevents session expiry edge cases and provides consistent auth handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export interface AuthResult {
  user: any;
  profile: any;
  supabase: any;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  try {
    const supabase = await createClient();

    // Get user with explicit session validation
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('Authentication failed', { 
        error: authError,
        url: request.url,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
      
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Validate session is not expired
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      log.warn('Session validation failed', { error: sessionError, userId: user.id });
      
      return NextResponse.json(
        { error: 'Session expired' }, 
        { status: 401 }
      );
    }

    // Get user profile with timeout protection
    const PROFILE_TIMEOUT = 5000; // 5 seconds
    
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: profile, error: profileError } = await Promise.race([
      profilePromise,
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Profile lookup timeout')), PROFILE_TIMEOUT)
      )
    ]);

    if (profileError) {
      if (profileError.message === 'Profile lookup timeout') {
        log.error('Profile lookup timeout', null, { userId: user.id });
        return NextResponse.json(
          { error: 'System temporarily unavailable' }, 
          { status: 503 }
        );
      }
      
      log.error('Profile lookup failed', profileError, { userId: user.id });
      return NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 403 }
      );
    }

    return { user, profile, supabase };
    
  } catch (error) {
    log.error('Auth middleware error', error);
    return NextResponse.json(
      { error: 'Authentication system error' }, 
      { status: 500 }
    );
  }
}

export async function requireJudge(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }
  
  const { profile } = authResult;
  
  if (!profile.is_judge) {
    log.warn('Judge access denied', { userId: profile.id });
    return NextResponse.json(
      { error: 'Judge privileges required' }, 
      { status: 403 }
    );
  }
  
  return authResult;
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }
  
  const { profile } = authResult;
  
  if (!profile.is_admin) {
    log.warn('Admin access denied', { userId: profile.id });
    return NextResponse.json(
      { error: 'Admin privileges required' }, 
      { status: 403 }
    );
  }
  
  return authResult;
}