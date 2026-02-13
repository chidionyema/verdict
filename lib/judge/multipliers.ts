/**
 * Single Source of Truth for Judge Verification Tiers & Multipliers
 *
 * Import this file anywhere you need tier information to ensure consistency.
 */

export interface VerificationTierConfig {
  index: number;
  name: string;
  multiplier: number;
  label: string;
  shortLabel: string;
  bonus: string; // e.g., "+15%"
  description: string;
}

export const VERIFICATION_TIERS: readonly VerificationTierConfig[] = [
  {
    index: 0,
    name: 'none',
    multiplier: 1.0,
    label: 'Unverified',
    shortLabel: 'New',
    bonus: '—',
    description: 'Verify your email to start judging',
  },
  {
    index: 1,
    name: 'email_verified',
    multiplier: 1.0,
    label: 'Email Verified',
    shortLabel: 'Basic',
    bonus: '—',
    description: 'Email confirmed - ready to judge community requests',
  },
  {
    index: 2,
    name: 'profile_complete',
    multiplier: 1.0,
    label: 'Profile Complete',
    shortLabel: 'Standard',
    bonus: '—',
    description: 'Complete profile - access to more request types',
  },
  {
    index: 3,
    name: 'linkedin_connected',
    multiplier: 1.15,
    label: 'LinkedIn Connected',
    shortLabel: 'Verified',
    bonus: '+15%',
    description: '15% earnings boost with verified badge',
  },
  {
    index: 4,
    name: 'linkedin_verified',
    multiplier: 1.25,
    label: 'LinkedIn Verified',
    shortLabel: 'Pro',
    bonus: '+25%',
    description: '25% earnings boost + priority queue',
  },
  {
    index: 5,
    name: 'expert_verified',
    multiplier: 1.5,
    label: 'Expert Verified',
    shortLabel: 'Expert',
    bonus: '+50%',
    description: '50% earnings boost + expert requests',
  },
] as const;

/**
 * Get multiplier for a given tier index
 */
export function getTierMultiplier(tierIndex: number): number {
  return VERIFICATION_TIERS[tierIndex]?.multiplier ?? 1;
}

/**
 * Get tier config by index
 */
export function getTierConfig(tierIndex: number): VerificationTierConfig {
  return VERIFICATION_TIERS[tierIndex] ?? VERIFICATION_TIERS[0];
}

/**
 * Get tier config by name
 */
export function getTierByName(name: string): VerificationTierConfig | undefined {
  return VERIFICATION_TIERS.find(t => t.name === name);
}

/**
 * Get the multiplier array for components that need it
 * Returns [1, 1, 1, 1.15, 1.25, 1.5]
 */
export function getMultiplierArray(): number[] {
  return VERIFICATION_TIERS.map(t => t.multiplier);
}

/**
 * Calculate bonus percentage from multiplier
 */
export function getMultiplierBonus(multiplier: number): string {
  if (multiplier <= 1) return '—';
  return `+${Math.round((multiplier - 1) * 100)}%`;
}

/**
 * Maximum possible multiplier
 */
export const MAX_MULTIPLIER = 1.5;

/**
 * Tier benefits descriptions for UI
 */
export const TIER_BENEFITS = {
  linkedin_connected: {
    title: 'LinkedIn Connected',
    bonus: '+15%',
    benefits: ['Verified professional badge', '15% earnings boost'],
  },
  linkedin_verified: {
    title: 'LinkedIn Verified',
    bonus: '+25%',
    benefits: ['25% earnings boost', 'Priority queue access', 'Pro badge'],
  },
  expert_verified: {
    title: 'Expert Verified',
    bonus: '+50%',
    benefits: ['50% earnings boost', 'Expert badge', 'Premium request access', 'Priority routing'],
  },
} as const;
