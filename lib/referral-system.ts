/**
 * Referral Program MVP - "Give 1, Get 1" Credit System
 * Simple viral mechanics to drive organic growth
 */

import { APP_CONFIG } from './app-config';

// Update app config with referral settings
const REFERRAL_CONFIG = {
  REFERRER_REWARD_CREDITS: 1,     // Credits given to referrer
  REFEREE_REWARD_CREDITS: 1,      // Credits given to new user
  MAX_REFERRALS_PER_USER: 50,     // Anti-abuse limit
  REFERRAL_CODE_LENGTH: 8,        // Code format: VERDICT23
  VALID_SIGNUP_WINDOW_HOURS: 72,  // Must signup within 72h
} as const;

export interface ReferralData {
  id: string;
  referrer_user_id: string;
  referral_code: string;
  referee_user_id?: string;
  referee_email?: string;
  status: 'pending' | 'completed' | 'expired';
  credits_awarded: number;
  created_at: string;
  completed_at?: string;
}

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_credits_earned: number;
  conversion_rate: number;
}

// Referral code generation
export function generateReferralCode(userId: string): string {
  // Create memorable 8-character code: VERDICT + 2 random chars
  const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  const userHash = userId.slice(-2).toUpperCase();
  return `VER${userHash}${suffix}`;
}

// Validate referral code format
export function isValidReferralCode(code: string): boolean {
  return /^VER[A-Z0-9]{5}$/.test(code);
}

// Mock referral service (replace with database integration)
export class ReferralService {
  private referrals: Map<string, ReferralData> = new Map();
  private userCodes: Map<string, string> = new Map();

  async createReferralCode(userId: string): Promise<string> {
    // Check if user already has a code
    const existingCode = this.userCodes.get(userId);
    if (existingCode) return existingCode;

    // Generate new code
    let code = generateReferralCode(userId);
    
    // Ensure uniqueness
    while (this.getReferralByCode(code)) {
      code = generateReferralCode(userId);
    }

    this.userCodes.set(userId, code);
    
    const referral: ReferralData = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      referrer_user_id: userId,
      referral_code: code,
      status: 'pending',
      credits_awarded: 0,
      created_at: new Date().toISOString()
    };

    this.referrals.set(code, referral);
    return code;
  }

  async applyReferralCode(refereeUserId: string, refereeEmail: string, referralCode: string): Promise<boolean> {
    if (!isValidReferralCode(referralCode)) return false;

    const referral = this.getReferralByCode(referralCode);
    if (!referral || referral.status !== 'pending') return false;

    // Check expiry
    const createdAt = new Date(referral.created_at);
    const expiryTime = new Date(createdAt.getTime() + REFERRAL_CONFIG.VALID_SIGNUP_WINDOW_HOURS * 60 * 60 * 1000);
    if (new Date() > expiryTime) {
      referral.status = 'expired';
      return false;
    }

    // Apply referral
    referral.referee_user_id = refereeUserId;
    referral.referee_email = refereeEmail;
    referral.status = 'completed';
    referral.completed_at = new Date().toISOString();
    referral.credits_awarded = REFERRAL_CONFIG.REFERRER_REWARD_CREDITS + REFERRAL_CONFIG.REFEREE_REWARD_CREDITS;

    // In production, this would:
    // 1. Award credits to both users
    // 2. Send notification emails
    // 3. Track conversion metrics
    console.log(`Referral completed: ${referralCode} -> ${refereeEmail}`);
    
    return true;
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const userReferrals = Array.from(this.referrals.values())
      .filter(r => r.referrer_user_id === userId);

    const successful = userReferrals.filter(r => r.status === 'completed');
    const pending = userReferrals.filter(r => r.status === 'pending');

    return {
      total_referrals: userReferrals.length,
      successful_referrals: successful.length,
      pending_referrals: pending.length,
      total_credits_earned: successful.reduce((sum, r) => sum + REFERRAL_CONFIG.REFERRER_REWARD_CREDITS, 0),
      conversion_rate: userReferrals.length > 0 ? successful.length / userReferrals.length : 0
    };
  }

  private getReferralByCode(code: string): ReferralData | undefined {
    return this.referrals.get(code);
  }

  // Admin methods
  async getAllReferrals(): Promise<ReferralData[]> {
    return Array.from(this.referrals.values());
  }

  async getTopReferrers(limit = 10): Promise<Array<{userId: string, referrals: number, credits: number}>> {
    const stats = new Map<string, {referrals: number, credits: number}>();
    
    for (const referral of this.referrals.values()) {
      if (referral.status === 'completed') {
        const current = stats.get(referral.referrer_user_id) || {referrals: 0, credits: 0};
        current.referrals += 1;
        current.credits += REFERRAL_CONFIG.REFERRER_REWARD_CREDITS;
        stats.set(referral.referrer_user_id, current);
      }
    }

    return Array.from(stats.entries())
      .map(([userId, data]) => ({userId, ...data}))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, limit);
  }
}

// Export singleton instance
export const referralService = new ReferralService();

// Utility functions
export function getReferralShareText(referralCode: string, referrerName?: string): string {
  const baseText = `Hey! I've been using Verdict to get honest feedback on photos, decisions, and more. It's actually really helpful!`;
  const codeText = `Use my code ${referralCode} and we both get a free credit.`;
  const linkText = `Try it: https://verdict.app?ref=${referralCode}`;
  
  return `${baseText}\n\n${codeText}\n\n${linkText}`;
}

export function getReferralShareUrl(referralCode: string): string {
  return `https://verdict.app?ref=${referralCode}`;
}

// Share to different platforms
export function getShareUrls(referralCode: string, referrerName?: string) {
  const text = getReferralShareText(referralCode, referrerName);
  const url = getReferralShareUrl(referralCode);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=Check out Verdict&body=${encodeURIComponent(text)}`,
    copy: url
  };
}