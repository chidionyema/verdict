import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import type { Database } from '@/lib/database.types';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface ExpertPool {
  user_id: string;
  reputation_score: number;
  expert_title: string;
  industry: string;
  total_reviews: number;
  availability_score: number; // 0-1 based on recent activity
}

interface RequestRoutingCriteria {
  request_id: string;
  category: string;
  request_tier: 'community' | 'standard' | 'pro';
  expert_only: boolean;
  priority_score: number;
}

export class ExpertRoutingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get available expert pool for a specific category and tier
   */
  async getExpertPool(
    category: string, 
    tier: 'community' | 'standard' | 'pro',
    excludeUserIds: string[] = []
  ): Promise<ExpertPool[]> {
    try {
      let query = (this.supabase
        .from('user_credits') as any)
        .select(`
          user_id,
          reputation_score,
          total_reviews,
          reviewer_status,
          last_active,
          profiles!inner(is_judge),
          expert_verifications!inner(
            job_title,
            company,
            industry,
            verification_status
          )
        `)
        .eq('profiles.is_judge', true)
        .eq('expert_verifications.verification_status', 'verified')
        .eq('reviewer_status', 'active')
        .gte('reputation_score', tier === 'pro' ? 8.0 : tier === 'standard' ? 6.5 : 5.0);

      // Filter by relevant industry/category if specified
      if (category && category !== 'general') {
        const categoryIndustryMap: Record<string, string[]> = {
          career: ['Technology', 'Finance', 'HR/Recruiting', 'Marketing', 'Sales'],
          business: ['Finance', 'Technology', 'Marketing', 'Sales'],
          appearance: ['Design', 'Marketing', 'HR/Recruiting'],
          lifestyle: ['HR/Recruiting', 'Healthcare', 'Real Estate']
        };

        const relevantIndustries = categoryIndustryMap[category];
        if (relevantIndustries?.length) {
          query = query.in('expert_verifications.industry', relevantIndustries);
        }
      }

      // Exclude specific users (e.g., request owner, already responded)
      if (excludeUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
      }

      const { data: experts, error } = await query.limit(50);

      if (error) {
        log.error('Failed to fetch expert pool', error);
        throw error;
      }

      if (!experts?.length) {
        log.info('No experts found for criteria', { category, tier, excludeCount: excludeUserIds.length });
        return [];
      }

      // Calculate availability scores and format response
      const expertPool: ExpertPool[] = experts.map((expert: any) => {
        const lastActive = expert.last_active ? new Date(expert.last_active) : new Date(0);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        
        // Availability score: 1.0 = active today, 0.5 = active this week, 0.1 = inactive
        let availabilityScore = 1.0;
        if (daysSinceActive > 1) availabilityScore = 0.8;
        if (daysSinceActive > 3) availabilityScore = 0.6;
        if (daysSinceActive > 7) availabilityScore = 0.3;
        if (daysSinceActive > 14) availabilityScore = 0.1;

        return {
          user_id: expert.user_id,
          reputation_score: expert.reputation_score || 5.0,
          expert_title: `${expert.expert_verifications.job_title} at ${expert.expert_verifications.company}`,
          industry: expert.expert_verifications.industry,
          total_reviews: expert.total_reviews || 0,
          availability_score: availabilityScore
        };
      });

      // Sort by combined score: reputation + availability + review count
      expertPool.sort((a, b) => {
        const scoreA = (a.reputation_score * 0.4) + (a.availability_score * 0.4) + (Math.min(a.total_reviews / 50, 1) * 0.2);
        const scoreB = (b.reputation_score * 0.4) + (b.availability_score * 0.4) + (Math.min(b.total_reviews / 50, 1) * 0.2);
        return scoreB - scoreA;
      });

      log.info('Expert pool retrieved', { 
        category, 
        tier, 
        expertCount: expertPool.length,
        avgReputation: expertPool.reduce((sum, e) => sum + e.reputation_score, 0) / expertPool.length
      });

      return expertPool;

    } catch (error) {
      log.error('Error getting expert pool', error);
      throw error;
    }
  }

  /**
   * Check if a request requires expert-only routing
   */
  async requiresExpertOnly(requestId: string): Promise<boolean> {
    try {
      const { data: request, error } = await (this.supabase
        .from('verdict_requests') as any)
        .select('request_tier, expert_only')
        .eq('id', requestId)
        .single();

      if (error) {
        log.error('Failed to check expert-only requirement', error);
        return false;
      }

      // Pro tier OR explicitly marked as expert-only
      return request?.request_tier === 'pro' || request?.expert_only === true;

    } catch (error) {
      log.error('Error checking expert-only requirement', error);
      return false;
    }
  }

  /**
   * Route a request to appropriate experts
   */
  async routeRequest(requestId: string): Promise<{
    success: boolean;
    expertPool: ExpertPool[];
    routingStrategy: 'expert_only' | 'mixed' | 'community';
  }> {
    try {
      // Get request details
      const { data: request, error: requestError } = await (this.supabase
        .from('verdict_requests') as any)
        .select(`
          id,
          user_id,
          category,
          request_tier,
          expert_only,
          target_verdict_count
        `)
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        throw new Error('Request not found');
      }

      // Get users who already responded
      const { data: existingResponses } = await (this.supabase
        .from('verdict_responses') as any)
        .select('judge_id')
        .eq('request_id', requestId);

      const excludeUserIds = [
        request.user_id, // Request owner
        ...(existingResponses?.map((r: any) => r.judge_id) || [])
      ];

      const requiresExpertOnly = await this.requiresExpertOnly(requestId);

      let routingStrategy: 'expert_only' | 'mixed' | 'community';
      let expertPool: ExpertPool[] = [];

      if (requiresExpertOnly) {
        // Expert-only routing for Pro tier
        routingStrategy = 'expert_only';
        expertPool = await this.getExpertPool(request.category, request.request_tier, excludeUserIds);
        
        if (expertPool.length === 0) {
          log.warn('No experts available for expert-only request', { requestId, category: request.category });
          // TODO: Could implement fallback to high-reputation community reviewers
          // or notify admins to recruit more experts in this category
        }

      } else if (request.request_tier === 'standard') {
        // Mixed routing: prefer experts but allow high-reputation community
        routingStrategy = 'mixed';
        expertPool = await this.getExpertPool(request.category, request.request_tier, excludeUserIds);
        
        // If not enough experts, the regular queue will handle community routing

      } else {
        // Community routing
        routingStrategy = 'community';
        // No special expert routing needed
      }

      // Update request with routing metadata
      await (this.supabase
        .from('verdict_requests') as any)
        .update({
          routing_strategy: routingStrategy,
          routed_at: new Date().toISOString(),
          expert_pool_size: expertPool.length
        } as any)
        .eq('id', requestId);

      log.info('Request routed', {
        requestId,
        strategy: routingStrategy,
        expertPoolSize: expertPool.length,
        tier: request.request_tier
      });

      return {
        success: true,
        expertPool,
        routingStrategy
      };

    } catch (error) {
      log.error('Error routing request', error);
      return {
        success: false,
        expertPool: [],
        routingStrategy: 'community'
      };
    }
  }

  /**
   * Get personalized queue for a specific expert
   */
  async getExpertQueue(expertUserId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get expert's verification details for category matching
      const { data: expertData, error: expertError } = await (this.supabase
        .from('expert_verifications') as any)
        .select('industry, job_title')
        .eq('user_id', expertUserId)
        .eq('verification_status', 'verified')
        .single();

      if (expertError || !expertData) {
        log.warn('Expert verification not found', { expertUserId });
        return [];
      }

      // Get requests they haven't responded to yet
      const { data: respondedRequestIds } = await (this.supabase
        .from('verdict_responses') as any)
        .select('request_id')
        .eq('judge_id', expertUserId);

      const excludeIds = respondedRequestIds?.map((r: any) => r.request_id) || [];

      // Build query for expert-appropriate requests
      let query = (this.supabase
        .from('verdict_requests') as any)
        .select(`
          id,
          created_at,
          category,
          subcategory,
          media_type,
          media_url,
          text_content,
          context,
          target_verdict_count,
          received_verdict_count,
          status,
          request_tier,
          expert_only,
          routing_strategy
        `)
        .in('status', ['open', 'in_progress'])
        .neq('user_id', expertUserId)
        .is('deleted_at', null)
        .limit(limit);

      // Exclude already responded requests
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: requests, error } = await query;

      if (error) {
        log.error('Failed to fetch expert queue', error);
        throw error;
      }

      if (!requests) {
        return [];
      }

      // Prioritize requests for this expert
      const prioritizedRequests = requests
        .map((request: any) => {
          let priority = 0;
          
          // High priority: Expert-only requests
          if (request.expert_only || request.request_tier === 'pro') {
            priority += 10;
          }
          
          // Medium priority: Standard tier
          if (request.request_tier === 'standard') {
            priority += 5;
          }
          
          // Category match bonus
          const categoryIndustryMatch: Record<string, string[]> = {
            career: ['Technology', 'Finance', 'HR/Recruiting', 'Marketing'],
            business: ['Finance', 'Technology', 'Marketing'],
            appearance: ['Design', 'Marketing'],
            lifestyle: ['HR/Recruiting', 'Healthcare']
          };
          
          const relevantIndustries = categoryIndustryMatch[request.category] || [];
          if (relevantIndustries.includes(expertData.industry)) {
            priority += 3;
          }
          
          // Time-based priority (older requests get slight boost)
          const hoursOld = (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60);
          priority += Math.min(hoursOld / 24, 2); // Max 2 points for age
          
          return { ...request, priority };
        })
        .sort((a: any, b: any) => b.priority - a.priority);

      log.info('Expert queue retrieved', {
        expertUserId,
        totalRequests: prioritizedRequests.length,
        expertOnlyCount: prioritizedRequests.filter((r: any) => r.expert_only || r.request_tier === 'pro').length
      });

      return prioritizedRequests;

    } catch (error) {
      log.error('Error getting expert queue', error);
      throw error;
    }
  }

  /**
   * Update expert availability based on activity
   */
  async updateExpertAvailability(expertUserId: string): Promise<void> {
    try {
      await (this.supabase
        .from('user_credits') as any)
        .update({
          last_active: new Date().toISOString()
        })
        .eq('user_id', expertUserId);

      log.debug('Expert availability updated', { expertUserId });

    } catch (error) {
      log.error('Error updating expert availability', error);
    }
  }
}