// Judge Verification Components
export { VerificationProgress } from '../VerificationProgress';
export { JudgeTierBadge, JudgeVerificationIndicator, ExpertBadge } from '../JudgeTierBadge';

// Re-export types from the verification service
export type {
  VerificationTier,
  VerificationStatus,
  VerificationStep,
  TierPrivileges,
} from '@/lib/judge/verification';
