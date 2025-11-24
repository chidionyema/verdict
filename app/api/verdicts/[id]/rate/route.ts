import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/verdicts/[id]/rate - Rate a verdict's quality
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      helpfulness_rating,
      accuracy_rating,
      constructiveness_rating,
      overall_rating,
      feedback_text,
      would_recommend_judge,
      is_featured_worthy
    } = body;

    // Validate required ratings (1-5 scale)
    const requiredRatings = { helpfulness_rating, accuracy_rating, constructiveness_rating, overall_rating };
    for (const [key, value] of Object.entries(requiredRatings)) {
      if (!value || value < 1 || value > 5) {
        return NextResponse.json({ 
          error: `${key} must be between 1 and 5` 
        }, { status: 400 });
      }
    }

    // Get verdict details
    const { data: verdict, error: verdictError } = await supabase
      .from('verdict_responses')
      .select(`
        id,
        judge_id,
        request_id,
        verdict_requests!request_id(user_id)
      `)
      .eq('id', id)
      .single();

    if (verdictError || !verdict) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 });
    }

    // Verify user owns the original request
    if (verdict.verdict_requests.user_id !== user.id) {
      return NextResponse.json({ 
        error: 'You can only rate verdicts on your own requests' 
      }, { status: 403 });
    }

    // Check if already rated
    const { data: existingRating } = await supabase
      .from('verdict_quality_ratings')
      .select('id')
      .eq('verdict_response_id', id)
      .eq('request_owner_id', user.id)
      .single();

    if (existingRating) {
      return NextResponse.json({ 
        error: 'You have already rated this verdict' 
      }, { status: 400 });
    }

    // Create the rating
    const ratingData = {
      verdict_response_id: id,
      request_owner_id: user.id,
      judge_id: verdict.judge_id,
      helpfulness_rating,
      accuracy_rating,
      constructiveness_rating,
      overall_rating,
      feedback_text: feedback_text?.trim() || null,
      would_recommend_judge: would_recommend_judge ?? true,
      is_featured_worthy: is_featured_worthy ?? false,
    };

    const { data: rating, error: ratingError } = await supabase
      .from('verdict_quality_ratings')
      .insert(ratingData)
      .select()
      .single();

    if (ratingError) {
      console.error('Error creating rating:', ratingError);
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
    }

    // Update verdict quality score
    const averageQuality = (helpfulness_rating + accuracy_rating + constructiveness_rating + overall_rating) / 4;
    
    await supabase
      .from('verdict_responses')
      .update({
        quality_score: averageQuality,
        helpfulness_rating: helpfulness_rating,
        is_featured: is_featured_worthy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Notify the judge about the rating
    await supabase.rpc('create_notification', {
      target_user_id: verdict.judge_id,
      notification_type: 'verdict_rated',
      notification_title: 'Your verdict was rated!',
      notification_message: `Your verdict received a ${overall_rating}/5 rating. ${
        overall_rating >= 4 ? 'Great work!' : 'Keep improving!'
      }`,
      related_type: 'verdict_response',
      related_id: id,
      action_label: 'View Rating',
      action_url: `/judge/performance`,
      notification_priority: overall_rating >= 4 ? 'normal' : 'low'
    });

    // If highly rated, notify admins about potential featured content
    if (is_featured_worthy && overall_rating >= 4) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true);

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.rpc('create_notification', {
            target_user_id: admin.id,
            notification_type: 'featured_content_candidate',
            notification_title: 'Featured content candidate',
            notification_message: 'A verdict was marked as feature-worthy with high ratings.',
            related_type: 'verdict_response',
            related_id: id,
            action_label: 'Review Content',
            action_url: `/admin/content`,
            notification_priority: 'low'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      rating_id: rating.id,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('POST /api/verdicts/[id]/rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}