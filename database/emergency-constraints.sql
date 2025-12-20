-- EMERGENCY DATABASE CONSTRAINTS FOR PRODUCTION SAFETY
-- Run these immediately before launch to prevent data corruption

-- 1. FOREIGN KEY CONSTRAINTS (Prevent orphaned data)

-- Verdict requests must have valid users
ALTER TABLE verdict_requests 
ADD CONSTRAINT fk_verdict_requests_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verdict responses must have valid requests and judges
ALTER TABLE verdict_responses 
ADD CONSTRAINT fk_verdict_responses_request 
FOREIGN KEY (request_id) REFERENCES verdict_requests(id) ON DELETE CASCADE;

ALTER TABLE verdict_responses 
ADD CONSTRAINT fk_verdict_responses_judge 
FOREIGN KEY (judge_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Comparison requests must have valid users
ALTER TABLE comparison_requests 
ADD CONSTRAINT fk_comparison_requests_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Split test requests must have valid users  
ALTER TABLE split_test_requests 
ADD CONSTRAINT fk_split_test_requests_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Credit transactions must reference valid users
ALTER TABLE credit_transactions 
ADD CONSTRAINT fk_credit_transactions_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- User credits must reference valid users
ALTER TABLE user_credits 
ADD CONSTRAINT fk_user_credits_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Judge reputation must reference valid users
ALTER TABLE judge_reputation 
ADD CONSTRAINT fk_judge_reputation_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. CHECK CONSTRAINTS (Data validation at DB level)

-- Credits cannot be negative
ALTER TABLE profiles 
ADD CONSTRAINT chk_profiles_credits_positive 
CHECK (credits >= 0);

-- Credit amounts must be reasonable
ALTER TABLE credit_transactions 
ADD CONSTRAINT chk_credit_transactions_amount 
CHECK (amount >= -1000 AND amount <= 1000);

-- User credits balance cannot be negative
ALTER TABLE user_credits 
ADD CONSTRAINT chk_user_credits_balance_positive 
CHECK (balance >= 0);

-- Verdict ratings must be within range
ALTER TABLE verdict_responses 
ADD CONSTRAINT chk_verdict_responses_rating 
CHECK (rating >= 1 AND rating <= 10);

-- Request status must be valid
ALTER TABLE verdict_requests 
ADD CONSTRAINT chk_verdict_requests_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Comparison request status must be valid
ALTER TABLE comparison_requests 
ADD CONSTRAINT chk_comparison_requests_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Split test request status must be valid
ALTER TABLE split_test_requests 
ADD CONSTRAINT chk_split_test_requests_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Target verdict count must be reasonable
ALTER TABLE verdict_requests 
ADD CONSTRAINT chk_verdict_requests_target_count 
CHECK (target_verdict_count >= 1 AND target_verdict_count <= 20);

-- Feedback length must be reasonable
ALTER TABLE verdict_responses 
ADD CONSTRAINT chk_verdict_responses_feedback_length 
CHECK (length(feedback) >= 10 AND length(feedback) <= 5000);

-- Context length must be reasonable  
ALTER TABLE verdict_requests 
ADD CONSTRAINT chk_verdict_requests_context_length 
CHECK (length(context) >= 10 AND length(context) <= 2000);

-- 3. UNIQUE CONSTRAINTS (Prevent duplicates)

-- User can only have one credit record
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_credits_unique_user 
ON user_credits(user_id);

-- User can only have one reputation record
CREATE UNIQUE INDEX IF NOT EXISTS idx_judge_reputation_unique_user 
ON judge_reputation(user_id);

-- Profile emails must be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_email 
ON profiles(email) WHERE email IS NOT NULL;

-- 4. INDEXES FOR PERFORMANCE (Prevent slow queries)

-- Requests by user (for my-requests page)
CREATE INDEX IF NOT EXISTS idx_verdict_requests_user_created 
ON verdict_requests(user_id, created_at DESC);

-- Requests by status (for judge queue)
CREATE INDEX IF NOT EXISTS idx_verdict_requests_status_created 
ON verdict_requests(status, created_at ASC) WHERE status = 'pending';

-- Responses by request (for gathering verdicts)
CREATE INDEX IF NOT EXISTS idx_verdict_responses_request 
ON verdict_responses(request_id);

-- Responses by judge (for judge history)
CREATE INDEX IF NOT EXISTS idx_verdict_responses_judge_created 
ON verdict_responses(judge_id, created_at DESC);

-- Credit transactions by user (for history)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
ON credit_transactions(user_id, created_at DESC);

-- 5. SECURITY CONSTRAINTS (RLS Policies)

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_reputation ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY IF NOT EXISTS "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can view own requests" 
ON verdict_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create requests" 
ON verdict_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Judges can view pending requests" 
ON verdict_requests FOR SELECT 
USING (status = 'pending' OR auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own responses" 
ON verdict_responses FOR SELECT 
USING (auth.uid() = judge_id OR auth.uid() = (SELECT user_id FROM verdict_requests WHERE id = request_id));

CREATE POLICY IF NOT EXISTS "Judges can create responses" 
ON verdict_responses FOR INSERT 
WITH CHECK (auth.uid() = judge_id);

-- 6. AUDIT TABLES (Track all critical changes)

-- Credit audit log table
CREATE TABLE IF NOT EXISTS credit_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  operation VARCHAR(20) NOT NULL,
  credits_amount INTEGER NOT NULL,
  before_balance INTEGER,
  after_balance INTEGER,
  request_id UUID,
  reason TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Admin audit log table  
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_credit_audit_log_user_time 
ON credit_audit_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_time 
ON admin_audit_log(admin_id, timestamp DESC);

-- 7. DATA CLEANUP (Remove any existing orphaned records)

-- Remove orphaned responses (responses without valid requests)
DELETE FROM verdict_responses 
WHERE request_id NOT IN (SELECT id FROM verdict_requests);

-- Remove orphaned credit transactions (transactions without valid users)  
DELETE FROM credit_transactions 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Remove orphaned user credits (credits without valid users)
DELETE FROM user_credits 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 8. EMERGENCY MONITORING VIEWS

-- View for detecting suspicious activity
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
  'High credit usage' as alert_type,
  p.email,
  p.credits,
  p.updated_at
FROM profiles p 
WHERE p.credits > 100
UNION ALL
SELECT 
  'Rapid request creation' as alert_type,
  p.email,
  COUNT(vr.id)::text as credits,
  MAX(vr.created_at) as updated_at
FROM profiles p 
JOIN verdict_requests vr ON p.id = vr.user_id 
WHERE vr.created_at > NOW() - INTERVAL '1 hour'
GROUP BY p.id, p.email 
HAVING COUNT(vr.id) > 10;

-- View for financial monitoring
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
  SUM(CASE 
    WHEN target_verdict_count = 3 THEN 1
    WHEN target_verdict_count = 5 THEN 2  
    WHEN target_verdict_count = 8 THEN 3
    WHEN target_verdict_count = 10 THEN 4
    ELSE 1
  END) as estimated_credits_used
FROM verdict_requests 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions for monitoring
GRANT SELECT ON security_alerts TO authenticated;
GRANT SELECT ON financial_summary TO authenticated;