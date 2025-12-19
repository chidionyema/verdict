import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/comparisons/[id] - Get a single comparison by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: comparisonId } = await params;

    if (!comparisonId) {
      return NextResponse.json(
        { error: 'Comparison ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the comparison
    const { data: comparison, error } = await supabase
      .from('comparison_requests')
      .select('*')
      .eq('id', comparisonId)
      .single();

    if (error || !comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    const comparisonData = comparison as any;

    // Check visibility - private comparisons can only be viewed by owner or judges
    if (comparisonData.visibility === 'private') {
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required to view this comparison' },
          { status: 401 }
        );
      }

      // Allow owner to view
      const isOwner = comparisonData.user_id === user.id;

      // Allow judges to view if comparison is open
      const isJudge = user ? await checkIfJudge(supabase, user.id) : false;
      const isOpenForJudging = ['open', 'pending', 'active', 'in_review'].includes(comparisonData.status);

      if (!isOwner && !(isJudge && isOpenForJudging)) {
        return NextResponse.json(
          { error: 'You do not have permission to view this comparison' },
          { status: 403 }
        );
      }
    }

    // Parse decision_context if it's a string
    let decisionContext = comparisonData.decision_context;
    if (typeof decisionContext === 'string') {
      try {
        decisionContext = JSON.parse(decisionContext);
      } catch {
        decisionContext = {};
      }
    }

    // Format response
    const formattedComparison = {
      id: comparisonData.id,
      question: comparisonData.question,
      category: comparisonData.category,
      option_a_title: comparisonData.option_a_title,
      option_a_description: comparisonData.option_a_description,
      option_a_image_url: comparisonData.option_a_image_url,
      option_b_title: comparisonData.option_b_title,
      option_b_description: comparisonData.option_b_description,
      option_b_image_url: comparisonData.option_b_image_url,
      decision_context: decisionContext,
      request_tier: comparisonData.request_tier,
      target_verdict_count: comparisonData.target_verdict_count,
      received_verdict_count: comparisonData.received_verdict_count,
      status: comparisonData.status,
      visibility: comparisonData.visibility,
      winner_option: comparisonData.winner_option,
      created_at: comparisonData.created_at,
      updated_at: comparisonData.updated_at,
      is_owner: user?.id === comparisonData.user_id,
    };

    return NextResponse.json({
      comparison: formattedComparison,
    });

  } catch (error) {
    console.error('Error fetching comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkIfJudge(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', userId)
      .single();

    return (data as any)?.is_judge === true;
  } catch {
    return false;
  }
}
