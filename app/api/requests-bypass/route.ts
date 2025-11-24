// @ts-nocheck
// Temporary bypass endpoint for creating requests without RLS issues
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  validateContext,
  validateCategory,
  validateMediaType,
} from '@/lib/validations';

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

    // Validate inputs
    if (!validateCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!validateMediaType(media_type)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    const contextValidation = validateContext(context);
    if (!contextValidation.valid) {
      return NextResponse.json(
        { error: contextValidation.error },
        { status: 400 }
      );
    }

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

    // Create service client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's current credits
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more.' },
        { status: 402 }
      );
    }

    // Start a transaction-like operation
    // 1. Deduct credit
    const { error: creditError } = await serviceSupabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return NextResponse.json(
        { error: 'Failed to deduct credits', details: creditError },
        { status: 500 }
      );
    }

    // 2. Create the request
    const { data: newRequest, error: createError } = await serviceSupabase
      .from('verdict_requests')
      .insert({
        user_id: user.id,
        category,
        subcategory: subcategory || null,
        media_type,
        media_url: media_type === 'photo' ? media_url : null,
        text_content: media_type === 'text' ? text_content : null,
        context,
        status: 'open',
        target_verdict_count: 10,
        received_verdict_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create request error:', createError);
      // Refund credit on failure
      await serviceSupabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'Failed to create request', details: createError },
        { status: 500 }
      );
    }

    // Clear any caches
    try {
      const { cache, cacheKeys } = await import('@/lib/cache');
      cache.delete(cacheKeys.userProfile(user.id));
      cache.delete(cacheKeys.userCredits(user.id));
    } catch (e) {
      // Cache clearing is optional
    }

    console.log('Request created successfully:', newRequest.id);

    return NextResponse.json({
      success: true,
      request: newRequest,
      remainingCredits: profile.credits - 1,
      message: 'Request created successfully using bypass endpoint',
    });
  } catch (error) {
    console.error('Request creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}