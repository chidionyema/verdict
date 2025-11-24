/**
 * Supabase Auth Adapter Implementation
 *
 * Wraps Supabase Auth to conform to our AuthAdapter interface.
 * This is the ONLY file that imports Supabase auth directly.
 */

import { createClient } from '@/lib/supabase/client';
import type { AuthAdapter, AuthUser, AuthSession, OAuthProvider } from './adapter';
import { normalizeUser } from './adapter';

export class SupabaseAuthAdapter implements AuthAdapter {
  private client = createClient();

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    return {
      user: data.user ? normalizeUser(data.user, 'supabase') : null,
      error: error ? new Error(error.message) : null,
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user ? normalizeUser(data.user, 'supabase') : null,
      error: error ? new Error(error.message) : null,
    };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    return {
      error: error ? new Error(error.message) : null,
    };
  }

  async signInWithOAuth(options: OAuthProvider) {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: options.provider,
      options: {
        redirectTo: options.redirectTo,
      },
    });

    return {
      url: data.url || '',
      error: error ? new Error(error.message) : null,
    };
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();

    if (!data.session || error) {
      return {
        session: null,
        error: error ? new Error(error.message) : null,
      };
    }

    return {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(data.session.expires_at! * 1000),
        user: normalizeUser(data.session.user, 'supabase'),
      },
      error: null,
    };
  }

  async getUser() {
    const { data, error } = await this.client.auth.getUser();

    return {
      user: data.user ? normalizeUser(data.user, 'supabase') : null,
      error: error ? new Error(error.message) : null,
    };
  }

  async refreshSession() {
    const { data, error } = await this.client.auth.refreshSession();

    if (!data.session || error) {
      return {
        session: null,
        error: error ? new Error(error.message) : null,
      };
    }

    return {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(data.session.expires_at! * 1000),
        user: normalizeUser(data.session.user, 'supabase'),
      },
      error: null,
    };
  }

  async resetPasswordRequest(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    return {
      error: error ? new Error(error.message) : null,
    };
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });
    return {
      error: error ? new Error(error.message) : null,
    };
  }

  async verifyEmail(token: string) {
    const { error } = await this.client.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });
    return {
      error: error ? new Error(error.message) : null,
    };
  }

  async resendVerificationEmail() {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user?.email) {
      return { error: new Error('No user email found') };
    }

    const { error } = await this.client.auth.resend({
      type: 'signup',
      email: user.email,
    });

    return {
      error: error ? new Error(error.message) : null,
    };
  }

  // MFA not implemented for Supabase in this example
  async enableMFA() {
    return {
      secret: '',
      qrCode: '',
      error: new Error('MFA not implemented for Supabase adapter'),
    };
  }

  async verifyMFA(code: string) {
    return {
      error: new Error('MFA not implemented for Supabase adapter'),
    };
  }

  async disableMFA() {
    return {
      error: new Error('MFA not implemented for Supabase adapter'),
    };
  }
}

// Singleton instance
let authAdapter: SupabaseAuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter {
  if (!authAdapter) {
    authAdapter = new SupabaseAuthAdapter();
  }
  return authAdapter;
}
