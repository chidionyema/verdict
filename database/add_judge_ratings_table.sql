-- Create judge_ratings table for requester feedback on judge performance
CREATE TABLE IF NOT EXISTS judge_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback_responses(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_ratings_feedback_id ON judge_ratings(feedback_id);
CREATE INDEX IF NOT EXISTS idx_judge_ratings_judge_id ON judge_ratings(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_ratings_rater_id ON judge_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_judge_ratings_rating ON judge_ratings(rating);

-- Ensure one rating per requester per feedback
CREATE UNIQUE INDEX IF NOT EXISTS idx_judge_ratings_unique_per_feedback 
ON judge_ratings(feedback_id, rater_id);

-- Add rating-related fields to judge_reputation table
ALTER TABLE judge_reputation 
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;

-- Create view for judge performance analytics
CREATE OR REPLACE VIEW judge_performance_stats AS
SELECT 
  jr.user_id as judge_id,
  p.display_name as judge_name,
  jr.total_judgments,
  jr.total_ratings,
  jr.average_rating,
  jr.current_streak,
  jr.longest_streak,
  jr.tier,
  jr.created_at as judge_since,
  -- Rating distribution
  COUNT(CASE WHEN jrt.rating = 5 THEN 1 END) as five_star_ratings,
  COUNT(CASE WHEN jrt.rating = 4 THEN 1 END) as four_star_ratings,
  COUNT(CASE WHEN jrt.rating = 3 THEN 1 END) as three_star_ratings,
  COUNT(CASE WHEN jrt.rating = 2 THEN 1 END) as two_star_ratings,
  COUNT(CASE WHEN jrt.rating = 1 THEN 1 END) as one_star_ratings,
  -- Quality metrics
  ROUND((COUNT(CASE WHEN jrt.rating >= 4 THEN 1 END)::DECIMAL / NULLIF(jr.total_ratings, 0)) * 100, 1) as quality_percentage,
  -- Recent performance (last 30 days)
  COUNT(CASE WHEN jrt.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_ratings,
  AVG(CASE WHEN jrt.created_at > NOW() - INTERVAL '30 days' THEN jrt.rating END) as recent_avg_rating
FROM judge_reputation jr
JOIN profiles p ON jr.user_id = p.id
LEFT JOIN judge_ratings jrt ON jr.user_id = jrt.judge_id
GROUP BY jr.user_id, p.display_name, jr.total_judgments, jr.total_ratings, 
         jr.average_rating, jr.current_streak, jr.longest_streak, jr.tier, jr.created_at;

-- Create notification triggers for low ratings
CREATE OR REPLACE FUNCTION notify_judge_low_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- If rating is 1-2 stars, create a notification for the judge
  IF NEW.rating <= 2 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.judge_id,
      'feedback_improvement',
      'Feedback needs improvement',
      'A requester rated your feedback ' || NEW.rating || ' stars. Check the feedback to see how you can improve.',
      jsonb_build_object(
        'rating', NEW.rating,
        'comment', NEW.comment,
        'feedback_id', NEW.feedback_id
      ),
      NOW()
    );
  END IF;
  
  -- If rating is 5 stars, create a positive notification
  IF NEW.rating = 5 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.judge_id,
      'feedback_excellent',
      'Excellent feedback!',
      'A requester gave your feedback 5 stars! Keep up the great work.',
      jsonb_build_object(
        'rating', NEW.rating,
        'comment', NEW.comment,
        'feedback_id', NEW.feedback_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_judge_rating_notifications ON judge_ratings;
CREATE TRIGGER trigger_judge_rating_notifications
  AFTER INSERT ON judge_ratings
  FOR EACH ROW
  EXECUTE FUNCTION notify_judge_low_rating();

-- Add RLS policies for judge_ratings
ALTER TABLE judge_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view ratings on their own feedback or their own ratings given/received
CREATE POLICY "judge_ratings_select_policy" ON judge_ratings
  FOR SELECT USING (
    rater_id = auth.uid() OR 
    judge_id = auth.uid() OR
    feedback_id IN (
      SELECT fr.id FROM feedback_responses fr
      JOIN feedback_requests req ON fr.request_id = req.id
      WHERE req.user_id = auth.uid()
    )
  );

-- Policy: Only requesters can insert ratings for feedback on their requests
CREATE POLICY "judge_ratings_insert_policy" ON judge_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid() AND
    feedback_id IN (
      SELECT fr.id FROM feedback_responses fr
      JOIN feedback_requests req ON fr.request_id = req.id
      WHERE req.user_id = auth.uid()
    )
  );

-- No updates or deletes allowed on ratings (immutable)
CREATE POLICY "judge_ratings_no_update" ON judge_ratings FOR UPDATE USING (false);
CREATE POLICY "judge_ratings_no_delete" ON judge_ratings FOR DELETE USING (false);