// Input validation utilities for VERDICT MVP

export const CATEGORIES = ['appearance', 'profile', 'writing', 'decision'] as const;
export const TONES = ['honest', 'constructive', 'encouraging'] as const;
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45+'] as const;
export const GENDERS = ['male', 'female', 'nonbinary', 'prefer_not_say'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Tone = (typeof TONES)[number];

// Simple banned words list (expand as needed)
const BANNED_WORDS = [
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
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 499, name: 'Starter' },
  popular: { credits: 10, price_cents: 899, name: 'Popular' },
  value: { credits: 25, price_cents: 1999, name: 'Value' },
  pro: { credits: 50, price_cents: 3499, name: 'Pro' },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;

export function isValidPackageId(id: string): id is PackageId {
  return id in CREDIT_PACKAGES;
}
