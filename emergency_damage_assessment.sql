-- EMERGENCY DAMAGE ASSESSMENT QUERIES
-- Run these queries IMMEDIATELY to assess credit system damage
-- Date: 2024-12-22 - War Room Response

-- ================================
-- 1. CHECK FOR NEGATIVE CREDITS
-- ================================
\echo '=== CHECKING FOR NEGATIVE CREDITS ==='
SELECT 
  'profiles' as table_name,
  id as user_id, 
  email, 
  credits,
  CASE 
    WHEN credits < 0 THEN ABS(credits) 
    ELSE 0 
  END as negative_amount,
  updated_at as last_updated
FROM profiles 
WHERE credits < 0
ORDER BY credits ASC;

-- Check user_credits table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        RAISE NOTICE 'Checking user_credits table...';
        PERFORM * FROM (
            SELECT 
                'user_credits' as table_name,
                user_id, 
                balance as credits,
                CASE 
                    WHEN balance < 0 THEN ABS(balance) 
                    ELSE 0 
                END as negative_amount,
                updated_at as last_updated
            FROM user_credits 
            WHERE balance < 0
            ORDER BY balance ASC
        ) AS negative_user_credits;
    ELSE
        RAISE NOTICE 'user_credits table does not exist';
    END IF;
END $$;

-- ================================
-- 2. COUNT FINANCIAL EXPOSURE
-- ================================
\echo '=== FINANCIAL DAMAGE ASSESSMENT ==='
SELECT 
  COUNT(*) as negative_credit_users,
  COALESCE(SUM(ABS(credits)), 0) as total_negative_credits,
  COALESCE(AVG(ABS(credits)), 0) as avg_negative_amount,
  COALESCE(MIN(credits), 0) as worst_negative_balance
FROM profiles 
WHERE credits < 0;

-- ================================
-- 3. RECENT SUSPICIOUS ACTIVITY
-- ================================
\echo '=== RECENT CREDIT AUDIT LOG ANALYSIS ==='
SELECT 
  operation,
  COUNT(*) as occurrence_count,
  SUM(credits_amount) as total_credits_involved,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence
FROM credit_audit_log 
WHERE 
  timestamp > NOW() - INTERVAL '7 days'
  AND (
    after_balance < 0 
    OR operation LIKE '%fallback%'
    OR operation LIKE '%emergency%'
    OR success = false
  )
GROUP BY operation
ORDER BY occurrence_count DESC;

-- ================================
-- 4. FIND USERS AFFECTED BY DANGEROUS ROUTES
-- ================================
\echo '=== USERS AFFECTED BY DANGEROUS ROUTES ==='
SELECT DISTINCT 
  cal.user_id,
  p.email,
  p.credits as current_credits,
  COUNT(cal.id) as suspicious_transactions,
  STRING_AGG(DISTINCT cal.operation, ', ') as operations,
  MIN(cal.timestamp) as first_suspicious,
  MAX(cal.timestamp) as last_suspicious
FROM credit_audit_log cal
JOIN profiles p ON cal.user_id = p.id
WHERE 
  cal.timestamp > NOW() - INTERVAL '7 days'
  AND (
    cal.operation LIKE '%verdict%' 
    OR cal.operation LIKE '%fallback%'
    OR cal.reason LIKE '%fallback%'
    OR cal.after_balance < 0
  )
GROUP BY cal.user_id, p.email, p.credits
ORDER BY suspicious_transactions DESC, current_credits ASC;

-- ================================
-- 5. DETECT RACE CONDITIONS
-- ================================
\echo '=== POTENTIAL RACE CONDITION DETECTION ==='
-- Look for multiple simultaneous operations on same user
WITH concurrent_operations AS (
  SELECT 
    user_id,
    operation,
    timestamp,
    credits_amount,
    LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as prev_timestamp,
    LAG(operation) OVER (PARTITION BY user_id ORDER BY timestamp) as prev_operation
  FROM credit_audit_log 
  WHERE timestamp > NOW() - INTERVAL '24 hours'
),
potential_races AS (
  SELECT 
    user_id,
    operation,
    prev_operation,
    timestamp,
    prev_timestamp,
    EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) as seconds_between
  FROM concurrent_operations
  WHERE 
    prev_timestamp IS NOT NULL 
    AND EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) < 2 -- Less than 2 seconds apart
    AND operation != prev_operation
)
SELECT 
  pr.user_id,
  p.email,
  p.credits as current_credits,
  pr.operation,
  pr.prev_operation,
  pr.seconds_between,
  pr.timestamp,
  pr.prev_timestamp
FROM potential_races pr
JOIN profiles p ON pr.user_id = p.id
ORDER BY pr.seconds_between ASC, pr.timestamp DESC;

-- ================================
-- 6. CHECK CREDIT CONSISTENCY
-- ================================
\echo '=== CREDIT CONSISTENCY CHECK ==='
-- Compare profiles.credits with user_credits.balance if both exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        RAISE NOTICE 'Checking credit consistency between tables...';
        PERFORM * FROM (
            SELECT 
                p.id as user_id,
                p.email,
                p.credits as profile_credits,
                uc.balance as user_credits_balance,
                ABS(p.credits - uc.balance) as difference,
                CASE 
                    WHEN p.credits != uc.balance THEN 'INCONSISTENT'
                    ELSE 'CONSISTENT'
                END as status
            FROM profiles p
            LEFT JOIN user_credits uc ON p.id = uc.user_id
            WHERE 
                uc.user_id IS NOT NULL 
                AND ABS(p.credits - uc.balance) > 0
            ORDER BY difference DESC
            LIMIT 20
        ) AS consistency_check;
    ELSE
        RAISE NOTICE 'user_credits table does not exist - single source consistency OK';
    END IF;
END $$;

-- ================================
-- 7. FAILED TRANSACTION ANALYSIS
-- ================================
\echo '=== FAILED TRANSACTION ANALYSIS ==='
SELECT 
  operation,
  reason,
  COUNT(*) as failure_count,
  SUM(credits_amount) as credits_involved,
  STRING_AGG(DISTINCT user_id::text, ', ') as affected_users
FROM credit_audit_log 
WHERE 
  success = false
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY operation, reason
ORDER BY failure_count DESC;

-- ================================
-- 8. SUMMARY REPORT
-- ================================
\echo '=== EMERGENCY SUMMARY REPORT ==='
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT 
  'Users with Negative Credits' as metric,
  COUNT(*)::text as value
FROM profiles 
WHERE credits < 0
UNION ALL
SELECT 
  'Total Negative Credit Exposure' as metric,
  COALESCE(SUM(ABS(credits)), 0)::text as value
FROM profiles 
WHERE credits < 0
UNION ALL
SELECT 
  'Failed Transactions (7 days)' as metric,
  COUNT(*)::text as value
FROM credit_audit_log 
WHERE success = false AND timestamp > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Suspicious Operations (7 days)' as metric,
  COUNT(*)::text as value
FROM credit_audit_log 
WHERE 
  timestamp > NOW() - INTERVAL '7 days'
  AND (
    operation LIKE '%fallback%' 
    OR after_balance < 0
    OR operation LIKE '%emergency%'
  );

\echo '=== DAMAGE ASSESSMENT COMPLETE ==='
\echo 'If negative credits found: RUN EMERGENCY MIGRATION IMMEDIATELY'
\echo 'If suspicious activity found: INVESTIGATE AFFECTED USERS'
\echo 'If race conditions detected: VERIFY CONCURRENT OPERATION PROTECTION'