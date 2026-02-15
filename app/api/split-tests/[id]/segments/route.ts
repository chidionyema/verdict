import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PostgrestError } from '@supabase/supabase-js';

interface SplitTestRow {
  user_id: string;
  status?: string;
}

interface SegmentRow {
  id: string;
  name: string;
  demographic_filters: Record<string, unknown> | null;
  psychographic_filters: Record<string, unknown> | null;
  target_count: number;
  completed_count: number;
  winner: 'A' | 'B' | 'tie' | null;
  consensus_strength: number | null;
}

interface VerdictRow {
  chosen_photo: 'A' | 'B';
  photo_a_rating: number | null;
  photo_b_rating: number | null;
}

interface SegmentInsert {
  split_test_id: string;
  name: string;
  demographic_filters: Record<string, unknown>;
  psychographic_filters: Record<string, unknown>;
  target_count: number;
  completed_count: number;
}

// GET /api/split-tests/[id]/segments - Get segments for a split test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: splitTestId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this split test
    const { data: splitTest, error: splitTestError } = await supabase
      .from('split_test_requests')
      .select('user_id')
      .eq('id', splitTestId)
      .single() as { data: SplitTestRow | null; error: PostgrestError | null };

    if (splitTestError || !splitTest) {
      return NextResponse.json({ error: 'Split test not found' }, { status: 404 });
    }

    if (splitTest.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get segments with results
    const { data: segments, error: segmentsError } = await supabase
      .from('test_segments')
      .select('*')
      .eq('split_test_id', splitTestId)
      .order('created_at', { ascending: true }) as { data: SegmentRow[] | null; error: PostgrestError | null };

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError);
      return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
    }

    // Get vote counts per segment
    const segmentsWithStats = await Promise.all(
      (segments || []).map(async (segment: SegmentRow) => {
        const { data: verdicts } = await supabase
          .from('split_test_verdicts')
          .select('chosen_photo, photo_a_rating, photo_b_rating')
          .eq('segment_id', segment.id) as { data: VerdictRow[] | null; error: unknown };

        const votesA = verdicts?.filter((v: VerdictRow) => v.chosen_photo === 'A').length || 0;
        const votesB = verdicts?.filter((v: VerdictRow) => v.chosen_photo === 'B').length || 0;
        const avgRatingA =
          verdicts && verdicts.length > 0
            ? verdicts.reduce((sum: number, v: VerdictRow) => sum + (v.photo_a_rating || 0), 0) / verdicts.length
            : null;
        const avgRatingB =
          verdicts && verdicts.length > 0
            ? verdicts.reduce((sum: number, v: VerdictRow) => sum + (v.photo_b_rating || 0), 0) / verdicts.length
            : null;

        return {
          id: segment.id,
          name: segment.name,
          demographicFilters: segment.demographic_filters || {},
          psychographicFilters: segment.psychographic_filters || {},
          targetCount: segment.target_count,
          completedCount: segment.completed_count,
          winner: segment.winner,
          consensusStrength: segment.consensus_strength,
          avgRatingA,
          avgRatingB,
          votesA,
          votesB,
        };
      })
    );

    return NextResponse.json({ segments: segmentsWithStats });
  } catch (error) {
    console.error('Segments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/split-tests/[id]/segments - Add segments to a split test
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: splitTestId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this split test
    const { data: splitTest, error: splitTestError } = await supabase
      .from('split_test_requests')
      .select('user_id, status')
      .eq('id', splitTestId)
      .single() as { data: SplitTestRow | null; error: PostgrestError | null };

    if (splitTestError || !splitTest) {
      return NextResponse.json({ error: 'Split test not found' }, { status: 404 });
    }

    if (splitTest.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (splitTest.status !== 'draft' && splitTest.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot modify segments after test has started' },
        { status: 400 }
      );
    }

    const { segments } = await request.json();

    if (!segments || !Array.isArray(segments) || segments.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 segments are required' },
        { status: 400 }
      );
    }

    if (segments.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 segments allowed' },
        { status: 400 }
      );
    }

    // Delete existing segments
    await supabase
      .from('test_segments')
      .delete()
      .eq('split_test_id', splitTestId);

    // Insert new segments
    const segmentRecords: SegmentInsert[] = segments.map((s: any) => ({
      split_test_id: splitTestId,
      name: s.name,
      demographic_filters: s.demographicFilters || {},
      psychographic_filters: s.psychographicFilters || {},
      target_count: s.targetCount || 5,
      completed_count: 0,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedSegments, error: insertError } = await (supabase as any)
      .from('test_segments')
      .insert(segmentRecords)
      .select();

    if (insertError) {
      console.error('Error inserting segments:', insertError);
      return NextResponse.json(
        { error: 'Failed to create segments' },
        { status: 500 }
      );
    }

    // Update split test target count to sum of segment targets
    const totalTargetCount = segments.reduce(
      (sum: number, s: any) => sum + (s.targetCount || 5),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('split_test_requests')
      .update({ target_verdict_count: totalTargetCount })
      .eq('id', splitTestId);

    return NextResponse.json({
      success: true,
      segments: insertedSegments,
      totalTargetCount,
    });
  } catch (error) {
    console.error('Segments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
