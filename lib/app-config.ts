/**
 * Centralized Application Configuration
 * Single source of truth for critical business values
 */

export const APP_CONFIG = {
  // Credit economy
  CREDITS: {
    JUDGMENTS_PER_CREDIT: 3,
    CREDITS_PER_SUBMISSION: 1,
    ESTIMATED_TIME_PER_JUDGMENT: '5 min',
    ESTIMATED_TOTAL_TIME: '15 minutes', // JUDGMENTS_PER_CREDIT * ESTIMATED_TIME_PER_JUDGMENT
  },
  
  // Feedback system
  FEEDBACK: {
    REPORTS_PER_SUBMISSION: 3,
    MIN_FEEDBACK_LENGTH: 50,
    MAX_FEEDBACK_LENGTH: 500,
  },
  
  // Base pricing configuration (now handled by localization)
  PRICING: {
    JUDGE_PAYOUT_USD_CENTS: 75,        // $0.75 per judge (base rate)
  },
  
  // Timing (now handled by localization for consistent messaging)
  DELIVERY: {
    PRIVATE_MAX_HOURS: 2,
    COMMUNITY_AVG_HOURS: 4,
  },
  
  // Quality thresholds
  QUALITY: {
    MIN_JUDGE_RATING: 4.0,
    MIN_FEEDBACK_HELPFULNESS: 0.8,
    AUTO_APPROVE_THRESHOLD: 0.95,
  },
  
  // Gamification
  GAMIFICATION: {
    DAILY_STREAK_BONUS: 0.1,      // 10% bonus for streaks
    QUALITY_BONUS_THRESHOLD: 4.5,  // Rating threshold for bonuses
    BADGE_UNLOCK_INTERVALS: [10, 25, 50, 100, 250, 500], // Judgment milestones
  },
  
  // UI/UX
  UX: {
    AUTO_SAVE_INTERVAL_MS: 3000,   // Auto-save drafts every 3 seconds
    NOTIFICATION_DELAY_MS: 5000,   // Show notifications for 5 seconds
    LANDING_PAGE_MAX_SECTIONS: 10, // Reduce from current 15+
    MOBILE_BREAKPOINT: 768,        // px
  },
  
  // Features flags
  FEATURES: {
    SOCIAL_LOGIN_ENABLED: false,
    REFERRAL_PROGRAM_ENABLED: false,
    VOICE_FEEDBACK_ENABLED: true,
    A_B_TESTING_ENABLED: false,
    EMAIL_NOTIFICATIONS_ENABLED: false,
  },
  
  // Business rules
  RULES: {
    MAX_ACTIVE_SUBMISSIONS: 3,
    CREDIT_EXPIRY_DAYS: 365,
    JUDGE_COOLDOWN_HOURS: 24,      // Can't judge same user within 24h
    MIN_ACCOUNT_AGE_HOURS: 1,      // New accounts wait 1h before judging
  }
} as const;

// Computed values (non-localized only)
export const COMPUTED_CONFIG = {
  // Dynamic text for UI (localization-agnostic)
  CREDIT_ECONOMY_TEXT: `${APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT} reviews = 1 credit`,
  TIME_COMMITMENT_TEXT: `~${APP_CONFIG.CREDITS.ESTIMATED_TOTAL_TIME}`,
  JUDGE_EARNING_TEXT: `Judge ${APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT} → Earn credit → Free`,
  FEEDBACK_GUARANTEE_TEXT: `Get ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} feedback reports`,
  
  // Feature availability
  isFeatureEnabled: (feature: keyof typeof APP_CONFIG.FEATURES) => APP_CONFIG.FEATURES[feature],
} as const;

// Note: Pricing and delivery messaging now handled by /lib/localization.ts

// Type exports for TypeScript
export type AppConfig = typeof APP_CONFIG;
export type ComputedConfig = typeof COMPUTED_CONFIG;