-- Credit Economy Migration
-- Creates the core tables for the judge-to-earn credit system

-- User credits balance
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0, -- Total available credits
  earned_total INTEGER NOT NULL DEFAULT 0, -- Lifetime credits earned
  spent_total INTEGER NOT NULL DEFAULT 0, -- Lifetime credits spent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Credit transactions log
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'refund')),
  amount INTEGER NOT NULL, -- Positive for earned/bonus/refund, negative for spent
  source TEXT NOT NULL, -- 'judging', 'streak_bonus', 'submission', 'refund', etc.
  source_id UUID, -- Links to related record (judgment_id, request_id, etc.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge reputation system
CREATE TABLE judge_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core stats
  total_judgments INTEGER NOT NULL DEFAULT 0,
  consensus_rate DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- % agreement with majority
  helpfulness_score DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- User ratings of their judgments
  response_quality_score DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- Length, thoughtfulness
  
  -- Streak tracking
  current_streak INTEGER NOT NULL DEFAULT 0, -- Consecutive days judging
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_judgment_date DATE,
  
  -- Tier info
  tier TEXT NOT NULL DEFAULT 'rookie' CHECK (tier IN ('rookie', 'regular', 'trusted', 'expert', 'elite')),
  tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Submission visibility control
ALTER TABLE feedback_requests ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));
ALTER TABLE feedback_requests ADD COLUMN IF NOT EXISTS roast_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE feedback_requests ADD COLUMN IF NOT EXISTS credits_cost INTEGER NOT NULL DEFAULT 0; -- 0 for public, >0 for private

-- Judgment earnings
CREATE TABLE judgment_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judgment_id UUID REFERENCES feedback_responses(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_earned INTEGER NOT NULL DEFAULT 0, -- Usually 0.2 credits per judgment (5 judgments = 1 credit)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(judgment_id)
);

-- Indexes for performance
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_judge_reputation_user_id ON judge_reputation(user_id);
CREATE INDEX idx_judge_reputation_tier ON judge_reputation(tier);
CREATE INDEX idx_judgment_earnings_judge_id ON judgment_earnings(judge_id);
CREATE INDEX idx_feedback_requests_visibility ON feedback_requests(visibility);
CREATE INDEX idx_feedback_requests_created_at ON feedback_requests(created_at DESC);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE judgment_earnings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view all judge reputations (public leaderboard)
CREATE POLICY "Anyone can view judge reputations" ON judge_reputation
  FOR SELECT USING (TRUE);

-- Users can only see their own earnings
CREATE POLICY "Users can view own earnings" ON judgment_earnings
  FOR SELECT USING (auth.uid() = judge_id);

-- Functions for credit management
CREATE OR REPLACE FUNCTION award_credits(
  target_user_id UUID,
  credit_amount INTEGER,
  transaction_type TEXT,
  transaction_source TEXT,
  transaction_source_id UUID DEFAULT NULL,
  transaction_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update user credits balance
  INSERT INTO user_credits (user_id, balance, earned_total)
    VALUES (target_user_id, credit_amount, credit_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_credits.balance + credit_amount,
    earned_total = user_credits.earned_total + credit_amount,
    updated_at = NOW();
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id, type, amount, source, source_id, description
  ) VALUES (
    target_user_id, transaction_type, credit_amount, 
    transaction_source, transaction_source_id, transaction_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION spend_credits(
  target_user_id UUID,
  credit_amount INTEGER,
  transaction_source TEXT,
  transaction_source_id UUID DEFAULT NULL,
  transaction_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT balance INTO current_balance 
  FROM user_credits 
  WHERE user_id = target_user_id;
  
  IF current_balance IS NULL OR current_balance < credit_amount THEN
    RETURN FALSE; -- Insufficient credits
  END IF;
  
  -- Update user credits balance
  UPDATE user_credits SET 
    balance = balance - credit_amount,
    spent_total = spent_total + credit_amount,
    updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id, type, amount, source, source_id, description
  ) VALUES (
    target_user_id, 'spent', -credit_amount, 
    transaction_source, transaction_source_id, transaction_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update judge reputation
CREATE OR REPLACE FUNCTION update_judge_reputation(
  target_user_id UUID,
  consensus_match BOOLEAN DEFAULT NULL,
  helpfulness_rating INTEGER DEFAULT NULL,
  quality_score DECIMAL DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO judge_reputation (user_id, total_judgments)
    VALUES (target_user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_judgments = judge_reputation.total_judgments + 1,
    consensus_rate = CASE 
      WHEN consensus_match IS NOT NULL THEN
        (judge_reputation.consensus_rate * judge_reputation.total_judgments + 
         CASE WHEN consensus_match THEN 100 ELSE 0 END) / (judge_reputation.total_judgments + 1)
      ELSE judge_reputation.consensus_rate
    END,
    helpfulness_score = CASE 
      WHEN helpfulness_rating IS NOT NULL THEN
        (judge_reputation.helpfulness_score * judge_reputation.total_judgments + helpfulness_rating) / 
        (judge_reputation.total_judgments + 1)
      ELSE judge_reputation.helpfulness_score
    END,
    response_quality_score = COALESCE(quality_score, judge_reputation.response_quality_score),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;