-- Fix PCI DSS compliance violation by removing payment_details from payout_requests
-- SECURITY FIX: Remove sensitive payment information from database storage

-- Remove the payment_details column that stores sensitive payment information
ALTER TABLE public.payout_requests DROP COLUMN IF EXISTS payment_details;

-- Add safe payment reference columns instead
ALTER TABLE public.payout_requests 
ADD COLUMN IF NOT EXISTS payment_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_payer_id VARCHAR(255);

-- Add comment explaining PCI DSS compliance
COMMENT ON TABLE public.payout_requests IS 'PCI DSS COMPLIANT: No sensitive payment details stored in database. Only references to external payment systems.';

-- Create function to validate payout request without storing sensitive data
CREATE OR REPLACE FUNCTION create_payout_request(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_cash_amount DECIMAL(10,2),
  p_processing_fee DECIMAL(10,2),
  p_net_amount DECIMAL(10,2),
  p_tier VARCHAR(20),
  p_payment_method VARCHAR(50),
  p_payment_email VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
BEGIN
  -- Validate payment email format
  IF p_payment_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format for payment method';
  END IF;
  
  -- Validate payment method
  IF p_payment_method NOT IN ('paypal', 'stripe', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  
  -- Create payout request (no sensitive data stored)
  INSERT INTO public.payout_requests (
    user_id, credits_amount, cash_amount, processing_fee, net_amount,
    tier, payment_method, payment_email
  ) VALUES (
    p_user_id, p_credits_amount, p_cash_amount, p_processing_fee, p_net_amount,
    p_tier, p_payment_method, p_payment_email
  ) RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit log for payout requests (for compliance tracking)
CREATE TABLE IF NOT EXISTS public.payout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID NOT NULL REFERENCES public.payout_requests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'approved', 'processed', 'rejected'
  performed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_payout_audit_log_request_id ON public.payout_audit_log(payout_request_id);
CREATE INDEX IF NOT EXISTS idx_payout_audit_log_action ON public.payout_audit_log(action);

-- Grant appropriate permissions
GRANT ALL ON public.payout_audit_log TO authenticated;

-- RLS for audit log
ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payout audit logs" ON public.payout_audit_log
  FOR SELECT USING (
    payout_request_id IN (
      SELECT id FROM public.payout_requests WHERE user_id = auth.uid()
    )
  );

-- Add comment explaining security improvements
COMMENT ON FUNCTION create_payout_request(UUID, INTEGER, DECIMAL, DECIMAL, DECIMAL, VARCHAR, VARCHAR, VARCHAR) 
  IS 'PCI DSS COMPLIANT: Creates payout request without storing sensitive payment data';

COMMENT ON TABLE public.payout_audit_log 
  IS 'Audit trail for payout requests to maintain compliance and transparency';