import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

interface SplitTestData {
  id: string;
  title: string;
  description: string;
  category: string;
  hypothesis: string;
  success_criteria: string;
  variant_a_title: string;
  variant_a_description: string;
  variant_a_image_url?: string;
  variant_b_title: string;
  variant_b_description: string;
  variant_b_image_url?: string;
  request_tier: string;
  target_verdict_count: number;
  received_verdict_count: number;
}

async function GET_Handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: splitTestId } = await params;

    if (!splitTestId) {
      return NextResponse.json(
        { error: 'Split test ID is required' },
        { status: 400 }
      );
    }

    // Validate splitTestId as UUID
    if (!isValidUUID(splitTestId)) {
      return NextResponse.json({ error: 'Invalid split test ID format' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the split test request
    const { data: splitTest, error: splitTestError } = await supabase
      .from('split_test_requests')
      .select(`
        id,
        created_at,
        user_id,
        category,
        question,
        context,
        photo_a_url,
        photo_a_filename,
        photo_b_url,
        photo_b_filename,
        status,
        visibility,
        target_verdict_count,
        received_verdict_count,
        winning_photo,
        consensus_strength,
        completed_at
      `)
      .eq('id', splitTestId)
      .maybeSingle();

    if (splitTestError) {
      console.error('Split test query error:', splitTestError);
      return NextResponse.json(
        { error: 'Failed to fetch split test' },
        { status: 500 }
      );
    }

    if (!splitTest) {
      return NextResponse.json(
        { error: 'Split test not found' },
        { status: 404 }
      );
    }

    const splitTestData = splitTest as any;

    // Check if user has access to this split test
    // For judges: they can access if it's open/in_progress and they haven't already judged it
    // For creators: they can always access their own split tests
    const isCreator = splitTestData.user_id === user.id;
    
    if (!isCreator) {
      // Check if it's available for judging
      if (splitTestData.status !== 'open' && splitTestData.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Split test is not available for judging' },
          { status: 403 }
        );
      }

      // Check if judge has already submitted a verdict
      const { data: existingVerdict } = await supabase
        .from('split_test_verdicts')
        .select('id')
        .eq('split_test_id', splitTestId)
        .eq('judge_id', user.id)
        .maybeSingle();

      if (existingVerdict) {
        return NextResponse.json(
          { error: 'You have already submitted a verdict for this split test' },
          { status: 409 }
        );
      }

      // Check if target verdicts already reached
      if (splitTestData.received_verdict_count >= splitTestData.target_verdict_count) {
        return NextResponse.json(
          { error: 'Split test has already received enough verdicts' },
          { status: 410 }
        );
      }
    }

    // Transform the data to match the judge page expectations
    const transformedSplitTest: SplitTestData = {
      id: splitTestData.id,
      title: splitTestData.question || 'Split Test Comparison',
      description: splitTestData.context || 'Compare these two photos and provide feedback.',
      category: splitTestData.category || 'general',
      hypothesis: `Photo A will perform better than Photo B based on ${splitTestData.context || 'visual appeal and effectiveness'}.`,
      success_criteria: 'Clear preference from judges with detailed reasoning for the choice.',
      variant_a_title: 'Photo A',
      variant_a_description: splitTestData.photo_a_filename || 'First photo option',
      variant_a_image_url: splitTestData.photo_a_url,
      variant_b_title: 'Photo B', 
      variant_b_description: splitTestData.photo_b_filename || 'Second photo option',
      variant_b_image_url: splitTestData.photo_b_url,
      request_tier: 'community', // Split tests are currently community tier
      target_verdict_count: splitTestData.target_verdict_count,
      received_verdict_count: splitTestData.received_verdict_count,
    };

    return NextResponse.json({
      success: true,
      splitTest: transformedSplitTest,
      metadata: {
        status: splitTestData.status,
        visibility: splitTestData.visibility,
        created_at: splitTestData.created_at,
        completed_at: splitTestData.completed_at,
        winning_photo: splitTestData.winning_photo,
        consensus_strength: splitTestData.consensus_strength,
        is_creator: isCreator,
      }
    });

  } catch (error) {
    console.error('Error fetching split test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to split test endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);