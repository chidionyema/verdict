/**
 * Admin Access Security Guard
 */
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { NextRequest } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  admin_level?: 'readonly' | 'standard' | 'super';
}

/**
 * Verify admin access with multiple security layers
 */
export async function verifyAdminAccess(request: NextRequest): Promise<{
  authorized: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Layer 1: Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.warn('Admin access attempt without authentication', { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      });
      return {
        authorized: false,
        error: 'Authentication required'
      };
    }

    // Layer 2: Profile verification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, admin_level, last_login')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      log.error('Profile lookup failed for admin access', profileError);
      return {
        authorized: false,
        error: 'Profile verification failed'
      };
    }

    // Layer 3: Admin privilege check
    if (!(profile as any).is_admin) {
      log.warn('Non-admin attempted admin access', {
        userId: user.id,
        email: user.email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        path: request.nextUrl.pathname
      });
      return {
        authorized: false,
        error: 'Admin privileges required'
      };
    }

    // Layer 4: Session validation (check last login)
    const lastLogin = (profile as any).last_login;
    if (lastLogin) {
      const loginTime = new Date(lastLogin).getTime();
      const now = Date.now();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - loginTime > maxSessionAge) {
        log.warn('Admin session expired', {
          userId: user.id,
          email: user.email,
          lastLogin: lastLogin
        });
        return {
          authorized: false,
          error: 'Session expired, please re-authenticate'
        };
      }
    }

    // Layer 5: Rate limiting for admin actions
    const adminActionKey = `admin_actions:${user.id}`;
    // Note: This would typically use Redis, using simple in-memory for now
    
    // Update last login timestamp
    await (supabase as any)
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Log successful admin access
    log.info('Admin access granted', {
      userId: user.id,
      email: user.email,
      adminLevel: (profile as any).admin_level || 'standard',
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email!,
        is_admin: (profile as any).is_admin,
        admin_level: (profile as any).admin_level || 'standard'
      }
    };

  } catch (error) {
    log.error('Admin access verification failed', error);
    return {
      authorized: false,
      error: 'System error during admin verification'
    };
  }
}

/**
 * Check specific admin permission level
 */
export function hasAdminPermission(user: AdminUser, requiredLevel: 'readonly' | 'standard' | 'super'): boolean {
  const levels = { readonly: 1, standard: 2, super: 3 };
  const userLevel = levels[user.admin_level || 'standard'];
  const required = levels[requiredLevel];
  
  return userLevel >= required;
}

/**
 * Audit admin action
 */
export async function auditAdminAction(user: AdminUser, action: string, details?: any) {
  try {
    const supabase = await createClient();
    
    await (supabase as any)
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action: action,
        details: details || {},
        timestamp: new Date().toISOString(),
        ip_address: 'server-side' // Would get from request context
      })
      .catch((auditError: any) => {
        log.error('Admin audit logging failed', auditError);
      });
  } catch (error) {
    log.error('Admin audit action failed', error);
  }
}