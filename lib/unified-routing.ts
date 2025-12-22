/**
 * UNIFIED ROUTING SYSTEM
 * Replaces complex SmartRouter with simple, predictable logic
 * Based on user state progression, not arbitrary modes
 */

import { TERMINOLOGY, getUserState, getRecommendedAction } from './terminology';

interface UserProfile {
  id: string;
  onboarding_completed?: boolean;
  total_submissions?: number;
  total_reviews?: number;
  credits?: number;
  email_verified?: boolean;
}

export interface RoutingResult {
  destination: string;
  reason: string;
  shouldRedirect: boolean;
}

export class UnifiedRouter {
  
  /**
   * Main routing logic - single source of truth
   */
  static route(requestedPath: string, user: any, profile: UserProfile | null): RoutingResult {
    
    // Anonymous user routing
    if (!user) {
      return this.handleAnonymousUser(requestedPath);
    }
    
    // Authenticated user routing
    if (!profile) {
      return {
        destination: '/auth/setup',
        reason: 'Profile creation required',
        shouldRedirect: true
      };
    }
    
    // Email verification check
    if (!profile.email_verified && !user.email_confirmed_at) {
      return {
        destination: '/auth/verify-email',
        reason: 'Email verification required',
        shouldRedirect: true
      };
    }
    
    // Onboarding flow
    if (!profile.onboarding_completed) {
      return this.handleOnboardingFlow(requestedPath);
    }
    
    // Main application routing
    return this.handleAuthenticatedUser(requestedPath, profile);
  }
  
  /**
   * Anonymous user routing - focus on discovery and conversion
   */
  private static handleAnonymousUser(requestedPath: string): RoutingResult {
    const allowedAnonymousPaths = [
      '/',
      '/explore', 
      '/how-it-works',
      '/auth/login',
      '/auth/signup',
      '/privacy',
      '/terms'
    ];
    
    if (allowedAnonymousPaths.includes(requestedPath)) {
      return {
        destination: requestedPath,
        reason: 'Anonymous access allowed',
        shouldRedirect: false
      };
    }
    
    // Redirect attempts to access protected features
    if (requestedPath.startsWith('/create') || requestedPath.startsWith('/submit')) {
      return {
        destination: '/auth/signup?intent=create',
        reason: 'Sign up required to create requests',
        shouldRedirect: true
      };
    }
    
    if (requestedPath.startsWith('/review') || requestedPath.startsWith('/feed')) {
      return {
        destination: '/explore',
        reason: 'View community content without account',
        shouldRedirect: true
      };
    }
    
    // Default: redirect to landing
    return {
      destination: '/',
      reason: 'Default anonymous destination',
      shouldRedirect: true
    };
  }
  
  /**
   * Onboarding flow - single path to completion through creation
   */
  private static handleOnboardingFlow(requestedPath: string): RoutingResult {
    // ONLY allow /create for onboarding - immediate value
    if (requestedPath === '/create') {
      return {
        destination: '/create?onboarding=true',
        reason: 'Onboarding through creation',
        shouldRedirect: false
      };
    }
    
    // Allow logout during onboarding
    if (requestedPath === '/auth/logout') {
      return {
        destination: requestedPath,
        reason: 'Logout allowed',
        shouldRedirect: false
      };
    }
    
    // All other requests redirect to create - single onboarding path
    return {
      destination: '/create?onboarding=true',
      reason: 'Single onboarding path through creation',
      shouldRedirect: true
    };
  }
  
  /**
   * Authenticated user routing - progressive feature access
   */
  private static handleAuthenticatedUser(requestedPath: string, profile: UserProfile): RoutingResult {
    const userState = getUserState(profile);
    
    // Allow all basic paths for authenticated users
    const alwaysAllowedPaths = [
      '/',
      '/dashboard',
      '/create', 
      '/review',
      '/settings',
      '/help',
      '/auth/logout'
    ];
    
    if (alwaysAllowedPaths.includes(requestedPath)) {
      return {
        destination: requestedPath,
        reason: 'Standard authenticated access',
        shouldRedirect: false
      };
    }
    
    // Handle specific routes
    switch (requestedPath) {
      case '/':
        // Allow authenticated users to view landing page
        return {
          destination: '/',
          reason: 'Landing page accessible to all users',
          shouldRedirect: false
        };
        
      case '/my-requests':
        // Legacy routes redirect to dashboard
        return {
          destination: '/dashboard',
          reason: 'Unified dashboard',
          shouldRedirect: true
        };
        
      case '/feed':
      case '/review':
        // All judging interfaces redirect to unified judge page
        return {
          destination: '/judge',
          reason: 'Unified judging interface',
          shouldRedirect: true
        };
        
      case '/start':
      case '/submit':
        // Legacy submission routes redirect to create
        return {
          destination: '/create',
          reason: 'Unified creation interface',
          shouldRedirect: true
        };
    }
    
    // Advanced features based on user state
    if (requestedPath.startsWith('/advanced') && userState === 'NEW') {
      return {
        destination: '/create',
        reason: 'Complete first submission to unlock advanced features',
        shouldRedirect: true
      };
    }
    
    // Default: allow the request
    return {
      destination: requestedPath,
      reason: 'Default authenticated access',
      shouldRedirect: false
    };
  }
  
  /**
   * Get smart default destination for user
   */
  static getDefaultDestination(user: any, profile: UserProfile | null): string {
    if (!user) return '/';
    if (!profile?.onboarding_completed) return '/onboarding';
    
    const userState = getUserState(profile);
    const recommendations = getRecommendedAction(userState, profile.credits || 0);
    
    // Route based on user state and recommendations
    switch (userState) {
      case 'NEW':
        return '/create'; // Guide new users to first submission
        
      case 'ONBOARDED':
        // Has submitted but not reviewed others
        return (profile.credits || 0) > 0 ? '/dashboard' : '/judge';
        
      case 'CONTRIBUTOR':
      case 'ADVANCED':
        return '/dashboard'; // Active users see dashboard
        
      default:
        return '/dashboard';
    }
  }
  
  /**
   * Helper to check if path requires specific user state
   */
  static requiresUserState(path: string): keyof typeof TERMINOLOGY.USER_STATES | null {
    if (path.startsWith('/advanced')) return 'CONTRIBUTOR';
    if (path.startsWith('/judge')) return 'ONBOARDED';
    return null;
  }
}