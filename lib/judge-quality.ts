'use client';

export interface JudgePerformance {
  id: string;
  judgeId: string;
  totalVerdicts: number;
  averageRating: number;
  averageResponseTime: number; // in minutes
  qualityScore: number; // 0-100
  reportCount: number;
  lastActive: Date;
  status: 'active' | 'probation' | 'suspended' | 'banned';
  tier: 'new' | 'bronze' | 'silver' | 'gold' | 'expert';
}

export interface VerdictRating {
  verdictId: string;
  requestUserId: string;
  rating: number; // 1-5 stars
  feedback?: string;
  helpful: boolean;
  createdAt: Date;
}

export interface JudgeReport {
  judgeId: string;
  reportedBy: string;
  reason: 'inappropriate' | 'unhelpful' | 'offensive' | 'spam' | 'other';
  description: string;
  verdictId?: string;
  createdAt: Date;
}

export class JudgeQualityManager {
  
  // Calculate judge quality score based on multiple factors
  calculateQualityScore(performance: {
    averageRating: number;
    totalVerdicts: number;
    responseTime: number;
    reportCount: number;
    accountAge: number; // days
  }): number {
    let score = 100;

    // Rating component (40% weight)
    if (performance.averageRating > 0) {
      const ratingScore = (performance.averageRating / 5.0) * 40;
      score = ratingScore;
    } else {
      score = 30; // Default for no ratings yet
    }

    // Volume bonus (20% weight) - more verdicts = more reliable
    const volumeBonus = Math.min(20, Math.log10(performance.totalVerdicts + 1) * 8);
    score += volumeBonus;

    // Response time component (20% weight)
    const idealResponseTime = 60; // 1 hour
    const responseScore = Math.max(0, 20 - (performance.responseTime / idealResponseTime) * 10);
    score += responseScore;

    // Account reliability (10% weight)
    const reliabilityScore = Math.min(10, performance.accountAge / 30 * 10); // Max after 30 days
    score += reliabilityScore;

    // Report penalty (can reduce score significantly)
    const reportPenalty = performance.reportCount * 15;
    score -= reportPenalty;

    // Experience bonus (10% weight)
    if (performance.totalVerdicts > 100) score += 5;
    if (performance.totalVerdicts > 500) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Determine judge tier based on performance
  calculateJudgeTier(performance: JudgePerformance): JudgePerformance['tier'] {
    const { qualityScore, totalVerdicts } = performance;

    if (totalVerdicts < 10) return 'new';
    if (qualityScore >= 85 && totalVerdicts >= 200) return 'expert';
    if (qualityScore >= 75 && totalVerdicts >= 100) return 'gold';
    if (qualityScore >= 65 && totalVerdicts >= 50) return 'silver';
    if (qualityScore >= 55) return 'bronze';
    
    return 'new';
  }

  // Check if judge should be put on probation or suspended
  shouldTakeAction(performance: JudgePerformance): {
    action: 'none' | 'probation' | 'suspend' | 'ban';
    reason: string;
  } {
    const { qualityScore, reportCount, averageRating, totalVerdicts, averageResponseTime } = performance;

    // Immediate ban conditions
    if (reportCount >= 5) {
      return { action: 'ban', reason: 'Multiple user reports' };
    }

    if (averageRating < 2.0 && totalVerdicts >= 10) {
      return { action: 'ban', reason: 'Consistently poor ratings' };
    }

    // Suspension conditions
    if (qualityScore < 30 && totalVerdicts >= 20) {
      return { action: 'suspend', reason: 'Poor overall quality score' };
    }

    if (averageResponseTime > 1440 && totalVerdicts >= 5) { // 24 hours
      return { action: 'suspend', reason: 'Extremely slow response times' };
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

  // Calculate judge earnings multiplier based on tier
  getEarningsMultiplier(tier: JudgePerformance['tier']): number {
    switch (tier) {
      case 'expert': return 1.5;  // 50% bonus
      case 'gold': return 1.3;    // 30% bonus
      case 'silver': return 1.1;  // 10% bonus
      case 'bronze': return 1.0;  // Base rate
      case 'new': return 0.8;     // 20% reduction until proven
      default: return 1.0;
    }
  }

  // Get judge priority for request assignment (higher = more likely to get requests)
  getAssignmentPriority(performance: JudgePerformance): number {
    const { tier, qualityScore, averageResponseTime, status } = performance;

    if (status !== 'active') return 0;

    let priority = qualityScore;

    // Tier bonuses
    switch (tier) {
      case 'expert': priority += 20; break;
      case 'gold': priority += 15; break;
      case 'silver': priority += 10; break;
      case 'bronze': priority += 5; break;
      case 'new': priority -= 10; break;
    }

    // Response time bonus (faster judges get priority)
    if (averageResponseTime < 30) priority += 10;      // < 30 min
    else if (averageResponseTime < 60) priority += 5;  // < 1 hour
    else if (averageResponseTime > 240) priority -= 10; // > 4 hours

    return Math.max(0, Math.min(150, priority));
  }

  // Generate judge performance insights
  generateInsights(performance: JudgePerformance): string[] {
    const insights: string[] = [];
    const { qualityScore, averageRating, averageResponseTime, totalVerdicts, tier } = performance;

    if (qualityScore >= 80) {
      insights.push('🌟 Excellent judge performance!');
    } else if (qualityScore < 50) {
      insights.push('⚠️ Performance needs improvement');
    }

    if (averageRating >= 4.5) {
      insights.push('👍 Users love your feedback');
    } else if (averageRating < 3.0) {
      insights.push('📝 Consider providing more helpful feedback');
    }

    if (averageResponseTime < 30) {
      insights.push('⚡ Lightning fast responses!');
    } else if (averageResponseTime > 120) {
      insights.push('🐌 Try to respond faster for better ratings');
    }

    if (totalVerdicts >= 500) {
      insights.push('🏆 Veteran judge - incredible dedication!');
    } else if (totalVerdicts >= 100) {
      insights.push('💪 Experienced judge');
    }

    if (tier === 'expert') {
      insights.push('👑 Elite judge status - you inspire others!');
    }

    return insights;
  }
}

export const judgeQuality = new JudgeQualityManager();