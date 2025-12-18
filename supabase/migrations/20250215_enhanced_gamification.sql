-- Enhanced gamification system with achievements, payouts, and tier progression
-- Supports the war room feedback: "Create levels: Rookie → Judge → Magistrate → Supreme Court"

-- Table for tracking achievements
CREATE TABLE IF NOT EXISTS public.judge_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Table for payout requests (cash payouts for Magistrates and Supreme Court)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_amount INTEGER NOT NULL,
  cash_amount DECIMAL(10,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected', 'cancelled'
  payment_method VARCHAR(50), -- 'paypal', 'stripe', 'bank_transfer'
  payment_details JSONB, -- Store payment account info
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tier progression history
CREATE TABLE IF NOT EXISTS public.tier_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_tier VARCHAR(20),
  to_tier VARCHAR(20) NOT NULL,
  promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_judgments INTEGER NOT NULL,
  consensus_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced stats tracking for gamification
CREATE TABLE IF NOT EXISTS public.judge_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  judgments_count INTEGER DEFAULT 0,
  credits_earned DECIMAL(10,2) DEFAULT 0,
  average_response_time DECIMAL(10,2), -- in minutes
  helpfulness_rate DECIMAL(5,2), -- percentage of reviews marked helpful
  quality_score DECIMAL(5,2), -- 1-10 quality rating
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add new columns to existing judge_reputation table for enhanced tracking
ALTER TABLE public.judge_reputation 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'rookie',
ADD COLUMN IF NOT EXISTS last_tier_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_credits_earned DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payouts_requested DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpfulness_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_response_time DECIMAL(10,2) DEFAULT 0; -- in minutes

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_achievements_user_id ON public.judge_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_achievements_key ON public.judge_achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_tier_progression_user_id ON public.tier_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_stats_daily_user_date ON public.judge_stats_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_judge_reputation_tier ON public.judge_reputation(tier);

-- Function to automatically update tier when reputation changes
CREATE OR REPLACE FUNCTION update_judge_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate new tier based on total_judgments and consensus_rate
  DECLARE
    new_tier VARCHAR(20);
  BEGIN
    -- Determine tier based on requirements
    IF NEW.total_judgments >= 500 AND NEW.consensus_rate >= 85 THEN
      new_tier := 'supreme_court';
    ELSIF NEW.total_judgments >= 100 AND NEW.consensus_rate >= 70 THEN
      new_tier := 'magistrate';
    ELSIF NEW.total_judgments >= 25 AND NEW.consensus_rate >= 55 THEN
      new_tier := 'judge';
    ELSE
      new_tier := 'rookie';
    END IF;
    
    -- If tier changed, record the progression
    IF OLD.tier IS NULL OR OLD.tier != new_tier THEN
      INSERT INTO public.tier_progression (
        user_id, 
        from_tier, 
        to_tier, 
        total_judgments, 
        consensus_rate
      ) VALUES (
        NEW.user_id,
        OLD.tier,
        new_tier,
        NEW.total_judgments,
        NEW.consensus_rate
      );
    END IF;
    
    NEW.tier := new_tier;
    NEW.last_tier_check := NOW();
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tier
DROP TRIGGER IF EXISTS trigger_update_judge_tier ON public.judge_reputation;
CREATE TRIGGER trigger_update_judge_tier
  BEFORE UPDATE ON public.judge_reputation
  FOR EACH ROW
  EXECUTE FUNCTION update_judge_tier();

-- Function to calculate and award achievement bonuses
CREATE OR REPLACE FUNCTION award_achievement_bonus(
  p_user_id UUID,
  p_achievement_key VARCHAR(50),
  p_bonus_credits DECIMAL(10,2) DEFAULT 0
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if achievement already exists
  IF EXISTS (
    SELECT 1 FROM public.judge_achievements 
    WHERE user_id = p_user_id AND achievement_key = p_achievement_key
  ) THEN
    RETURN FALSE; -- Already has this achievement
  END IF;
  
  -- Insert achievement
  INSERT INTO public.judge_achievements (user_id, achievement_key)
  VALUES (p_user_id, p_achievement_key);
  
  -- Award bonus credits if specified
  IF p_bonus_credits > 0 THEN
    -- Use existing award_credits function
    PERFORM award_credits(
      p_user_id,
      p_bonus_credits,
      'bonus',
      'achievement',
      p_achievement_key,
      'Achievement bonus: ' || p_achievement_key
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.judge_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_stats_daily ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their achievements" ON public.judge_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own payout requests
CREATE POLICY "Users can view their payout requests" ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create payout requests
CREATE POLICY "Users can create payout requests" ON public.payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their tier progression
CREATE POLICY "Users can view their tier progression" ON public.tier_progression
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their daily stats
CREATE POLICY "Users can view their daily stats" ON public.judge_stats_daily
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.judge_achievements TO authenticated;
GRANT ALL ON public.payout_requests TO authenticated;
GRANT ALL ON public.tier_progression TO authenticated;
GRANT ALL ON public.judge_stats_daily TO authenticated;

-- Sample data for testing
INSERT INTO public.judge_achievements (user_id, achievement_key) VALUES
  ('00000000-0000-0000-0000-000000000000', 'first_judgment')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.judge_achievements IS 'Tracks unlocked achievements for judges (First Steps, Week Warrior, etc.)';
COMMENT ON TABLE public.payout_requests IS 'Cash payout requests for Magistrate and Supreme Court tier judges';
COMMENT ON TABLE public.tier_progression IS 'Historical record of tier promotions (Rookie → Judge → Magistrate → Supreme Court)';
COMMENT ON TABLE public.judge_stats_daily IS 'Daily aggregated statistics for detailed gamification tracking';
COMMENT ON COLUMN public.judge_reputation.tier IS 'Current judge tier: rookie, judge, magistrate, supreme_court';
COMMENT ON FUNCTION update_judge_tier() IS 'Automatically calculates and updates judge tier based on performance metrics';
COMMENT ON FUNCTION award_achievement_bonus(UUID, VARCHAR, DECIMAL) IS 'Awards achievements and optional credit bonuses to judges';