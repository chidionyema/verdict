// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateContext,
  validateCategory,
  validateMediaType,
} from '@/lib/validations';

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
    const { category, subcategory, media_type, media_url, text_content, context } =
      body;

    // Validate category
    if (!validateCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

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

    // Ensure profile exists and has credits
    let { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    // Create profile if it doesn't exist (clean application-level approach)
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'User',
          credits: 3,
          is_judge: false,
          is_admin: false
        })
        .select('credits')
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    if (profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more.' },
        { status: 402 }
      );
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return NextResponse.json(
        { 
          error: 'Failed to process request', 
          details: creditError.message,
          code: creditError.code,
          hint: creditError.hint
        },
        { status: 500 }
      );
    }

    // Create the request
    const { data: newRequest, error: createError } = await supabase
      .from('verdict_requests')
      .insert({
        user_id: user.id,
        category,
        subcategory: subcategory || null,
        media_type,
        media_url: media_type === 'photo' ? media_url : null,
        text_content: media_type === 'text' ? text_content : null,
        context,
        status: 'in_progress', // Changed from 'pending' to 'in_progress' so judges can see it
        target_verdict_count: 3, // Reduced to 3 for 40%+ profit margin (standard tier)
        received_verdict_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create request error:', createError);
      // Refund credit on failure
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id);
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }

    // No cache to invalidate

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('POST /api/requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
