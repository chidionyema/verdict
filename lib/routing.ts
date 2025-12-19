/**
 * Single Entry Point Routing Logic
 *
 * Intelligently routes users to the appropriate experience based on:
 * - Authentication status
 * - Onboarding completion
 * - Account type/tier
 * - Previous activity
 * - User preferences
 */

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  onboarding_completed: boolean;
  preferred_path?: 'community' | 'private' | null;
  credits: number;
  total_submissions: number;
  total_judgments: number;
  pricing_tier?: string | null;
  last_activity_at?: string | null;
  has_completed_tutorial?: boolean;
  role?: 'user' | 'judge' | 'admin';
  judge_verified?: boolean;
}

export interface RoutingDecision {
  destination: string;
  reason: string;
  requiresAuth?: boolean;
  onboardingStep?: string;
  params?: Record<string, string>;
}

export class SmartRouter {
  private static instance: SmartRouter;
  private supabase = createClient();

  static getInstance(): SmartRouter {
    if (!SmartRouter.instance) {
      SmartRouter.instance = new SmartRouter();
    }
    return SmartRouter.instance;
  }

  /**
   * Main routing decision engine
   */
  async determineDestination(
    requestedPath: string = '/',
    user?: User | null,
    profile?: UserProfile | null
  ): Promise<RoutingDecision> {
    
    // Handle unauthenticated users
    if (!user) {
      return this.handleUnauthenticatedUser(requestedPath);
    }

    // Get or fetch user profile
    if (!profile) {
      profile = await this.getUserProfile(user.id);
    }

    // Handle authenticated users based on their state
    return this.handleAuthenticatedUser(requestedPath, user, profile);
  }

  /**
   * Handle unauthenticated users
   */
  private handleUnauthenticatedUser(requestedPath: string): RoutingDecision {
    // Allow access to public pages
    const publicPaths = [
      '/', '/auth', '/auth/login', '/auth/signup', '/auth/reset-password',
      '/legal/terms', '/legal/privacy', '/legal/cookies', '/legal/community-guidelines',
      '/help', '/case-studies', '/become-a-judge'
    ];

    if (publicPaths.includes(requestedPath) || requestedPath.startsWith('/legal/')) {
      return {
        destination: requestedPath,
        reason: 'public_page_access'
      };
    }

    // For entry points like /start, show the choice page
    if (requestedPath === '/start' || requestedPath === '/submit' || requestedPath === '/judge') {
      return {
        destination: '/',
        reason: 'unauthenticated_user_redirect_to_landing'
      };
    }

    // Everything else requires auth
    return {
      destination: '/auth/login',
      reason: 'authentication_required',
      requiresAuth: true,
      params: { return_to: requestedPath }
    };
  }

  /**
   * Handle authenticated users
   */
  private async handleAuthenticatedUser(
    requestedPath: string,
    user: User,
    profile: UserProfile | null
  ): Promise<RoutingDecision> {
    
    if (!profile) {
      // Profile not found - edge case, redirect to onboarding
      return {
        destination: '/welcome',
        reason: 'missing_profile_redirect_to_onboarding',
        onboardingStep: 'profile_setup'
      };
    }

    // Admin users - allow access to admin routes
    if (profile.role === 'admin' && requestedPath.startsWith('/admin')) {
      return {
        destination: requestedPath,
        reason: 'admin_access_granted'
      };
    }

    // Check onboarding completion
    if (!profile.onboarding_completed) {
      return this.handleOnboardingFlow(requestedPath, profile);
    }

    // Handle main entry points for onboarded users
    return this.handleOnboardedUser(requestedPath, user, profile);
  }

  /**
   * Handle onboarding flow
   */
  private handleOnboardingFlow(requestedPath: string, profile: UserProfile): RoutingDecision {
    // Allow onboarding pages
    const onboardingPaths = ['/welcome', '/onboarding', '/auth/verify-email'];
    
    if (onboardingPaths.includes(requestedPath)) {
      return {
        destination: requestedPath,
        reason: 'onboarding_flow'
      };
    }

    // Determine next onboarding step
    const nextStep = this.getNextOnboardingStep(profile);
    
    return {
      destination: nextStep,
      reason: 'onboarding_incomplete',
      onboardingStep: nextStep
    };
  }

  /**
   * Handle fully onboarded users
   */
  private handleOnboardedUser(
    requestedPath: string,
    user: User,
    profile: UserProfile
  ): RoutingDecision {
    
    // Handle main entry points
    if (requestedPath === '/start') {
      return this.determineStartPageDestination(profile);
    }

    if (requestedPath === '/submit') {
      return this.determineSubmissionDestination(profile);
    }

    if (requestedPath === '/judge') {
      return this.determineJudgeDestination(profile);
    }

    if (requestedPath === '/dashboard' || requestedPath === '/') {
      return this.determineDashboardDestination(profile);
    }

    // For any other specific page, allow access
    return {
      destination: requestedPath,
      reason: 'direct_page_access'
    };
  }

  /**
   * Determine where to send users from /start
   */
  private determineStartPageDestination(profile: UserProfile): RoutingDecision {
    // If user has never submitted anything, show the choice page
    if (profile.total_submissions === 0) {
      return {
        destination: '/start',
        reason: 'first_time_user_choice_page'
      };
    }

    // If user has a preferred path, use it
    if (profile.preferred_path === 'community' && profile.credits > 0) {
      return {
        destination: '/submit-unified?mode=community',
        reason: 'preferred_community_path_with_credits'
      };
    }

    if (profile.preferred_path === 'private') {
      return {
        destination: '/submit-unified?mode=private',
        reason: 'preferred_private_path'
      };
    }

    // Default to choice page for returning users
    return {
      destination: '/start',
      reason: 'returning_user_choice_page'
    };
  }

  /**
   * Determine submission destination
   */
  private determineSubmissionDestination(profile: UserProfile): RoutingDecision {
    // If user has credits, suggest community path first
    if (profile.credits > 0) {
      return {
        destination: '/submit-unified?suggested=community',
        reason: 'has_credits_suggest_community'
      };
    }

    // If user has never judged, encourage earning credits
    if (profile.total_judgments === 0) {
      return {
        destination: '/earn-credits?return=/submit-unified',
        reason: 'new_user_earn_credits_first'
      };
    }

    // Show unified submission page
    return {
      destination: '/submit-unified',
      reason: 'standard_submission_flow'
    };
  }

  /**
   * Determine judge destination
   */
  private determineJudgeDestination(profile: UserProfile): RoutingDecision {
    // Check if user needs to qualify as a judge
    if (!profile.judge_verified && profile.total_judgments < 3) {
      return {
        destination: '/judge/qualify',
        reason: 'judge_qualification_required'
      };
    }

    // Send to main judging interface
    return {
      destination: '/judge',
      reason: 'qualified_judge_access'
    };
  }

  /**
   * Determine dashboard destination
   */
  private determineDashboardDestination(profile: UserProfile): RoutingDecision {
    // If user has active submissions, show my-requests
    if (profile.total_submissions > 0) {
      return {
        destination: '/my-requests',
        reason: 'user_has_submissions'
      };
    }

    // If user is active judge, show judge dashboard
    if (profile.total_judgments > 10) {
      return {
        destination: '/judge/dashboard',
        reason: 'active_judge_dashboard'
      };
    }

    // New users see the feed
    return {
      destination: '/feed',
      reason: 'new_user_discover_feed'
    };
  }

  /**
   * Get next onboarding step
   */
  private getNextOnboardingStep(profile: UserProfile): string {
    if (!profile.has_completed_tutorial) {
      return '/welcome';
    }

    // Add more onboarding steps as needed
    return '/welcome';
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select(`
          id,
          onboarding_completed,
          preferred_path,
          credits,
          total_submissions,
          total_judgments,
          pricing_tier,
          last_activity_at,
          has_completed_tutorial,
          role,
          judge_verified
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Update user preferences based on their choices
   */
  async updateUserPreferences(userId: string, preferences: {
    preferred_path?: 'community' | 'private';
    last_activity_at?: string;
  }): Promise<void> {
    try {
      await (this.supabase
        .from('profiles')
        .update as any)({
          ...preferences,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(userId: string): Promise<void> {
    try {
      await (this.supabase
        .from('profiles')
        .update as any)({
          onboarding_completed: true,
          has_completed_tutorial: true,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }
}

// Singleton instance
export const smartRouter = SmartRouter.getInstance();

// Convenience functions
export const getDestination = async (
  requestedPath: string,
  user?: User | null,
  profile?: UserProfile | null
): Promise<RoutingDecision> => {
  return smartRouter.determineDestination(requestedPath, user, profile);
};

export const updatePreferences = async (
  userId: string,
  preferences: { preferred_path?: 'community' | 'private' }
): Promise<void> => {
  return smartRouter.updateUserPreferences(userId, preferences);
};

export const completeUserOnboarding = async (userId: string): Promise<void> => {
  return smartRouter.completeOnboarding(userId);
};