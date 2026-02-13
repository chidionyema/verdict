/**
 * Judge Verification Service
 *
 * Multi-tier verification system for building trust and expertise credibility.
 *
 * Verification Tiers:
 * 1. Email Verified - Basic (automatic)
 * 2. Profile Complete - Demographics, bio, photo
 * 3. LinkedIn Connected - OAuth with profile data extraction
 * 4. LinkedIn Verified - 500+ connections, 2+ years tenure, matching expertise
 * 5. Expert Verified - Domain expertise proof (portfolio, certifications, references)
 *
 * Each tier unlocks additional privileges and earning potential.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export type VerificationTier =
  | 'none'
  | 'email_verified'
  | 'profile_complete'
  | 'linkedin_connected'
  | 'linkedin_verified'
  | 'expert_verified';

export interface VerificationStatus {
  currentTier: VerificationTier;
  tierIndex: number; // 0-5 for progress bars
  completedSteps: VerificationStep[];
  nextStep: VerificationStep | null;
  privileges: TierPrivileges;
  earnMultiplier: number;
}

export interface VerificationStep {
  id: string;
  tier: VerificationTier;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface TierPrivileges {
  canJudgeCommunity: boolean;
  canJudgeStandard: boolean;
  canJudgePro: boolean;
  canJudgeExpert: boolean;
  showVerifiedBadge: boolean;
  showExpertBadge: boolean;
  priorityQueueAccess: boolean;
  earningsMultiplier: number;
  maxDailyVerdicts: number;
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  industry?: string;
  profilePictureUrl?: string;
  connectionCount?: number;
  profileCreatedYear?: number;
  currentPositions?: LinkedInPosition[];
}

export interface LinkedInPosition {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface ExpertVerificationRequest {
  userId: string;
  expertiseCategory: string;
  proofType: 'portfolio' | 'certification' | 'reference' | 'work_sample';
  proofUrl?: string;
  proofDescription: string;
  yearsExperience: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VERIFICATION_TIERS: Record<VerificationTier, TierPrivileges> = {
  none: {
    canJudgeCommunity: false,
    canJudgeStandard: false,
    canJudgePro: false,
    canJudgeExpert: false,
    showVerifiedBadge: false,
    showExpertBadge: false,
    priorityQueueAccess: false,
    earningsMultiplier: 0,
    maxDailyVerdicts: 0,
  },
  email_verified: {
    canJudgeCommunity: true,
    canJudgeStandard: false,
    canJudgePro: false,
    canJudgeExpert: false,
    showVerifiedBadge: false,
    showExpertBadge: false,
    priorityQueueAccess: false,
    earningsMultiplier: 1.0,
    maxDailyVerdicts: 10,
  },
  profile_complete: {
    canJudgeCommunity: true,
    canJudgeStandard: true,
    canJudgePro: false,
    canJudgeExpert: false,
    showVerifiedBadge: false,
    showExpertBadge: false,
    priorityQueueAccess: false,
    earningsMultiplier: 1.0,
    maxDailyVerdicts: 25,
  },
  linkedin_connected: {
    canJudgeCommunity: true,
    canJudgeStandard: true,
    canJudgePro: true,
    canJudgeExpert: false,
    showVerifiedBadge: true,
    showExpertBadge: false,
    priorityQueueAccess: false,
    earningsMultiplier: 1.15,
    maxDailyVerdicts: 50,
  },
  linkedin_verified: {
    canJudgeCommunity: true,
    canJudgeStandard: true,
    canJudgePro: true,
    canJudgeExpert: false,
    showVerifiedBadge: true,
    showExpertBadge: false,
    priorityQueueAccess: true,
    earningsMultiplier: 1.25,
    maxDailyVerdicts: 75,
  },
  expert_verified: {
    canJudgeCommunity: true,
    canJudgeStandard: true,
    canJudgePro: true,
    canJudgeExpert: true,
    showVerifiedBadge: true,
    showExpertBadge: true,
    priorityQueueAccess: true,
    earningsMultiplier: 1.5,
    maxDailyVerdicts: 100,
  },
};

const TIER_ORDER: VerificationTier[] = [
  'none',
  'email_verified',
  'profile_complete',
  'linkedin_connected',
  'linkedin_verified',
  'expert_verified',
];

// LinkedIn verification thresholds
const LINKEDIN_VERIFICATION_REQUIREMENTS = {
  minConnections: 100, // Minimum connections to be "verified"
  minTenureYears: 1, // Minimum years on LinkedIn
  minPositions: 1, // At least one job listed
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get the current verification status for a user.
 */
export async function getVerificationStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<VerificationStatus> {
  // Fetch all verification-related data
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      email_verified,
      profile_completed,
      linkedin_verified,
      linkedin_url,
      avatar_url,
      bio,
      country,
      age_range,
      expertise_area
    `)
    .eq('id', userId)
    .single();

  const { data: verification } = await supabase
    .from('judge_verifications')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: expertApplication } = await supabase
    .from('expert_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .single();

  // Determine completed steps
  const steps: VerificationStep[] = [
    {
      id: 'email',
      tier: 'email_verified',
      title: 'Verify Email',
      description: 'Confirm your email address',
      completed: !!profile?.email_verified,
      actionUrl: '/auth/verify-email',
      actionLabel: 'Verify Email',
    },
    {
      id: 'profile',
      tier: 'profile_complete',
      title: 'Complete Profile',
      description: 'Add photo, bio, and expertise area',
      completed: !!(
        profile?.avatar_url &&
        profile?.bio &&
        profile?.expertise_area &&
        profile?.country
      ),
      actionUrl: '/account',
      actionLabel: 'Complete Profile',
    },
    {
      id: 'linkedin_connect',
      tier: 'linkedin_connected',
      title: 'Connect LinkedIn',
      description: 'Link your LinkedIn account',
      completed: !!profile?.linkedin_url,
      actionUrl: '/judge/verify',
      actionLabel: 'Connect LinkedIn',
    },
    {
      id: 'linkedin_verify',
      tier: 'linkedin_verified',
      title: 'LinkedIn Verified',
      description: `${LINKEDIN_VERIFICATION_REQUIREMENTS.minConnections}+ connections, ${LINKEDIN_VERIFICATION_REQUIREMENTS.minTenureYears}+ years`,
      completed: !!verification?.linkedin_verified_at,
      actionUrl: '/judge/verify',
      actionLabel: 'Verify Profile',
    },
    {
      id: 'expert',
      tier: 'expert_verified',
      title: 'Expert Verification',
      description: 'Prove domain expertise with portfolio or credentials',
      completed: !!expertApplication,
      actionUrl: '/judge/become-expert',
      actionLabel: 'Apply for Expert',
    },
  ];

  // Calculate current tier
  let currentTier: VerificationTier = 'none';
  for (const step of steps) {
    if (step.completed) {
      currentTier = step.tier;
    } else {
      break;
    }
  }

  // Find next step
  const nextStep = steps.find(s => !s.completed) || null;

  const tierIndex = TIER_ORDER.indexOf(currentTier);
  const privileges = VERIFICATION_TIERS[currentTier];

  return {
    currentTier,
    tierIndex,
    completedSteps: steps.filter(s => s.completed),
    nextStep,
    privileges,
    earnMultiplier: privileges.earningsMultiplier,
  };
}

/**
 * Verify a LinkedIn profile meets our standards.
 */
export function verifyLinkedInProfile(profile: LinkedInProfile): {
  verified: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check connection count
  if (
    profile.connectionCount !== undefined &&
    profile.connectionCount < LINKEDIN_VERIFICATION_REQUIREMENTS.minConnections
  ) {
    reasons.push(
      `Need ${LINKEDIN_VERIFICATION_REQUIREMENTS.minConnections}+ connections (you have ${profile.connectionCount})`
    );
  }

  // Check tenure
  if (profile.profileCreatedYear) {
    const currentYear = new Date().getFullYear();
    const tenure = currentYear - profile.profileCreatedYear;
    if (tenure < LINKEDIN_VERIFICATION_REQUIREMENTS.minTenureYears) {
      reasons.push(
        `LinkedIn profile must be ${LINKEDIN_VERIFICATION_REQUIREMENTS.minTenureYears}+ years old`
      );
    }
  }

  // Check positions
  if (
    !profile.currentPositions ||
    profile.currentPositions.length < LINKEDIN_VERIFICATION_REQUIREMENTS.minPositions
  ) {
    reasons.push('Must have at least one work position listed');
  }

  return {
    verified: reasons.length === 0,
    reasons,
  };
}

/**
 * Submit an expert verification request.
 */
export async function submitExpertVerificationRequest(
  supabase: SupabaseClient,
  request: ExpertVerificationRequest
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  // Check if user already has pending or approved request
  const { data: existing } = await supabase
    .from('expert_verification_requests')
    .select('id, status')
    .eq('user_id', request.userId)
    .in('status', ['pending', 'approved'])
    .single();

  if (existing) {
    if (existing.status === 'approved') {
      return { success: false, error: 'You are already expert verified' };
    }
    return { success: false, error: 'You have a pending verification request' };
  }

  // Create the request
  const { data, error } = await supabase
    .from('expert_verification_requests')
    .insert({
      user_id: request.userId,
      expertise_category: request.expertiseCategory,
      proof_type: request.proofType,
      proof_url: request.proofUrl,
      proof_description: request.proofDescription,
      years_experience: request.yearsExperience,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, requestId: data.id };
}

/**
 * Check if a judge can access a specific request tier.
 */
export async function canAccessRequestTier(
  supabase: SupabaseClient,
  userId: string,
  requestTier: string
): Promise<boolean> {
  const status = await getVerificationStatus(supabase, userId);

  switch (requestTier) {
    case 'community':
      return status.privileges.canJudgeCommunity;
    case 'standard':
      return status.privileges.canJudgeStandard;
    case 'pro':
      return status.privileges.canJudgePro;
    case 'expert':
    case 'enterprise':
      return status.privileges.canJudgeExpert;
    default:
      return status.privileges.canJudgeCommunity;
  }
}

/**
 * Get the earnings multiplier for a judge based on their verification tier.
 */
export async function getEarningsMultiplier(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const status = await getVerificationStatus(supabase, userId);
  return status.earnMultiplier;
}
