// Input validation utilities for VERDICT MVP
import { APP_CONFIG } from './app-config';

export const CATEGORIES = ['appearance', 'profile', 'writing', 'decision'] as const;
export const TONES = ['honest', 'constructive', 'encouraging'] as const;
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45+'] as const;
export const GENDERS = ['male', 'female', 'nonbinary', 'prefer_not_say'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Tone = (typeof TONES)[number];

// Banned words list for content moderation
// This list catches obvious inappropriate content; consider AI moderation for production
const BANNED_WORDS: string[] = [
  // Slurs and hate speech (abbreviated/obfuscated forms also caught by pattern matching)
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'chink', 'gook', 'spic', 'wetback', 'kike', 'dyke',
  'tranny', 'shemale',
  // Extreme violence
  'kill yourself', 'kys', 'go die', 'hope you die',
  // Harassment patterns
  'i will find you', 'i know where you live',
  // Spam/scam indicators
  'send me money', 'wire transfer', 'bitcoin wallet',
  'click this link', 'free gift card',
];

// Additional patterns to check (regex-based)
const BANNED_PATTERNS: RegExp[] = [
  /n[i1!]+[g9]+[e3]*r/i,           // Obfuscated slur variations
  /f[a@4]+[g9]+[o0]*t/i,           // Obfuscated slur variations
  /k+y+s+/i,                        // "kys" variations
  /\b(https?:\/\/[^\s]+){3,}/i,    // Multiple URLs (spam indicator)
  /(.)\1{10,}/,                     // Repeated characters (spam)
  /[A-Z]{20,}/,                     // Excessive caps (spam/shouting)
];

export function validateContext(context: string): { valid: boolean; error?: string } {
  if (!context || typeof context !== 'string') {
    return { valid: false, error: 'Context is required' };
  }
  if (context.length < 20) {
    return { valid: false, error: 'Context must be at least 20 characters' };
  }
  if (context.length > 500) {
    return { valid: false, error: 'Context must be 500 characters or less' };
  }
  if (containsBannedWords(context)) {
    return { valid: false, error: 'Content contains inappropriate language' };
  }
  return { valid: true };
}

export function validateFeedback(feedback: string, options?: { minLength?: number }): { valid: boolean; error?: string } {
  const minLength = options?.minLength ?? 120;

  if (!feedback || typeof feedback !== 'string') {
    return { valid: false, error: 'Feedback is required' };
  }
  if (feedback.length < minLength) {
    return { valid: false, error: `Feedback must be at least ${minLength} characters` };
  }
  if (feedback.length > 500) {
    return { valid: false, error: 'Feedback must be 500 characters or less' };
  }
  if (containsBannedWords(feedback)) {
    return { valid: false, error: 'Content contains inappropriate language' };
  }
  return { valid: true };
}

// Quick feedback for community feed - lower minimum for faster interactions
export function validateQuickFeedback(feedback: string): { valid: boolean; error?: string } {
  return validateFeedback(feedback, { minLength: 20 });
}

export function validateCategory(category: string): category is Category {
  return CATEGORIES.includes(category as Category);
}

export function validateTone(tone: string): tone is Tone {
  return TONES.includes(tone as Tone);
}

export function validateRating(rating: unknown): { valid: boolean; error?: string } {
  if (rating === null || rating === undefined) {
    return { valid: true }; // Rating is optional
  }
  if (typeof rating !== 'number') {
    return { valid: false, error: 'Rating must be a number' };
  }
  if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be an integer between 1 and 10' };
  }
  return { valid: true };
}

export function validateMediaType(mediaType: string): mediaType is 'photo' | 'text' | 'audio' {
  return mediaType === 'photo' || mediaType === 'text' || mediaType === 'audio';
}

function containsBannedWords(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check exact word matches
  if (BANNED_WORDS.some((word) => lowerText.includes(word.toLowerCase()))) {
    return true;
  }

  // Check regex patterns for obfuscation attempts
  if (BANNED_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return false;
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, HEIC, and WebP images are allowed' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Image must be 5MB or smaller' };
  }
  return { valid: true };
}

// Pricing model
// Base price per credit for bulk credit packages (not per-request tiers).
// Tiered request prices below may offer slight discounts vs this baseline.
export const PRICE_PER_CREDIT_USD = 3.49;

// Judge payout system
// Global minimum payout threshold (in cents) for judges.
export const MIN_PAYOUT_CENTS = 1000; // $10.00 minimum

// Credit packages (bulk purchase of generic credits)
// These are independent from per-request tier prices below.
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 1745, name: 'Starter' },    // $17.45 ($3.49/credit)
  popular: { credits: 10, price_cents: 3490, name: 'Popular' },   // $34.90 ($3.49/credit)
  value: { credits: 25, price_cents: 8725, name: 'Value' },        // $87.25 ($3.49/credit)
  pro: { credits: 50, price_cents: 17450, name: 'Pro' },           // $174.50 ($3.49/credit)
} as const;

// Simplified Community/Private model configuration
export const SUBMISSION_MODEL = {
  community: {
    credits: APP_CONFIG.CREDITS.CREDITS_PER_SUBMISSION,
    verdicts: APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION,
    judgmentsToEarn: APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT,
    cost: 0,
    visibility: 'public' as const,
  },
  private: {
    credits: 0, // No credits needed
    verdicts: APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION,
    judgePayout: APP_CONFIG.PRICING.JUDGE_PAYOUT_USD_CENTS / 100, // Convert cents to dollars
    visibility: 'private' as const,
    // Price comes from pricing-config.ts (configurable)
  },
} as const;

export type SubmissionMode = keyof typeof SUBMISSION_MODEL;

export function getSubmissionConfig(mode: SubmissionMode) {
  return SUBMISSION_MODEL[mode];
}

// Standard configuration - use dynamic tier configuration
// Note: This is kept for backward compatibility but should use getTierConfig().default_judges
export const STANDARD_VERDICT_COUNT = 3;

export type PackageId = keyof typeof CREDIT_PACKAGES;

export function isValidPackageId(id: string): id is PackageId {
  return id in CREDIT_PACKAGES;
}

// DEPRECATED: Legacy tiers - use dynamic-pricing.ts instead
// These are kept only for backward compatibility during migration
export const VERDICT_TIERS = {
  basic: { verdicts: 3, price_cents: 199 },
  detailed: { verdicts: 3, price_cents: 499 }
} as const;

// DEPRECATED: Use CREDIT_PACKAGES for consistent pricing
// Kept for backward compatibility - will be removed
export const VERDICT_TIER_PRICING = {
  basic: { verdicts: 3, price_cents: 349, name: 'Basic', credits: 1, tier: 'basic', price: 3.49, judgePayout: 1.16 },
  detailed: { verdicts: 5, price_cents: 698, name: 'Standard', credits: 2, tier: 'detailed', price: 6.98, judgePayout: 1.40 }
} as const;

export function getTierConfigByVerdictCount(count: number) {
  // DEPRECATED: Use dynamic-pricing.ts instead
  // This function is kept for backward compatibility during migration
  const { getTierConfig } = require('./pricing/dynamic-pricing');
  const standardConfig = getTierConfig('standard');
  return {
    verdicts: standardConfig.default_judges,
    price_cents: standardConfig.base_price_cents,
    name: standardConfig.name,
    credits: standardConfig.credits_required,
    tier: 'standard',
    price: standardConfig.base_price_cents / 100,
    judgePayout: standardConfig.judge_payout_cents / 100
  };
}

export function getVerdictTierPricing() {
  return VERDICT_TIER_PRICING;
}
