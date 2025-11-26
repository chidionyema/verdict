// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateContext,
  validateCategory,
  validateMediaType,
  VERDICT_TIERS,
  VERDICT_TIER_PRICING,
} from '@/lib/validations';
import { createVerdictRequest } from '@/lib/verdicts';

// GET /api/requests - List current user's requests
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  try {
    console.log('GET /api/requests: Starting...');
    
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('GET /api/requests: Auth failed', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET /api/requests: User authenticated:', user.id);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('GET /api/requests: Query params', { limit, offset });

    const { data: requests, error } = await supabase
      .from('verdict_requests')
      .select('id, category, subcategory, media_type, media_url, text_content, context, status, target_verdict_count, received_verdict_count, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('GET /api/requests: Query result', { 
      requestCount: requests?.length, 
      error: error?.message 
    });

    if (error) {
      console.error('GET /api/requests: Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('GET /api/requests: Returning success with', requests?.length, 'requests');
    const response = NextResponse.json({ requests: requests || [] });
    response.headers.set('X-Response-Time', `${Math.round(performance.now() - startTime)}ms`);
    return response;

  } catch (error) {
    console.error('GET /api/requests: Catch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/requests - Create a new verdict request
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

    const body = await request.json();
    const {
      category,
      subcategory,
      media_type,
      media_url,
      text_content,
      context,
      tier,
    } = body;

    // Validate category
    if (!validateCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Determine tier (defaults to basic)
    const normalizedTier =
      tier && VERDICT_TIER_PRICING[tier as keyof typeof VERDICT_TIER_PRICING]
        ? (tier as keyof typeof VERDICT_TIER_PRICING)
        : 'basic';

    const tierConfig = VERDICT_TIER_PRICING[normalizedTier];

    // Validate media_type
    if (!validateMediaType(media_type)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Validate context
    const contextValidation = validateContext(context);
    if (!contextValidation.valid) {
      return NextResponse.json(
        { error: contextValidation.error },
        { status: 400 }
      );
    }

    // Validate media based on type
    if (media_type === 'photo' && !media_url) {
      return NextResponse.json(
        { error: 'Photo URL is required for photo requests' },
        { status: 400 }
      );
    }
    if (media_type === 'text' && !text_content) {
      return NextResponse.json(
        { error: 'Text content is required for text requests' },
        { status: 400 }
      );
    }

    // Delegate to domain logic for credits + request creation
    try {
      const { request: createdRequest } = await createVerdictRequest(
        supabase,
        {
          userId: user.id,
          email: user.email,
          category,
          subcategory,
          media_type,
          media_url,
          text_content,
          context,
          // Use finance-approved tier config
          creditsToCharge: tierConfig.credits,
          targetVerdictCount: tierConfig.verdicts,
        }
      );

      return NextResponse.json({ request: createdRequest }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          { error: 'Insufficient credits. Please purchase more.' },
          { status: 402 }
        );
      }

      console.error('Create request error:', err);
      return NextResponse.json(
        { error: 'Failed to create request', details: err?.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
