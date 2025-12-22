/**
 * UNIFIED TERMINOLOGY SYSTEM
 * Single source of truth for all platform language
 * Eliminates confusion across components
 */

export const TERMINOLOGY = {
  // Primary Actions
  PRIMARY_ACTION: 'Get Feedback',
  SECONDARY_ACTION: 'Help Others & Earn',
  
  // Request Types  
  REQUEST_TYPES: {
    FEEDBACK: 'Feedback Request',
    COMPARISON: 'A/B Comparison', 
    SPLIT_TEST: 'Demographic Test'
  },
  
  // User States (Progressive, not modes)
  USER_STATES: {
    NEW: 'new',           // First visit
    ONBOARDED: 'active',  // Completed first submission
    CONTRIBUTOR: 'helper', // Actively reviewing others
    ADVANCED: 'power'     // Using paid features
  },
  
  // Credit System
  CREDITS: {
    DISPLAY_NAME: 'Credits',
    EARN_ACTION: 'Earn Credits',
    SPEND_ACTION: 'Use Credits',
    BALANCE_LABEL: 'Available Credits'
  },
  
  // Navigation Labels
  NAV: {
    HOME: 'Dashboard', 
    CREATE: 'Get Feedback',
    JUDGE: 'Judge & Earn',
    PROFILE: 'My Account'
  },
  
  // Submission Tiers (Clear pricing, not confusing paths)
  TIERS: {
    QUICK: {
      name: 'Quick Review',
      description: '3 reviews in 30 minutes',
      cost: '1 credit or $2'
    },
    STANDARD: {
      name: 'Standard Review', 
      description: '5 detailed reviews in 2 hours',
      cost: '2 credits or $5'
    },
    COMPREHENSIVE: {
      name: 'Comprehensive Review',
      description: '10 expert reviews in 1 hour',
      cost: '4 credits or $12'
    }
  },
  
  // Help System
  HELP: {
    EARN_CREDITS: 'How to earn credits',
    GETTING_STARTED: 'Getting started',
    QUALITY_GUIDELINES: 'Review guidelines'
  }
} as const;

/**
 * Helper function to get consistent labels
 */
export function getLabel(category: keyof typeof TERMINOLOGY, key?: string): string {
  if (!key) return String(TERMINOLOGY[category]);
  
  const section = TERMINOLOGY[category] as any;
  return section?.[key] || `${category}.${key}`;
}

/**
 * User state progression logic
 */
export function getUserState(profile: {
  total_submissions?: number;
  total_reviews?: number; 
  credits?: number;
}): keyof typeof TERMINOLOGY.USER_STATES {
  if (!profile.total_submissions) return 'NEW';
  if (!profile.total_reviews) return 'ONBOARDED';
  if (profile.total_reviews >= 5) return 'CONTRIBUTOR';
  return 'ADVANCED';
}

/**
 * Next action recommendations based on state
 */
export function getRecommendedAction(userState: string, credits: number = 0) {
  switch (userState) {
    case 'NEW':
      return {
        primary: 'Submit your first request',
        secondary: 'See how it works',
        cta: TERMINOLOGY.PRIMARY_ACTION
      };
      
    case 'ONBOARDED':
      return {
        primary: credits > 0 ? 'Submit another request' : 'Earn credits by helping others',
        secondary: credits > 0 ? 'Help others earn more credits' : 'Buy credits for instant feedback',
        cta: credits > 0 ? TERMINOLOGY.PRIMARY_ACTION : TERMINOLOGY.SECONDARY_ACTION
      };
      
    case 'CONTRIBUTOR':
      return {
        primary: 'Submit request or help others',
        secondary: 'Explore advanced features',
        cta: 'Continue'
      };
      
    case 'ADVANCED':
      return {
        primary: 'Create advanced request',
        secondary: 'Review queue available',
        cta: 'Create'
      };
      
    default:
      return {
        primary: TERMINOLOGY.PRIMARY_ACTION,
        secondary: TERMINOLOGY.SECONDARY_ACTION,
        cta: 'Start'
      };
  }
}