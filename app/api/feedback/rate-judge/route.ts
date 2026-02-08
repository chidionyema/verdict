import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, rating, comment } = await request.json();

    if (!feedbackId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({
        error: 'Invalid request. feedbackId and rating (1-5) are required.'
      }, { status: 400 });
    }

    // Validate feedbackId as UUID
    if (!isValidUUID(feedbackId)) {
      return NextResponse.json({ error: 'Invalid feedback ID format' }, { status: 400 });
    }

    // Verify the feedback exists and user is the requester
    const { data: feedbackResponse, error: feedbackError } = await supabase
      .from('feedback_responses')
      .select(`
        id,
        reviewer_id,
        feedback_requests!inner(user_id)
      `)
      .eq('id', feedbackId)
      .single();

    if (feedbackError || !feedbackResponse) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check if user is the original requester
    const originalRequesterId = (feedbackResponse as any).feedback_requests?.user_id;
    if (originalRequesterId !== user.id) {
      return NextResponse.json({ 
        error: 'You can only rate feedback on your own requests' 
      }, { status: 403 });
    }

    // Check if user has already rated this feedback
    const { data: existingRating } = await supabase
      .from('judge_ratings')
      .select('id')
      .eq('feedback_id', feedbackId)
      .eq('rater_id', user.id)
      .single();

    if (existingRating) {
      return NextResponse.json({ 
        error: 'You have already rated this feedback' 
      }, { status: 400 });
    }

    // Insert the rating
    const { data: ratingData, error: ratingError } = await (supabase
      .from('judge_ratings')
      .insert as any)({
        feedback_id: feedbackId,
        judge_id: (feedbackResponse as any).reviewer_id,
        rater_id: user.id,
        rating,
        comment: comment?.trim() || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Error inserting judge rating:', ratingError);
      return NextResponse.json({ 
        error: 'Failed to save rating' 
      }, { status: 500 });
    }

    // Update judge reputation with the new rating
    await updateJudgeReputation((feedbackResponse as any).reviewer_id, rating, supabase);

    return NextResponse.json({
      success: true,
      rating: ratingData,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Judge rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateJudgeReputation(judgeId: string, rating: number, supabase: any) {
  try {
    // Get current reputation stats
    const { data: currentStats } = await supabase
      .from('judge_reputation')
      .select('total_ratings, average_rating, total_judgments')
      .eq('user_id', judgeId)
      .single();

    if (currentStats) {
      // Calculate new average
      const totalRatings = currentStats.total_ratings + 1;
      const currentTotal = currentStats.average_rating * currentStats.total_ratings;
      const newAverage = (currentTotal + rating) / totalRatings;

      // Update reputation
      await (supabase
        .from('judge_reputation')
        .update as any)({
          total_ratings: totalRatings,
          average_rating: newAverage,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', judgeId);
    } else {
      // Create initial reputation record
      await (supabase
        .from('judge_reputation')
        .insert as any)({
          user_id: judgeId,
          total_ratings: 1,
          average_rating: rating,
          total_judgments: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Award bonus credits for high ratings (4-5 stars)
    if (rating >= 4) {
      await awardJudgeBonus(judgeId, rating, supabase);
    }
  } catch (error) {
    console.error('Error updating judge reputation:', error);
  }
}

async function awardJudgeBonus(judgeId: string, rating: number, supabase: any) {
  try {
    // Award bonus credits for excellent feedback
    const bonusCredits = rating === 5 ? 0.5 : 0.25; // Half credit for 5-star, quarter for 4-star

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', judgeId)
      .single();

    if (profile) {
      await (supabase
        .from('profiles')
        .update as any)({
          credits: (profile.credits || 0) + bonusCredits
        })
        .eq('id', judgeId);

      // Log the bonus transaction
      await (supabase
        .from('transactions')
        .insert as any)({
          user_id: judgeId,
          type: 'quality_bonus',
          credits_delta: bonusCredits,
          amount_cents: 0,
          status: 'completed',
          metadata: JSON.stringify({ 
            rating, 
            reason: `${rating}-star feedback bonus` 
          }),
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error awarding judge bonus:', error);
  }
}

// Apply rate limiting to judge rating endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);