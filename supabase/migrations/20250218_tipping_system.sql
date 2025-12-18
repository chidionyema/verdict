-- Comprehensive tipping system for exceptional reviews
-- Production-ready schema with proper constraints and indexes

-- Table for tip transactions
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verdict_response_id UUID NOT NULL REFERENCES public.verdict_responses(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 100 AND 5000), -- $1 to $50
  processing_fee_cents INTEGER NOT NULL DEFAULT 0,
  net_amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  tip_message TEXT,
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
  stripe_charge_id VARCHAR(255),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT unique_tip_per_verdict UNIQUE(tipper_id, verdict_response_id),
  CONSTRAINT no_self_tipping CHECK (tipper_id != reviewer_id)
);

-- Table for tip analytics and reviewer earnings
CREATE TABLE IF NOT EXISTS public.tip_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_tips_received INTEGER DEFAULT 0,
  total_amount_cents INTEGER DEFAULT 0,
  average_tip_cents INTEGER DEFAULT 0,
  unique_tippers INTEGER DEFAULT 0,
  verification_boost_factor DECIMAL(3,2) DEFAULT 1.0, -- Verified reviewers get 40% more tips
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_reviewer_period UNIQUE(reviewer_id, period_start, period_end)
);

-- Tip notification preferences
CREATE TABLE IF NOT EXISTS public.tip_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_on_tip_received BOOLEAN DEFAULT true,
  email_on_tip_sent BOOLEAN DEFAULT true,
  push_on_tip_received BOOLEAN DEFAULT true,
  minimum_tip_for_notification_cents INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_tip_settings UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tips_tipper_id ON public.tips(tipper_id);
CREATE INDEX IF NOT EXISTS idx_tips_reviewer_id ON public.tips(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tips_verdict_response_id ON public.tips(verdict_response_id);
CREATE INDEX IF NOT EXISTS idx_tips_payment_status ON public.tips(payment_status);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips(created_at);
CREATE INDEX IF NOT EXISTS idx_tips_amount ON public.tips(amount_cents);

CREATE INDEX IF NOT EXISTS idx_tip_analytics_reviewer_id ON public.tip_analytics(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tip_analytics_period ON public.tip_analytics(period_start, period_end);

-- Function to calculate processing fees (3% + $0.30)
CREATE OR REPLACE FUNCTION calculate_tip_processing_fee(amount_cents INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Stripe processing: 2.9% + $0.30
  RETURN CEIL(amount_cents * 0.029 + 30);
END;
$$ LANGUAGE plpgsql;

-- Function to update tip analytics
CREATE OR REPLACE FUNCTION update_tip_analytics(p_reviewer_id UUID, p_tip_date DATE)
RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  tip_stats RECORD;
BEGIN
  -- Calculate monthly period
  start_date := DATE_TRUNC('month', p_tip_date)::DATE;
  end_date := (DATE_TRUNC('month', p_tip_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calculate stats for the period
  SELECT 
    COUNT(*) as tip_count,
    SUM(net_amount_cents) as total_amount,
    AVG(net_amount_cents) as avg_amount,
    COUNT(DISTINCT tipper_id) as unique_tippers
  INTO tip_stats
  FROM public.tips 
  WHERE reviewer_id = p_reviewer_id 
    AND payment_status = 'succeeded'
    AND created_at::DATE BETWEEN start_date AND end_date;
  
  -- Insert or update analytics record
  INSERT INTO public.tip_analytics (
    reviewer_id, period_start, period_end, 
    total_tips_received, total_amount_cents, 
    average_tip_cents, unique_tippers
  ) VALUES (
    p_reviewer_id, start_date, end_date,
    tip_stats.tip_count, tip_stats.total_amount,
    tip_stats.avg_amount, tip_stats.unique_tippers
  )
  ON CONFLICT (reviewer_id, period_start, period_end) 
  DO UPDATE SET
    total_tips_received = tip_stats.tip_count,
    total_amount_cents = tip_stats.total_amount,
    average_tip_cents = tip_stats.avg_amount,
    unique_tippers = tip_stats.unique_tippers,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics when tips are processed
CREATE OR REPLACE FUNCTION trigger_update_tip_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'succeeded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'succeeded') THEN
    PERFORM update_tip_analytics(NEW.reviewer_id, NEW.created_at::DATE);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tip_analytics_update ON public.tips;
CREATE TRIGGER trigger_tip_analytics_update
  AFTER UPDATE ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tip_analytics();

-- Function to process tip payment
CREATE OR REPLACE FUNCTION process_tip_payment(
  p_tipper_id UUID,
  p_reviewer_id UUID,
  p_verdict_response_id UUID,
  p_amount_cents INTEGER,
  p_tip_message TEXT DEFAULT NULL,
  p_payment_intent_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  tip_id UUID;
  processing_fee INTEGER;
  net_amount INTEGER;
BEGIN
  -- Validate amount
  IF p_amount_cents < 100 OR p_amount_cents > 5000 THEN
    RAISE EXCEPTION 'Tip amount must be between $1.00 and $50.00';
  END IF;
  
  -- Check if tip already exists for this verdict
  IF EXISTS (
    SELECT 1 FROM public.tips 
    WHERE tipper_id = p_tipper_id AND verdict_response_id = p_verdict_response_id
  ) THEN
    RAISE EXCEPTION 'You have already tipped this reviewer for this feedback';
  END IF;
  
  -- Calculate fees
  processing_fee := calculate_tip_processing_fee(p_amount_cents);
  net_amount := p_amount_cents - processing_fee;
  
  -- Create tip record
  INSERT INTO public.tips (
    tipper_id, reviewer_id, verdict_response_id,
    amount_cents, processing_fee_cents, net_amount_cents,
    tip_message, payment_intent_id, payment_status
  ) VALUES (
    p_tipper_id, p_reviewer_id, p_verdict_response_id,
    p_amount_cents, processing_fee, net_amount,
    p_tip_message, p_payment_intent_id, 'pending'
  ) RETURNING id INTO tip_id;
  
  RETURN tip_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their sent and received tips
CREATE POLICY "Users can view their tips" ON public.tips
  FOR SELECT USING (auth.uid() = tipper_id OR auth.uid() = reviewer_id);

-- Users can create tips they're sending
CREATE POLICY "Users can create tips" ON public.tips
  FOR INSERT WITH CHECK (auth.uid() = tipper_id);

-- Users can view their own tip analytics
CREATE POLICY "Users can view their tip analytics" ON public.tip_analytics
  FOR SELECT USING (auth.uid() = reviewer_id);

-- Users can manage their own notification settings
CREATE POLICY "Users can manage tip notification settings" ON public.tip_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.tips TO authenticated;
GRANT ALL ON public.tip_analytics TO authenticated;
GRANT ALL ON public.tip_notification_settings TO authenticated;

-- Insert default notification settings for existing users
INSERT INTO public.tip_notification_settings (user_id)
SELECT id FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.tip_notification_settings 
  WHERE user_id = profiles.id
);

-- Comments for documentation
COMMENT ON TABLE public.tips IS 'Tip transactions for exceptional feedback quality';
COMMENT ON TABLE public.tip_analytics IS 'Monthly aggregated tip statistics for reviewers';
COMMENT ON TABLE public.tip_notification_settings IS 'User preferences for tip-related notifications';
COMMENT ON FUNCTION calculate_tip_processing_fee(INTEGER) IS 'Calculates Stripe processing fees for tip amount';
COMMENT ON FUNCTION process_tip_payment(UUID, UUID, UUID, INTEGER, TEXT, VARCHAR) IS 'Creates a new tip transaction with validation';
COMMENT ON FUNCTION update_tip_analytics(UUID, DATE) IS 'Updates monthly tip analytics for a reviewer';