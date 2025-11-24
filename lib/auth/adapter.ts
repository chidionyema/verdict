/**
 * Auth Adapter Pattern
 *
 * This abstraction makes the auth provider swappable without touching
 * business logic throughout the app. Currently uses Supabase, but can
 * be swapped for Auth0, Clerk, custom, etc.
 */

import { User, Session } from '@supabase/supabase-js';

// Provider-agnostic types
export interface AuthUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  user: AuthUser;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'apple';
  redirectTo?: string;
}

// Auth adapter interface - any provider must implement this
export interface AuthAdapter {
  // Core auth
  signUp(email: string, password: string, metadata?: Record<string, any>): Promise<{ user: AuthUser | null; error: Error | null }>;
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;

  // OAuth
  signInWithOAuth(options: OAuthProvider): Promise<{ url: string; error: Error | null }>;

  // Session management
  getSession(): Promise<{ session: AuthSession | null; error: Error | null }>;
  getUser(): Promise<{ user: AuthUser | null; error: Error | null }>;
  refreshSession(): Promise<{ session: AuthSession | null; error: Error | null }>;

  // Password management
  resetPasswordRequest(email: string): Promise<{ error: Error | null }>;
  updatePassword(newPassword: string): Promise<{ error: Error | null }>;

  // Verification
  verifyEmail(token: string): Promise<{ error: Error | null }>;
  resendVerificationEmail(): Promise<{ error: Error | null }>;

  // MFA (optional - return not implemented error if not supported)
  enableMFA?(): Promise<{ secret: string; qrCode: string; error: Error | null }>;
  verifyMFA?(code: string): Promise<{ error: Error | null }>;
  disableMFA?(): Promise<{ error: Error | null }>;

  // Admin operations (for server-side only)
  deleteUser?(userId: string): Promise<{ error: Error | null }>;
  listUsers?(): Promise<{ users: AuthUser[]; error: Error | null }>;
}

// Helper to convert between formats
export function normalizeUser(user: any, provider: 'supabase' | 'auth0' | 'clerk'): AuthUser {
  switch (provider) {
    case 'supabase':
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at !== null,
        metadata: user.user_metadata,
        createdAt: new Date(user.created_at),
      };
    // Add other providers as needed
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
