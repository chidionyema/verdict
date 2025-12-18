-- Pricing tiers and request types
CREATE TYPE request_tier AS ENUM ('community', 'standard', 'pro', 'enterprise');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Update verdict_requests to include tier information
ALTER TABLE verdict_requests 
ADD COLUMN request_tier request_tier DEFAULT 'community',
ADD COLUMN payment_amount INTEGER DEFAULT 0, -- Amount in pence (300 = £3.00)
ADD COLUMN payment_status payment_status DEFAULT 'pending',
ADD COLUMN payment_id TEXT, -- Stripe payment intent ID
ADD COLUMN paid_at TIMESTAMPTZ,
ADD COLUMN expert_only BOOLEAN DEFAULT FALSE,
ADD COLUMN priority_queue BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_synthesis BOOLEAN DEFAULT FALSE,
ADD COLUMN follow_up_enabled BOOLEAN DEFAULT FALSE;

-- Pricing tiers configuration table
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier request_tier UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  price_pence INTEGER NOT NULL, -- Price in pence
  credits_required INTEGER NOT NULL,
  verdict_count INTEGER NOT NULL,
  features JSONB NOT NULL, -- Array of feature strings
  reviewer_requirements JSONB, -- Requirements for reviewers (min reputation, expert only, etc)
  turnaround_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier configurations
INSERT INTO pricing_tiers (tier, display_name, price_pence, credits_required, verdict_count, features, reviewer_requirements, turnaround_minutes) VALUES
-- Community (Free with credits)
('community', 'Community', 0, 1, 3, 
 '["3 community reviews", "Basic feedback", "Anonymous reviewers", "30 min turnaround"]'::jsonb,
 '{"min_reputation": 0, "expert_only": false}'::jsonb,
 30),

-- Standard (£3)
('standard', 'Standard', 300, 0, 3,
 '["3 quality reviews", "Reputation 4+ reviewers only", "Helpfulness ratings", "Priority support", "30 min turnaround"]'::jsonb,
 '{"min_reputation": 4.0, "expert_only": false}'::jsonb,
 30),

-- Pro (£12)
('pro', 'Professional', 1200, 0, 3,
 '["3 expert reviews", "Verified professionals only", "AI consensus summary", "1 follow-up question", "Detailed analysis", "15 min turnaround"]'::jsonb,
 '{"min_reputation": 4.5, "expert_only": true}'::jsonb,
 15),

-- Enterprise (Custom)
('enterprise', 'Enterprise', 5000, 0, 5,
 '["5+ expert reviews", "Industry-specific experts", "Video feedback option", "Unlimited follow-ups", "Custom turnaround", "White-glove service"]'::jsonb,
 '{"min_reputation": 4.5, "expert_only": true, "industry_match": true}'::jsonb,
 60);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES verdict_requests(id) ON DELETE SET NULL,
  amount_pence INTEGER NOT NULL,
  currency TEXT DEFAULT 'GBP',
  payment_method TEXT NOT NULL, -- 'stripe', 'credits', 'promo'
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount_pence INTEGER,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  tier_restrictions request_tier[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User payment methods (for saved cards)
CREATE TABLE user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stripe_payment_method_id)
);

-- Indexes
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_request ON payment_transactions(request_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_verdict_requests_tier ON verdict_requests(request_tier);
CREATE INDEX idx_verdict_requests_payment_status ON verdict_requests(payment_status);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- RLS policies
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can view pricing tiers
CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers
  FOR SELECT USING (active = true);

-- Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Users can create payment transactions for themselves
CREATE POLICY "Users can create own payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Active promo codes are public
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Users can view and manage their own payment methods
CREATE POLICY "Users can view own payment methods" ON user_payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own payment methods" ON user_payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods" ON user_payment_methods
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods" ON user_payment_methods
  FOR DELETE USING (user_id = auth.uid());

-- Function to check if user can afford a tier
CREATE OR REPLACE FUNCTION can_afford_tier(user_uuid UUID, tier request_tier)
RETURNS BOOLEAN AS $$
DECLARE
  tier_info RECORD;
  user_balance INTEGER;
BEGIN
  -- Get tier info
  SELECT * INTO tier_info FROM pricing_tiers WHERE pricing_tiers.tier = $2 AND active = true;
  
  IF tier_info IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If it's a paid tier, return true (will use Stripe)
  IF tier_info.price_pence > 0 THEN
    RETURN TRUE;
  END IF;
  
  -- For credit-based tiers, check balance
  IF tier_info.credits_required > 0 THEN
    SELECT balance INTO user_balance FROM user_credits WHERE user_id = $1;
    RETURN COALESCE(user_balance, 0) >= tier_info.credits_required;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate final price with promo code
CREATE OR REPLACE FUNCTION calculate_tier_price(base_tier request_tier, promo_code TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  tier_info RECORD;
  promo_info RECORD;
  final_price INTEGER;
BEGIN
  -- Get tier base price
  SELECT * INTO tier_info FROM pricing_tiers WHERE tier = base_tier AND active = true;
  
  IF tier_info IS NULL THEN
    RETURN NULL;
  END IF;
  
  final_price := tier_info.price_pence;
  
  -- Apply promo code if provided
  IF promo_code IS NOT NULL THEN
    SELECT * INTO promo_info 
    FROM promo_codes 
    WHERE code = promo_code 
      AND active = true 
      AND (valid_until IS NULL OR valid_until > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND (tier_restrictions IS NULL OR base_tier = ANY(tier_restrictions));
    
    IF promo_info IS NOT NULL THEN
      IF promo_info.discount_percent IS NOT NULL THEN
        final_price := final_price * (100 - promo_info.discount_percent) / 100;
      ELSIF promo_info.discount_amount_pence IS NOT NULL THEN
        final_price := GREATEST(0, final_price - promo_info.discount_amount_pence);
      END IF;
    END IF;
  END IF;
  
  RETURN final_price;
END;
$$ LANGUAGE plpgsql;