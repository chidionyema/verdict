/**
 * Standardized Quality Score System
 *
 * This module provides a unified approach to quality scoring across the platform.
 * All quality scores are normalized to a 0-100 scale for consistency.
 *
 * Score Bands:
 * - 90-100: Exceptional
 * - 75-89:  Good
 * - 60-74:  Satisfactory
 * - 40-59:  Needs Improvement
 * - 0-39:   Poor
 */

export interface QualityFactors {
  // Content quality (0-1 scale)
  contentLength?: number;      // Ideal: 50-300 chars = 1.0
  specificity?: number;        // Has actionable suggestions = 1.0
  constructiveness?: number;   // Balanced, helpful tone = 1.0

  // Performance metrics
  responseTimeMinutes?: number; // Time to respond
  userRating?: number;          // 1-5 star rating from requester
  helpfulnessRating?: number;   // 1-5 helpfulness rating

  // Historical factors
  totalVerdicts?: number;       // Experience level
  consensusRate?: number;       // Agreement with majority (0-1)
  reportCount?: number;         // Number of user complaints
  accountAgeDays?: number;      // Account maturity
}

export interface QualityScoreResult {
  score: number;              // 0-100 normalized score
  band: 'exceptional' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
  breakdown: {
    content: number;          // 0-100 content quality component
    performance: number;      // 0-100 performance component
    reputation: number;       // 0-100 reputation component
  };
}

/**
 * Calculate a standardized quality score from various factors
 */
export function calculateQualityScore(factors: QualityFactors): QualityScoreResult {
  // Content Quality Component (35% weight)
  let contentScore = 70; // Default baseline
  if (factors.contentLength !== undefined) {
    contentScore = factors.contentLength * 100;
  }
  if (factors.specificity !== undefined) {
    contentScore = (contentScore + factors.specificity * 100) / 2;
  }
  if (factors.constructiveness !== undefined) {
    contentScore = (contentScore * 0.6 + factors.constructiveness * 100 * 0.4);
  }

  // Performance Component (35% weight)
  let performanceScore = 70; // Default baseline

  // User rating (most important)
  if (factors.userRating !== undefined) {
    performanceScore = (factors.userRating / 5) * 100;
  }
  if (factors.helpfulnessRating !== undefined) {
    const helpScore = (factors.helpfulnessRating / 5) * 100;
    performanceScore = (performanceScore + helpScore) / 2;
  }

  // Response time bonus/penalty
  if (factors.responseTimeMinutes !== undefined) {
    const idealTime = 60; // 1 hour ideal
    if (factors.responseTimeMinutes < idealTime) {
      performanceScore += 5; // Fast response bonus
    } else if (factors.responseTimeMinutes > 240) {
      performanceScore -= 10; // Slow response penalty
    }
  }

  // Reputation Component (30% weight)
  let reputationScore = 50; // Neutral starting point

  // Experience bonus
  if (factors.totalVerdicts !== undefined) {
    if (factors.totalVerdicts >= 100) reputationScore += 15;
    else if (factors.totalVerdicts >= 50) reputationScore += 10;
    else if (factors.totalVerdicts >= 20) reputationScore += 5;
  }

  // Consensus alignment
  if (factors.consensusRate !== undefined) {
    reputationScore += factors.consensusRate * 20;
  }

  // Account maturity
  if (factors.accountAgeDays !== undefined) {
    const maturityBonus = Math.min(10, factors.accountAgeDays / 30 * 10);
    reputationScore += maturityBonus;
  }

  // Report penalty (significant impact)
  if (factors.reportCount !== undefined) {
    reputationScore -= factors.reportCount * 15;
  }

  // Clamp component scores
  contentScore = Math.max(0, Math.min(100, contentScore));
  performanceScore = Math.max(0, Math.min(100, performanceScore));
  reputationScore = Math.max(0, Math.min(100, reputationScore));

  // Calculate weighted final score
  const finalScore = Math.round(
    contentScore * 0.35 +
    performanceScore * 0.35 +
    reputationScore * 0.30
  );

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    band: getScoreBand(finalScore),
    breakdown: {
      content: Math.round(contentScore),
      performance: Math.round(performanceScore),
      reputation: Math.round(reputationScore),
    },
  };
}

/**
 * Get the quality band for a score
 */
export function getScoreBand(score: number): QualityScoreResult['band'] {
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'good';
  if (score >= 60) return 'satisfactory';
  if (score >= 40) return 'needs_improvement';
  return 'poor';
}

/**
 * Convert a 1-5 rating to 0-100 quality score
 */
export function ratingToScore(rating: number): number {
  return Math.round((rating / 5) * 100);
}

/**
 * Convert a 0-100 score to 1-5 rating
 */
export function scoreToRating(score: number): number {
  return Math.round((score / 100) * 5 * 10) / 10; // One decimal place
}

/**
 * Convert a 0-1 normalized value to 0-100 score
 */
export function normalizedToScore(normalized: number): number {
  return Math.round(normalized * 100);
}

/**
 * Convert a 0-100 score to 0-1 normalized value
 */
export function scoreToNormalized(score: number): number {
  return score / 100;
}

/**
 * Analyze text content for quality metrics
 */
export function analyzeContentQuality(text: string): {
  lengthScore: number;
  specificityScore: number;
  constructivenessScore: number;
  combined: number;
} {
  // Length scoring (optimal: 50-300 characters)
  const length = text.trim().length;
  let lengthScore = 0;
  if (length < 20) lengthScore = 0.2;
  else if (length < 50) lengthScore = 0.5;
  else if (length <= 300) lengthScore = 1.0;
  else lengthScore = Math.max(0.7, 1 - (length - 300) / 1000);

  // Specificity (actionable suggestions)
  const actionWords = [
    'try', 'consider', 'suggest', 'recommend', 'instead',
    'better', 'improve', 'change', 'add', 'remove',
    'because', 'since', 'reason', 'would', 'could'
  ];
  const actionMatches = actionWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;
  const specificityScore = Math.min(1.0, actionMatches / 3);

  // Constructiveness
  const positiveWords = ['good', 'great', 'nice', 'love', 'like', 'excellent'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'ugly', 'horrible'];
  const constructiveWords = ['improve', 'better', 'suggestion', 'consider', 'maybe'];

  const positiveCount = positiveWords.filter(w => text.toLowerCase().includes(w)).length;
  const negativeCount = negativeWords.filter(w => text.toLowerCase().includes(w)).length;
  const constructiveCount = constructiveWords.filter(w => text.toLowerCase().includes(w)).length;

  let constructivenessScore = 0.5;
  if (constructiveCount > 0) constructivenessScore += 0.3;
  if (positiveCount > negativeCount) constructivenessScore += 0.2;
  if (negativeCount > positiveCount && constructiveCount === 0) constructivenessScore -= 0.3;
  constructivenessScore = Math.max(0, Math.min(1, constructivenessScore));

  const combined = lengthScore * 0.3 + specificityScore * 0.4 + constructivenessScore * 0.3;

  return {
    lengthScore,
    specificityScore,
    constructivenessScore,
    combined,
  };
}

/**
 * Calculate judge tier based on quality score and volume
 */
export function calculateJudgeTier(qualityScore: number, totalVerdicts: number): string {
  if (totalVerdicts < 10) return 'new';
  if (qualityScore >= 85 && totalVerdicts >= 200) return 'expert';
  if (qualityScore >= 75 && totalVerdicts >= 100) return 'gold';
  if (qualityScore >= 65 && totalVerdicts >= 50) return 'silver';
  if (qualityScore >= 55) return 'bronze';
  return 'new';
}

/**
 * Get earnings multiplier based on tier
 */
export function getTierEarningsMultiplier(tier: string): number {
  switch (tier) {
    case 'expert': return 1.5;
    case 'gold': return 1.3;
    case 'silver': return 1.1;
    case 'bronze': return 1.0;
    case 'new': return 0.8;
    default: return 1.0;
  }
}

/**
 * Check if quality score indicates probation needed
 */
export function shouldBePutOnProbation(
  qualityScore: number,
  totalVerdicts: number,
  reportCount: number
): { action: 'none' | 'probation' | 'suspend' | 'ban'; reason: string } {
  // Immediate ban conditions
  if (reportCount >= 5) {
    return { action: 'ban', reason: 'Multiple user reports' };
  }

  // Suspension conditions
  if (qualityScore < 30 && totalVerdicts >= 20) {
    return { action: 'suspend', reason: 'Poor overall quality score' };
  }

  // Probation conditions
  if (qualityScore < 50 && totalVerdicts >= 10) {
    return { action: 'probation', reason: 'Below average quality score' };
  }

  if (reportCount >= 2) {
    return { action: 'probation', reason: 'User complaints received' };
  }

  return { action: 'none', reason: '' };
}
