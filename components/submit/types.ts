// Unified Submission Flow Types
// Single source of truth for the entire submission experience

// =============================================================================
// Core Enums & Literals
// =============================================================================

export type RequestType = 'standard' | 'comparison' | 'split_test';
export type MediaType = 'photo' | 'text';
export type Tier = 'community' | 'standard' | 'pro';
export type SubmissionStep = 'content' | 'details' | 'submit';

// =============================================================================
// Category Configuration
// =============================================================================

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  bgColor: string;
  iconColor: string;
}

export const CATEGORIES: CategoryOption[] = [
  {
    id: 'appearance',
    name: 'Style & Appearance',
    icon: '👔',
    description: 'Outfits, hair, photos, looks',
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    id: 'dating',
    name: 'Dating & Relationships',
    icon: '💕',
    description: 'Dating profiles, texts, advice',
    gradient: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    id: 'career',
    name: 'Career & Professional',
    icon: '💼',
    description: 'Resume, LinkedIn, workplace',
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'writing',
    name: 'Creative & Writing',
    icon: '✍️',
    description: 'Content, copy, creative work',
    gradient: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    id: 'decision',
    name: 'Life Decisions',
    icon: '🤔',
    description: 'Important choices, dilemmas',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

// =============================================================================
// Tier Configuration
// =============================================================================

export interface TierOption {
  id: Tier;
  name: string;
  description: string;
  credits: number;
  verdictCount: number;
  turnaround: string;
  features: string[];
  recommended?: boolean;
  badge?: string;
}

export const TIERS: TierOption[] = [
  {
    id: 'community',
    name: 'Community',
    description: 'Quick feedback from the community',
    credits: 1,
    verdictCount: 3,
    turnaround: '~30 min',
    features: ['3 verdicts', 'Community judges', 'Basic analysis'],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Detailed feedback from verified judges',
    credits: 2,
    verdictCount: 5,
    turnaround: '~2 hours',
    features: ['5 verdicts', 'Verified judges', 'Detailed feedback'],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Comprehensive analysis from experts',
    credits: 4,
    verdictCount: 10,
    turnaround: '~1 hour',
    features: ['10 verdicts', 'Expert judges', 'Priority queue'],
    badge: 'Best Value',
  },
];

// =============================================================================
// Request Type Configuration
// =============================================================================

export interface RequestTypeOption {
  id: RequestType;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  fileCount: number;
  badge?: string;
  popular?: boolean;
}

export const REQUEST_TYPES: RequestTypeOption[] = [
  {
    id: 'standard',
    name: 'Standard Feedback',
    description: 'Get feedback on one item',
    icon: '📝',
    gradient: 'from-blue-500 to-cyan-500',
    fileCount: 1,
    popular: true,
  },
  {
    id: 'comparison',
    name: 'A/B Comparison',
    description: 'Compare two options side by side',
    icon: '⚖️',
    gradient: 'from-purple-500 to-pink-500',
    fileCount: 2,
    badge: 'Advanced',
  },
  {
    id: 'split_test',
    name: 'Split Test',
    description: 'Test with demographic targeting',
    icon: '🔄',
    gradient: 'from-orange-500 to-red-500',
    fileCount: 2,
    badge: 'Pro',
  },
];

// =============================================================================
// Submission Data (Form State)
// =============================================================================

export interface SubmissionData {
  // Request type
  requestType: RequestType;

  // Media content
  mediaType: MediaType;
  mediaUrls: string[];        // Array for comparison support (1-2 items)
  textContent: string;

  // Details
  category: string;
  context: string;
  specificQuestions: string[];

  // For split tests
  demographicFilters?: {
    ageRange?: string;
    gender?: string;
  };

  // Tier selection
  tier: Tier;

  // After submission
  requestId?: string;
}

// =============================================================================
// Draft Storage (localStorage)
// =============================================================================

export interface SubmissionDraft {
  version: 2;
  savedAt: number;
  step: SubmissionStep;
  data: SubmissionData;
  returnFrom?: 'earn' | 'payment';
}

export const DRAFT_STORAGE_KEY = 'verdict_submission_draft';
export const DRAFT_EXPIRY_HOURS = 24;

// Legacy keys for migration
export const LEGACY_STORAGE_KEYS = {
  sessionStorage: ['submitDraft', 'draftRequest'],
  localStorage: ['verdict_request_draft'],
} as const;

// =============================================================================
// Component Props
// =============================================================================

export interface StepProps {
  data: SubmissionData;
  onUpdate: (updates: Partial<SubmissionData>) => void;
  onNext: () => void;
  onBack?: () => void;
  userCredits: number;
  isOnline: boolean;
}

export interface SubmitFlowProps {
  initialStep?: SubmissionStep;
  returnFrom?: 'earn' | 'payment';
}

// =============================================================================
// API Response Types
// =============================================================================

export interface SubmissionResponse {
  success: boolean;
  requestId?: string;
  error?: string;
  required_credits?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

export function getTierByCredits(credits: number): TierOption {
  // Return the best tier the user can afford
  const affordable = TIERS.filter(t => t.credits <= credits);
  if (affordable.length === 0) return TIERS[0];
  return affordable[affordable.length - 1];
}

export function getRequiredCredits(tier: Tier): number {
  return TIERS.find(t => t.id === tier)?.credits ?? 1;
}

export function getRequestTypeConfig(type: RequestType): RequestTypeOption {
  return REQUEST_TYPES.find(t => t.id === type) ?? REQUEST_TYPES[0];
}

export function createEmptySubmissionData(): SubmissionData {
  return {
    requestType: 'standard',
    mediaType: 'photo',
    mediaUrls: [],
    textContent: '',
    category: '',
    context: '',
    specificQuestions: [],
    tier: 'community',
  };
}
