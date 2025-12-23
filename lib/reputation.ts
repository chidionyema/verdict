import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';

type ReviewerRating = Database['public']['Tables']['reviewer_ratings']['Row'];
type ExpertVerification = Database['public']['Tables']['expert_verifications']['Row'];
type ReputationHistory = Database['public']['Tables']['reputation_history']['Row'];

export interface ReviewerReputation {
  user_id: string;
  reputation_score: number;
  reviewer_status: 'active' | 'probation' | 'calibration_required';
  total_reviews: number;
  consensus_rate: number;
  last_calibration: string | null;
  helpfulness_average: number;
  quality_average: number;
  is_expert: boolean;
  expert_title?: string;
}

export interface QualityMetrics {
  length_score: number; // 0-1 based on response length
  specificity_score: number; // 0-1 based on concrete suggestions
  sentiment_score: number; // 0-1 based on constructive tone
  combined_score: number; // Weighted average
}

export class ReputationManager {
  private _supabase: ReturnType<typeof createClient> | null = null;

  // Lazy initialization to avoid build-time errors when env vars aren't set
  private get supabase(): ReturnType<typeof createClient> {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  /**
   * Calculate quality score for a review response
   */
  analyzeResponseQuality(response: string): QualityMetrics {
    // Length scoring (optimal range: 50-300 characters)
    const length = response.length;
    let lengthScore = 0;
    if (length < 20) lengthScore = 0.2;
    else if (length < 50) lengthScore = 0.5;
    else if (length <= 300) lengthScore = 1.0;
    else lengthScore = Math.max(0.7, 1 - (length - 300) / 1000);

    // Specificity scoring (look for concrete suggestions)
    const specificityKeywords = [
      'try', 'consider', 'suggest', 'recommend', 'instead',
      'better', 'improve', 'change', 'add', 'remove',
      'because', 'since', 'reason', 'would', 'could'
    ];
    const specificityMatches = specificityKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length;
    const specificityScore = Math.min(1.0, specificityMatches / 3);

    // Sentiment scoring (constructive vs destructive)
    const positiveWords = ['good', 'great', 'nice', 'love', 'like', 'excellent', 'works', 'solid'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'ugly', 'horrible', 'sucks'];
    const constructiveWords = ['improve', 'better', 'suggestion', 'consider', 'maybe', 'could'];
    
    const positiveCount = positiveWords.filter(w => response.toLowerCase().includes(w)).length;
    const negativeCount = negativeWords.filter(w => response.toLowerCase().includes(w)).length;
    const constructiveCount = constructiveWords.filter(w => response.toLowerCase().includes(w)).length;
    
    // Prefer constructive feedback over purely positive/negative
    let sentimentScore = 0.5; // Neutral baseline
    if (constructiveCount > 0) sentimentScore += 0.3;
    if (positiveCount > negativeCount) sentimentScore += 0.2;
    if (negativeCount > positiveCount && constructiveCount === 0) sentimentScore -= 0.3;
    sentimentScore = Math.max(0, Math.min(1, sentimentScore));

    const combinedScore = (
      lengthScore * 0.3 + 
      specificityScore * 0.4 + 
      sentimentScore * 0.3
    );

    return {
      length_score: lengthScore,
      specificity_score: specificityScore,
      sentiment_score: sentimentScore,
      combined_score: combinedScore
    };
  }

  /**
   * Calculate consensus rate for a reviewer
   */
  async calculateConsensusRate(reviewerId: string): Promise<number> {
    try {
      // Get all responses by this reviewer
      const { data: responses, error } = await (this.supabase
        .from('feedback_responses') as any)
        .select('id, rating, request_id, reviewer_id')
        .eq('reviewer_id', reviewerId);

      if (error || !responses?.length) return 1.0; // Default for new users

      let consensusCount = 0;
      let totalEvaluated = 0;

      // For each response, check if it aligns with majority
      for (const response of responses) {
        const { data: allResponses } = await (this.supabase
          .from('feedback_responses') as any)
          .select('rating')
          .eq('request_id', response.request_id);

        if (!allResponses || allResponses.length < 2) continue;

        // Calculate majority verdict
        const ratings = allResponses.map((r: any) => r.rating);
        const averageRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
        const majorityVerdict = averageRating >= 6 ? 'positive' : 'negative';
        
        // Check if this reviewer's verdict aligns
        const reviewerVerdict = response.rating >= 6 ? 'positive' : 'negative';
        
        if (reviewerVerdict === majorityVerdict) {
          consensusCount++;
        }
        totalEvaluated++;
      }

      return totalEvaluated > 0 ? consensusCount / totalEvaluated : 1.0;
    } catch (error) {
      console.error('Error calculating consensus rate:', error);
      return 1.0;
    }
  }

  /**
   * Calculate helpfulness average for a reviewer
   */
  async calculateHelpfulnessAverage(reviewerId: string): Promise<number> {
    try {
      const { data: ratings, error } = await (this.supabase
        .from('reviewer_ratings') as any)
        .select('helpfulness_rating, created_at')
        .eq('reviewer_id', reviewerId)
        .order('created_at', { ascending: false });

      if (error || !ratings?.length) return 5.0; // Default for new users

      // Weight recent ratings more heavily
      let weightedSum = 0;
      let totalWeight = 0;

      ratings.forEach((rating: any, index: number) => {
        // More recent ratings get higher weight
        const weight = Math.max(0.5, 1 - (index / ratings.length) * 0.5);
        weightedSum += rating.helpfulness_rating * weight;
        totalWeight += weight;
      });

      return weightedSum / totalWeight;
    } catch (error) {
      console.error('Error calculating helpfulness average:', error);
      return 5.0;
    }
  }

  /**
   * Calculate quality average for a reviewer's responses
   */
  async calculateQualityAverage(reviewerId: string): Promise<number> {
    try {
      const { data: ratings, error } = await (this.supabase
        .from('reviewer_ratings') as any)
        .select('quality_score, created_at')
        .eq('reviewer_id', reviewerId)
        .not('quality_score', 'is', null)
        .order('created_at', { ascending: false });

      if (error || !ratings?.length) return 5.0; // Default for new users

      // Weight recent scores more heavily
      let weightedSum = 0;
      let totalWeight = 0;

      ratings.forEach((rating: any, index: number) => {
        const weight = Math.max(0.5, 1 - (index / ratings.length) * 0.5);
        weightedSum += (rating.quality_score || 5.0) * weight;
        totalWeight += weight;
      });

      return weightedSum / totalWeight;
    } catch (error) {
      console.error('Error calculating quality average:', error);
      return 5.0;
    }
  }

  /**
   * Calculate overall reputation score
   */
  async calculateReputationScore(reviewerId: string): Promise<number> {
    const helpfulnessAvg = await this.calculateHelpfulnessAverage(reviewerId);
    const consensusRate = await this.calculateConsensusRate(reviewerId);
    const qualityAvg = await this.calculateQualityAverage(reviewerId);

    // Weighted combination: Helpfulness (50%), Consensus (30%), Quality (20%)
    const reputationScore = (
      helpfulnessAvg * 0.5 +
      (consensusRate * 5) * 0.3 + // Convert 0-1 to 0-5 scale
      qualityAvg * 0.2
    );

    return Math.max(1.0, Math.min(5.0, reputationScore));
  }

  /**
   * Determine reviewer status based on reputation score
   */
  determineReviewerStatus(score: number, totalReviews: number): 'active' | 'probation' | 'calibration_required' {
    // New users (< 10 reviews) get grace period
    if (totalReviews < 10) return 'active';
    
    if (score < 2.0) return 'calibration_required';
    if (score < 3.0) return 'probation';
    return 'active';
  }

  /**
   * Update a reviewer's reputation
   */
  async updateReviewerReputation(reviewerId: string, triggerEvent: string, triggerId?: string): Promise<ReviewerReputation> {
    try {
      // Get current reputation data
      const { data: currentData, error: fetchError } = await (this.supabase
        .from('profiles') as any)
        .select('reputation_score, reviewer_status, consensus_rate, total_reviews, last_calibration')
        .eq('id', reviewerId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new metrics
      const helpfulnessAvg = await this.calculateHelpfulnessAverage(reviewerId);
      const consensusRate = await this.calculateConsensusRate(reviewerId);
      const qualityAvg = await this.calculateQualityAverage(reviewerId);
      const newScore = await this.calculateReputationScore(reviewerId);
      const newStatus = this.determineReviewerStatus(newScore, currentData.total_reviews || 0);

      // Check if user is an expert
      const { data: expertData } = await (this.supabase
        .from('expert_verifications') as any)
        .select('job_title, company, verification_status')
        .eq('user_id', reviewerId)
        .eq('verification_status', 'verified')
        .single();

      // Update profiles table
      const { error: updateError } = await (this.supabase
        .from('profiles') as any)
        .update({
          reputation_score: newScore,
          reviewer_status: newStatus,
          consensus_rate: consensusRate,
          total_reviews: currentData.total_reviews || 0
        })
        .eq('id', reviewerId);

      if (updateError) throw updateError;

      // Log reputation change if significant
      if (Math.abs(newScore - (currentData.reputation_score || 5.0)) > 0.1 || 
          newStatus !== currentData.reviewer_status) {
        
        await (this.supabase
          .from('reputation_history') as any)
          .insert({
            user_id: reviewerId,
            old_score: currentData.reputation_score,
            new_score: newScore,
            old_status: currentData.reviewer_status,
            new_status: newStatus,
            trigger_event: triggerEvent,
            trigger_id: triggerId
          });
      }

      return {
        user_id: reviewerId,
        reputation_score: newScore,
        reviewer_status: newStatus,
        total_reviews: currentData.total_reviews || 0,
        consensus_rate: consensusRate,
        last_calibration: currentData.last_calibration,
        helpfulness_average: helpfulnessAvg,
        quality_average: qualityAvg,
        is_expert: !!expertData,
        expert_title: expertData ? `${expertData.job_title} at ${expertData.company}` : undefined
      };

    } catch (error) {
      console.error('Error updating reviewer reputation:', error);
      throw error;
    }
  }

  /**
   * Submit a helpfulness rating for a review
   */
  async rateReview(responseId: string, helpfulnessRating: number, ratedBy: string): Promise<void> {
    try {
      // Get the response details
      const { data: response, error: responseError } = await (this.supabase
        .from('feedback_responses') as any)
        .select('reviewer_id, request_id')
        .eq('id', responseId)
        .single();

      if (responseError || !response) throw new Error('Response not found');

      // Don't allow self-rating
      if (response.reviewer_id === ratedBy) {
        throw new Error('Cannot rate your own review');
      }

      // Calculate quality score for the response
      const { data: responseText } = await (this.supabase
        .from('feedback_responses') as any)
        .select('feedback')
        .eq('id', responseId)
        .single();

      const qualityMetrics = this.analyzeResponseQuality(responseText?.feedback || '');

      // Insert the rating
      const { error: insertError } = await (this.supabase
        .from('reviewer_ratings') as any)
        .insert({
          reviewer_id: response.reviewer_id,
          request_id: response.request_id,
          response_id: responseId,
          helpfulness_rating: helpfulnessRating,
          quality_score: qualityMetrics.combined_score * 5, // Convert to 0-5 scale
          rated_by: ratedBy
        });

      if (insertError) throw insertError;

      // Update the reviewer's reputation
      await this.updateReviewerReputation(response.reviewer_id, 'rating_received', responseId);

    } catch (error) {
      console.error('Error rating review:', error);
      throw error;
    }
  }

  /**
   * Get reviewer reputation data
   */
  async getReviewerReputation(reviewerId: string): Promise<ReviewerReputation | null> {
    try {
      const { data: userData, error } = await (this.supabase
        .from('profiles') as any)
        .select('reputation_score, reviewer_status, total_reviews, consensus_rate, last_calibration')
        .eq('id', reviewerId)
        .single();

      if (error || !userData) return null;

      const helpfulnessAvg = await this.calculateHelpfulnessAverage(reviewerId);
      const qualityAvg = await this.calculateQualityAverage(reviewerId);

      // Check expert status
      const { data: expertData } = await (this.supabase
        .from('expert_verifications') as any)
        .select('job_title, company, verification_status')
        .eq('user_id', reviewerId)
        .eq('verification_status', 'verified')
        .single();

      return {
        user_id: reviewerId,
        reputation_score: userData.reputation_score || 5.0,
        reviewer_status: userData.reviewer_status || 'active',
        total_reviews: userData.total_reviews || 0,
        consensus_rate: userData.consensus_rate || 1.0,
        last_calibration: userData.last_calibration,
        helpfulness_average: helpfulnessAvg,
        quality_average: qualityAvg,
        is_expert: !!expertData,
        expert_title: expertData ? `${expertData.job_title} at ${expertData.company}` : undefined
      };

    } catch (error) {
      console.error('Error getting reviewer reputation:', error);
      return null;
    }
  }

  /**
   * Check if user can earn credits (not on probation/calibration)
   */
  async canEarnCredits(reviewerId: string): Promise<boolean> {
    const reputation = await this.getReviewerReputation(reviewerId);
    return reputation?.reviewer_status === 'active';
  }

  /**
   * Get users who need calibration
   */
  async getUsersNeedingCalibration(): Promise<string[]> {
    try {
      const { data: users, error } = await (this.supabase
        .from('profiles') as any)
        .select('id')
        .eq('reviewer_status', 'calibration_required');

      if (error) throw error;
      return users?.map((u: any) => u.id) || [];
    } catch (error) {
      console.error('Error getting users needing calibration:', error);
      return [];
    }
  }
}

export const reputationManager = new ReputationManager();