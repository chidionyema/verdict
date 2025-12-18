import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExpertRoutingService } from '@/lib/expert-routing';
import { log } from '@/lib/logger';

// POST /api/admin/route-experts - Manually trigger expert routing for Pro/Standard requests
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestIds, tier } = body; // Optional: specific request IDs or tier filter

    const expertRouting = new ExpertRoutingService(supabase as any);
    const results = [];

    if (requestIds && Array.isArray(requestIds)) {
      // Route specific requests
      for (const requestId of requestIds) {
        try {
          const result = await expertRouting.routeRequest(requestId);
          results.push({ requestId, ...result });
        } catch (error) {
          results.push({ 
            requestId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    } else {
      // Find and route unrouted Pro/Standard tier requests
      let query = (supabase
        .from('verdict_requests') as any)
        .select('id, request_tier, routing_strategy')
        .in('status', ['open', 'in_progress'])
        .is('routed_at', null)
        .order('created_at', { ascending: true })
        .limit(50);

      if (tier) {
        query = query.eq('request_tier', tier);
      } else {
        query = query.in('request_tier', ['pro', 'standard']);
      }

      const { data: unroutedRequests, error } = await query;

      if (error) {
        throw error;
      }

      if (!unroutedRequests?.length) {
        return NextResponse.json({
          success: true,
          message: 'No unrouted requests found',
          results: []
        });
      }

      log.info('Found unrouted requests', { count: unroutedRequests.length, tier });

      for (const req of unroutedRequests) {
        try {
          const result = await expertRouting.routeRequest(req.id);
          results.push({ requestId: req.id, tier: req.request_tier, ...result });
        } catch (error) {
          results.push({ 
            requestId: req.id, 
            tier: req.request_tier,
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    }

    // Summary statistics
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalExpertsRouted = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + ((r as any).expertPool?.length || 0), 0);

    log.info('Expert routing batch completed', {
      admin: user.id,
      totalRequests: results.length,
      successCount,
      failureCount,
      totalExpertsRouted
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRequests: results.length,
        successCount,
        failureCount,
        totalExpertsRouted
      },
      results
    });

  } catch (error) {
    log.error('Expert routing batch error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/route-experts - Get routing statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get routing statistics
    const { data: stats } = await (supabase
      .from('verdict_requests') as any)
      .select('request_tier, routing_strategy, expert_only, routed_at')
      .in('request_tier', ['pro', 'standard', 'community'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (!stats) {
      return NextResponse.json({ stats: null });
    }

    // Process statistics
    const summary = {
      total: stats.length,
      byTier: {
        pro: stats.filter((s: any) => s.request_tier === 'pro').length,
        standard: stats.filter((s: any) => s.request_tier === 'standard').length,
        community: stats.filter((s: any) => s.request_tier === 'community').length
      },
      byStrategy: {
        expert_only: stats.filter((s: any) => s.routing_strategy === 'expert_only').length,
        mixed: stats.filter((s: any) => s.routing_strategy === 'mixed').length,
        community: stats.filter((s: any) => s.routing_strategy === 'community').length
      },
      routed: stats.filter((s: any) => s.routed_at).length,
      unrouted: stats.filter((s: any) => !s.routed_at).length,
      expertOnly: stats.filter((s: any) => s.expert_only).length
    };

    // Get expert pool stats
    const { data: expertCount } = await (supabase
      .from('expert_verifications') as any)
      .select('id', { count: 'exact' })
      .eq('verification_status', 'verified');

    return NextResponse.json({
      summary,
      expertPool: {
        totalExperts: expertCount?.length || 0
      },
      period: '7 days'
    });

  } catch (error) {
    log.error('Routing stats error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}