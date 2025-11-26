// Input validation utilities for VERDICT MVP

export const CATEGORIES = ['appearance', 'profile', 'writing', 'decision'] as const;
export const TONES = ['honest', 'constructive', 'encouraging'] as const;
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45+'] as const;
export const GENDERS = ['male', 'female', 'nonbinary', 'prefer_not_say'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Tone = (typeof TONES)[number];

// Simple banned words list (expand as needed)
const BANNED_WORDS: string[] = [
  // Add slurs and obviously inappropriate terms
  // Keeping minimal for MVP
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

export function validateFeedback(feedback: string): { valid: boolean; error?: string } {
  if (!feedback || typeof feedback !== 'string') {
    return { valid: false, error: 'Feedback is required' };
  }
  if (feedback.length < 50) {
    return { valid: false, error: 'Feedback must be at least 50 characters' };
  }
  if (feedback.length > 500) {
    return { valid: false, error: 'Feedback must be 500 characters or less' };
  }
  if (containsBannedWords(feedback)) {
    return { valid: false, error: 'Content contains inappropriate language' };
  }
  return { valid: true };
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

export function validateMediaType(mediaType: string): mediaType is 'photo' | 'text' {
  return mediaType === 'photo' || mediaType === 'text';
}

function containsBannedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some((word) => lowerText.includes(word.toLowerCase()));
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

// Credit packages
// Updated pricing: $3.49/credit minimum for 40-45% profit margin
// With 3 verdicts per request (standard tier), this yields ~37% profit margin
// Tiered pricing: Basic (3), Standard (5), Premium (7) verdicts
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 1745, name: 'Starter' },    // $17.45 ($3.49/credit)
  popular: { credits: 10, price_cents: 3490, name: 'Popular' },   // $34.90 ($3.49/credit)
  value: { credits: 25, price_cents: 8725, name: 'Value' },        // $87.25 ($3.49/credit)
  pro: { credits: 50, price_cents: 17450, name: 'Pro' },           // $174.50 ($3.49/credit)
} as const;

// Verdict tier definitions
export const VERDICT_TIERS = {
  basic: { verdicts: 3, name: 'Basic', description: '3 expert verdicts - Fast & affordable' },
  standard: { verdicts: 5, name: 'Standard', description: '5 expert verdicts - Most popular' },
  premium: { verdicts: 7, name: 'Premium', description: '7 expert verdicts - Comprehensive' },
} as const;

export type VerdictTier = keyof typeof VERDICT_TIERS;

// Tier pricing / payout model (finance-approved)
export const VERDICT_TIER_PRICING = {
  basic: {
    tier: 'basic' as const,
    credits: 1,
    verdicts: VERDICT_TIERS.basic.verdicts,
    judgePayout: 0.5,
  },
  standard: {
    tier: 'standard' as const,
    credits: 2,
    verdicts: VERDICT_TIERS.standard.verdicts,
    judgePayout: 0.55,
  },
  premium: {
    tier: 'premium' as const,
    credits: 3,
    verdicts: VERDICT_TIERS.premium.verdicts,
    judgePayout: 0.6,
  },
} as const;

export type VerdictTierPricing = typeof VERDICT_TIER_PRICING;

export function getTierConfig(tier: VerdictTier) {
  return VERDICT_TIER_PRICING[tier];
}

export function getTierConfigByVerdictCount(count: number) {
  const entry = Object.values(VERDICT_TIER_PRICING).find(
    (cfg) => cfg.verdicts === count
  );
  return entry ?? VERDICT_TIER_PRICING.basic;
}

export type PackageId = keyof typeof CREDIT_PACKAGES;

export function isValidPackageId(id: string): id is PackageId {
  return id in CREDIT_PACKAGES;
}
