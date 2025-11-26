'use client';

interface ModerationResult {
  approved: boolean;
  reason?: string;
  confidence: number;
}

// Comprehensive free content moderation
const BANNED_PATTERNS = [
  // Sexual content
  { pattern: /\b(nude|naked|sex|porn|xxx|nsfw|adult|explicit)\b/gi, reason: 'Sexual content not allowed' },
  { pattern: /\b(penis|vagina|breast|dick|pussy|cock)\b/gi, reason: 'Sexual content not allowed' },
  
  // Violence/harmful content
  { pattern: /\b(kill|murder|suicide|harm|abuse|violence|attack|hurt)\b/gi, reason: 'Violent content not allowed' },
  { pattern: /\b(gun|weapon|knife|bomb|terrorist)\b/gi, reason: 'Violent content not allowed' },
  
  // Illegal content
  { pattern: /\b(drug|cocaine|heroin|meth|weed|marijuana|illegal|scam)\b/gi, reason: 'Illegal content not allowed' },
  
  // Spam indicators
  { pattern: /\b(click here|buy now|money back|guarantee|limited time|act now)\b/gi, reason: 'Spam content detected' },
  { pattern: /\b(visit|check out|download|subscribe|follow me)\s+\w+\.(com|net|org)\b/gi, reason: 'Promotional links not allowed' },
  
  // Hate speech
  { pattern: /\b(nazi|hitler|racist|nigger|faggot|retard|cunt)\b/gi, reason: 'Hate speech not allowed' },
  
  // Personal information
  { pattern: /\b\d{3}-?\d{3}-?\d{4}\b/g, reason: 'Phone numbers not allowed' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, reason: 'Email addresses not allowed' },
  { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, reason: 'Credit card numbers not allowed' },
];

const SUSPICIOUS_PATTERNS = [
  // Potential scams
  /\b(urgent|emergency|help|crisis|desperate)\b/gi,
  // Potential doxxing
  /\b(address|home|location|where.*live)\b/gi,
  // Potential harassment
  /\b(ugly|fat|stupid|loser|pathetic|worthless)\b/gi,
];

export function moderateText(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { approved: false, reason: 'Empty content not allowed', confidence: 1.0 };
  }

  // Length checks
  if (text.length > 2000) {
    return { approved: false, reason: 'Content too long (max 2000 characters)', confidence: 1.0 };
  }

  if (text.length < 10) {
    return { approved: false, reason: 'Content too short (min 10 characters)', confidence: 0.8 };
  }

  // Check banned patterns
  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(text)) {
      return { approved: false, reason: item.reason, confidence: 0.9 };
    }
  }

  // Spam detection
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    return { approved: false, reason: 'Excessive capitalization (spam indicator)', confidence: 0.8 };
  }

  // Repetitive character detection
  const repetitivePattern = /(.)\1{4,}/g; // Same character 5+ times
  if (repetitivePattern.test(text)) {
    return { approved: false, reason: 'Repetitive characters (spam indicator)', confidence: 0.7 };
  }

  // Multiple exclamation/question marks
  if ((text.match(/[!]{3,}/g) || []).length > 0 || (text.match(/[?]{3,}/g) || []).length > 0) {
    return { approved: false, reason: 'Excessive punctuation (spam indicator)', confidence: 0.6 };
  }

  // Check suspicious patterns (flag for manual review)
  let suspiciousScore = 0;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      suspiciousScore += 0.3;
    }
  }

  if (suspiciousScore > 0.6) {
    return { approved: false, reason: 'Content flagged for manual review', confidence: 0.6 };
  }

  return { approved: true, confidence: 1.0 };
}

export function moderateImage(filename: string, fileSize: number): ModerationResult {
  // File extension check
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(extension)) {
    return { approved: false, reason: 'File type not allowed', confidence: 1.0 };
  }

  // File size check (max 10MB)
  if (fileSize > 10 * 1024 * 1024) {
    return { approved: false, reason: 'File too large (max 10MB)', confidence: 1.0 };
  }

  // Suspicious filename patterns
  if (/\b(nude|naked|sex|porn|xxx|nsfw)\b/i.test(filename)) {
    return { approved: false, reason: 'Inappropriate filename', confidence: 0.8 };
  }

  return { approved: true, confidence: 0.7 }; // Lower confidence since we can't analyze image content
}

export function moderateRequest(content: string, mediaType?: string, filename?: string, fileSize?: number): ModerationResult {
  // Moderate text content
  const textResult = moderateText(content);
  if (!textResult.approved) {
    return textResult;
  }

  // Moderate image if present
  if (mediaType === 'image' && filename && fileSize !== undefined) {
    const imageResult = moderateImage(filename, fileSize);
    if (!imageResult.approved) {
      return imageResult;
    }
  }

  return { approved: true, confidence: Math.min(textResult.confidence, 0.9) };
}

// Community moderation helpers
export interface ReportedContent {
  id: string;
  contentType: 'request' | 'verdict' | 'judge';
  contentId: string;
  reportedBy: string;
  reason: string;
  reportCount: number;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export function shouldAutoHideContent(reportCount: number, contentAge: number): boolean {
  // Auto-hide if 3+ reports within 24 hours, or 5+ reports within a week
  if (reportCount >= 3 && contentAge < 24) return true;
  if (reportCount >= 5 && contentAge < 168) return true; // 1 week
  return false;
}

export function calculateModerationScore(
  contentAge: number, // hours since creation
  reportCount: number,
  userReputation: number, // 0-100 scale
  judgeCount: number // how many judges have seen this
): number {
  let score = 100; // Start with perfect score

  // Deduct based on reports
  score -= reportCount * 15;

  // Consider user reputation
  if (userReputation < 50) score -= 10;
  if (userReputation < 25) score -= 20;

  // Consider judge exposure
  if (judgeCount > 10 && reportCount === 0) score += 10; // Many judges saw it, no reports = good

  return Math.max(0, Math.min(100, score));
}