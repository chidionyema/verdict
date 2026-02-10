/**
 * Centralized messaging constants for consistent UX across the platform
 *
 * IMPORTANT: Use these constants everywhere to ensure terminology consistency
 */

// Core credit system messaging
export const CREDIT_EQUATION = "1 credit = 1 submission = 3 feedback reports";
export const CREDIT_EQUATION_SHORT = "1 credit = 1 submission";
export const EARN_CREDIT_TEXT = "Review 3 requests to earn 1 free credit";
export const EARN_CREDIT_CTA = "Start Reviewing";

// Role naming - use consistently
export const ROLE_REVIEWER = "Reviewer"; // Person giving feedback
export const ROLE_SEEKER = "Submitter";  // Person seeking feedback
export const ROLE_JUDGE_LEGACY = "Judge"; // Legacy term, prefer "Reviewer"

// Action naming - use consistently
export const ACTION_VERDICT = "feedback";    // What reviewers give
export const ACTION_SUBMIT = "submission";   // What seekers create
export const ACTION_REVIEW = "review";       // The act of giving feedback

// Value propositions
export const VALUE_PROP_MAIN = "Get honest feedback from real people";
export const VALUE_PROP_SUB = "Submit anything. Get 3 detailed feedback reports in under 2 hours. 100% anonymous.";

// Guarantees
export const GUARANTEE_REPORTS = "3 honest feedback reports guaranteed";
export const GUARANTEE_TIME = "Results in under 2 hours";
export const GUARANTEE_REFUND = "Full refund if you don't get 3 reports in 24 hours";

// Judge/Reviewer earnings
export const EARNINGS_BASE = "$0.50";
export const EARNINGS_PREMIUM = "$1.00";
export const EARNINGS_RANGE = "$0.50-$1.00 per review";
export const PAYOUT_MINIMUM = "$20";
export const PAYOUT_HOLD_DAYS = 7;
export const PAYOUT_HOLD_REASON = "7-day review period (anti-fraud protection)";

// Empty states
export const EMPTY_NO_CREDITS = "You need 1 credit to submit. Review 3 requests from others to earn 1 free credit.";
export const EMPTY_NO_REQUESTS = "No requests available right now. Check back soon!";
export const EMPTY_NO_VERDICTS = "No feedback yet. Your submission is being reviewed.";

// Success states
export const SUCCESS_VERDICT_SUBMITTED = "Verdict submitted! You earned money for this review.";
export const SUCCESS_REQUEST_CREATED = "Your submission is live! Expect 3 feedback reports soon.";

// Helper function for credit display
export function getCreditText(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`;
}

// Helper for earnings display
export function getEarningsText(tier: string): string {
  switch (tier) {
    case 'pro':
    case 'premium':
      return EARNINGS_PREMIUM;
    default:
      return EARNINGS_BASE;
  }
}
