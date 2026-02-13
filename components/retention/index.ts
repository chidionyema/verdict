// Retention & Engagement Components
// Designed to bring users back and keep them engaged

// Main Engagement Dashboard
export { EngagementDashboard, EngagementSidebar } from './EngagementDashboard';

// Streak Mechanics
export { StreakSystem, StreakWidget } from './StreakSystem';

// Win-Back System for inactive users
export { WinBackSystem, WinBackBanner } from './WinBackSystem';

// Progress Indicators
export {
  ProfileCompletion,
  JudgeTierProgress,
  WeeklyCreditsProgress,
  RequestProgress
} from './ProgressIndicators';

// Re-engagement CTAs
export {
  AfterResultsCTA,
  AfterJudgingCTA,
  LowCreditsCTA,
  InactivityCTA,
  AchievementPrompt,
  WelcomeBackBonus
} from './ReEngagementCTAs';

// Social Features
export {
  CommunityStats,
  ActivityFeed,
  ShareVerdictCard,
  InviteFriendsCTA,
  SocialProofBanner
} from './SocialFeatures';

// Notification Preferences
export {
  NotificationPreferences,
  QuickNotificationToggle
} from './NotificationPreferences';

// Existing retention components
export { RetentionDiscountBanner } from './RetentionDiscountBanner';
export { RetentionHooks, useRetentionHooks } from './RetentionHooks';
