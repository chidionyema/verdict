/**
 * DEPRECATED - Use UnifiedRouter from lib/unified-routing.ts
 * This file is kept for backwards compatibility during migration
 */

// Re-export from unified routing
export { UnifiedRouter as SmartRouter } from './unified-routing';
export { UnifiedRouter } from './unified-routing';

// Legacy type exports for backwards compatibility
export interface RoutingDecision {
  destination: string;
  params?: Record<string, string>;
  reason?: string;
  onboardingStep?: string;
}

export interface UserProfile {
  id: string;
  credits?: number;
  [key: string]: any;
}

// Legacy exports - will be removed
export const smartRouter = {
  determineDestination: () => {
    throw new Error('SmartRouter deprecated. Use UnifiedRouter from lib/unified-routing.ts');
  }
};

export const getDestination = (path?: string, user?: any, profile?: any): RoutingDecision => {
  console.warn('getDestination deprecated. Use UnifiedRouter.route() from lib/unified-routing.ts');
  return { destination: '/dashboard', reason: 'deprecated', params: {} };
};

export const updatePreferences = (userId: string, prefs: any): Promise<void> => {
  console.warn('updatePreferences deprecated. Handle in component logic.');
  return Promise.resolve();
};

export const completeUserOnboarding = () => {
  throw new Error('completeUserOnboarding deprecated. Handle in component logic.');
};