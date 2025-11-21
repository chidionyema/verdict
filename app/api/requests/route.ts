import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateContext,
  validateCategory,
  validateMediaType,
} from '@/lib/validations';

// GET /api/requests - List current user's requests
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: requests, error } = await supabase
      .from('verdict_requests')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch requests error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('GET /api/requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Check user credits (for MVP, we give 3 free credits on signup)
    const { data: profile } = await supabase
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

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return NextResponse.json(
        { error: 'Failed to process request' },
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
        status: 'open',
        target_verdict_count: 10,
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

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('POST /api/requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
