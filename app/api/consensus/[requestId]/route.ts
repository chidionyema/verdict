import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ConsensusEngine } from '@/lib/consensus';
import { log } from '@/lib/logger';

// POST /api/consensus/[requestId] - Generate consensus analysis for Pro tier request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const supabase = await createServiceClient();

    // Fetch the request and verify it's eligible for consensus
    const { data: verdictRequest, error: requestError } = await (supabase
      .from('verdict_requests') as any)
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Verify this is a Pro tier request with enough verdicts
    if (verdictRequest.request_tier !== 'pro') {
      return NextResponse.json(
        { error: 'Consensus analysis only available for Pro tier requests' },
        { status: 400 }
      );
    }

    if (verdictRequest.received_verdict_count < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 verdicts for consensus analysis' },
        { status: 400 }
      );
    }

    // Check if consensus already exists
    const { data: existingConsensus } = await (supabase
      .from('consensus_analysis') as any)
      .select('id, status')
      .eq('request_id', requestId)
      .single();

    if (existingConsensus?.status === 'completed') {
      return NextResponse.json(
        { message: 'Consensus analysis already exists', consensusId: existingConsensus.id },
        { status: 200 }
      );
    }

    if (existingConsensus?.status === 'pending') {
      return NextResponse.json(
        { message: 'Consensus analysis already in progress', consensusId: existingConsensus.id },
        { status: 202 }
      );
    }

    // Fetch all verdicts for this request
    const { data: verdicts, error: verdictsError } = await (supabase
      .from('verdict_responses') as any)
      .select('*')
      .eq('request_id', requestId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true });

    if (verdictsError || !verdicts || verdicts.length < 2) {
      log.error('Failed to fetch verdicts for consensus', { 
        requestId, 
        error: verdictsError,
        verdictCount: verdicts?.length 
      });
      return NextResponse.json(
        { error: 'Insufficient verdicts for consensus analysis' },
        { status: 400 }
      );
    }

    // Create or update pending consensus analysis record
    const { data: consensusRecord, error: consensusError } = await (supabase
      .from('consensus_analysis') as any)
      .upsert({
        request_id: requestId,
        expert_count: verdicts.length,
        status: 'pending',
        started_at: new Date().toISOString()
      }, { 
        onConflict: 'request_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (consensusError) {
      log.error('Failed to create consensus analysis record', consensusError);
      return NextResponse.json(
        { error: 'Failed to initialize consensus analysis' },
        { status: 500 }
      );
    }

    // Generate consensus analysis
    try {
      const engine = new ConsensusEngine();
      const result = await engine.synthesizeVerdicts(
        verdicts,
        verdictRequest.context,
        verdictRequest.category
      );

      // Save the completed analysis
      const { error: updateError } = await (supabase
        .from('consensus_analysis') as any)
        .update({
          synthesis: result.synthesis,
          confidence_score: result.confidence_score,
          agreement_level: result.agreement_level,
          key_themes: result.key_themes,
          conflicts: result.conflicts,
          recommendations: result.recommendations,
          expert_breakdown: result.expert_breakdown,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', consensusRecord.id);

      if (updateError) {
        throw updateError;
      }

      log.info('Consensus analysis completed', {
        requestId,
        consensusId: consensusRecord.id,
        confidence: result.confidence_score,
        agreement: result.agreement_level
      });

      return NextResponse.json({
        message: 'Consensus analysis generated successfully',
        consensusId: consensusRecord.id,
        preview: {
          confidence_score: result.confidence_score,
          agreement_level: result.agreement_level,
          key_themes: result.key_themes.slice(0, 3)
        }
      });

    } catch (analysisError: any) {
      // Mark as failed
      await (supabase
        .from('consensus_analysis') as any)
        .update({
          status: 'failed',
          error_message: analysisError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', consensusRecord.id);

      log.error('Consensus analysis failed', {
        requestId,
        consensusId: consensusRecord.id,
        error: analysisError
      });

      return NextResponse.json(
        { error: 'Failed to generate consensus analysis', details: analysisError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    log.error('Consensus API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/consensus/[requestId] - Get consensus analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this request
    const { data: verdictRequest, error: requestError } = await (supabase
      .from('verdict_requests') as any)
      .select('user_id, request_tier')
      .eq('id', requestId)
      .single();

    if (requestError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (verdictRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (verdictRequest.request_tier !== 'pro') {
      return NextResponse.json(
        { error: 'Consensus analysis only available for Pro tier requests' },
        { status: 400 }
      );
    }

    // Fetch consensus analysis
    const { data: consensus, error: consensusError } = await (supabase
      .from('consensus_analysis') as any)
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (consensusError) {
      return NextResponse.json({ error: 'Consensus analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ consensus });

  } catch (error) {
    log.error('Get consensus API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}