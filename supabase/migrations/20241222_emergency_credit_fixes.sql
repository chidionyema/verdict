-- EMERGENCY MIGRATION: Fix Credit System Vulnerabilities
-- Applied: 2024-12-22 - War Room Response

-- 1. Add constraints to prevent negative credits
DO $$ 
BEGIN
    -- Check if constraint already exists on profiles table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_credits_non_negative'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT chk_credits_non_negative 
        CHECK (credits >= 0);
        
        RAISE NOTICE 'Added non-negative constraint to profiles.credits';
    ELSE
        RAISE NOTICE 'Constraint chk_credits_non_negative already exists on profiles table';
    END IF;

    -- Check if user_credits table exists and add constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'chk_balance_non_negative'
        ) THEN
            ALTER TABLE user_credits 
            ADD CONSTRAINT chk_balance_non_negative 
            CHECK (balance >= 0);
            
            RAISE NOTICE 'Added non-negative constraint to user_credits.balance';
        ELSE
            RAISE NOTICE 'Constraint chk_balance_non_negative already exists on user_credits table';
        END IF;
    ELSE
        RAISE NOTICE 'user_credits table does not exist, skipping constraint';
    END IF;
END $$;

-- 2. Fix any existing negative credit balances
-- Set minimum credit balance to 0 and log the corrections
DO $$
DECLARE
    negative_count INTEGER;
    user_record RECORD;
BEGIN
    -- Count negative credit users
    SELECT COUNT(*) INTO negative_count
    FROM profiles 
    WHERE credits < 0;
    
    IF negative_count > 0 THEN
        RAISE NOTICE 'Found % users with negative credits. Correcting...', negative_count;
        
        -- Log each correction before fixing
        FOR user_record IN 
            SELECT id, email, credits 
            FROM profiles 
            WHERE credits < 0
        LOOP
            -- Insert audit record
            INSERT INTO credit_audit_log (
                user_id,
                operation,
                credits_amount,
                before_balance,
                after_balance,
                success,
                timestamp,
                reason
            ) VALUES (
                user_record.id,
                'emergency_correction',
                ABS(user_record.credits), -- Amount corrected
                user_record.credits,      -- Negative balance
                0,                        -- Corrected to 0
                true,
                NOW(),
                'Emergency fix for negative credits - War Room response'
            );
        END LOOP;
        
        -- Correct negative balances to 0
        UPDATE profiles 
        SET credits = 0 
        WHERE credits < 0;
        
        RAISE NOTICE 'Corrected % negative credit balances to 0', negative_count;
    ELSE
        RAISE NOTICE 'No negative credit balances found';
    END IF;
END $$;

-- 3. Fix user_credits table if it exists and has negative balances
DO $$
DECLARE
    negative_count INTEGER;
    user_record RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        -- Count negative balances
        SELECT COUNT(*) INTO negative_count
        FROM user_credits 
        WHERE balance < 0;
        
        IF negative_count > 0 THEN
            RAISE NOTICE 'Found % users with negative balances in user_credits table. Correcting...', negative_count;
            
            -- Log each correction
            FOR user_record IN 
                SELECT user_id, balance 
                FROM user_credits 
                WHERE balance < 0
            LOOP
                -- Insert audit record
                INSERT INTO credit_audit_log (
                    user_id,
                    operation,
                    credits_amount,
                    before_balance,
                    after_balance,
                    success,
                    timestamp,
                    reason
                ) VALUES (
                    user_record.user_id,
                    'emergency_correction_user_credits',
                    ABS(user_record.balance), -- Amount corrected
                    user_record.balance,       -- Negative balance
                    0,                         -- Corrected to 0
                    true,
                    NOW(),
                    'Emergency fix for negative balances in user_credits - War Room response'
                );
            END LOOP;
            
            -- Correct negative balances to 0
            UPDATE user_credits 
            SET balance = 0 
            WHERE balance < 0;
            
            RAISE NOTICE 'Corrected % negative balances in user_credits table', negative_count;
        ELSE
            RAISE NOTICE 'No negative balances found in user_credits table';
        END IF;
    ELSE
        RAISE NOTICE 'user_credits table does not exist';
    END IF;
END $$;

-- 4. Create emergency monitoring view for credit anomalies
CREATE OR REPLACE VIEW credit_anomaly_monitor AS
SELECT 
    p.id as user_id,
    p.email,
    p.credits as profile_credits,
    uc.balance as user_credits_balance,
    CASE 
        WHEN p.credits < 0 THEN 'NEGATIVE_PROFILE_CREDITS'
        WHEN uc.balance < 0 THEN 'NEGATIVE_USER_CREDITS'
        WHEN ABS(p.credits - COALESCE(uc.balance, p.credits)) > 5 THEN 'CREDIT_MISMATCH'
        ELSE 'OK'
    END as anomaly_type,
    p.updated_at as last_profile_update,
    uc.updated_at as last_user_credits_update
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
WHERE 
    p.credits < 0 
    OR uc.balance < 0 
    OR ABS(p.credits - COALESCE(uc.balance, p.credits)) > 5;

-- 5. Create emergency alert function for negative credits
CREATE OR REPLACE FUNCTION emergency_credit_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert if anyone tries to set negative credits
    IF NEW.credits < 0 THEN
        -- Log the attempt
        INSERT INTO credit_audit_log (
            user_id,
            operation,
            credits_amount,
            before_balance,
            after_balance,
            success,
            timestamp,
            reason
        ) VALUES (
            NEW.id,
            'negative_credit_attempt_blocked',
            OLD.credits - NEW.credits,
            OLD.credits,
            NEW.credits,
            false,
            NOW(),
            'EMERGENCY: Attempt to set negative credits blocked by trigger'
        );
        
        -- Prevent the update
        RAISE EXCEPTION 'EMERGENCY BLOCK: Cannot set negative credits. User: %, Attempted: %', 
            NEW.id, NEW.credits;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to profiles table
DROP TRIGGER IF EXISTS emergency_negative_credit_prevention ON profiles;
CREATE TRIGGER emergency_negative_credit_prevention
    BEFORE UPDATE OF credits ON profiles
    FOR EACH ROW
    WHEN (NEW.credits IS DISTINCT FROM OLD.credits)
    EXECUTE FUNCTION emergency_credit_alert();

-- Apply the trigger to user_credits table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        -- Create trigger for user_credits table
        CREATE OR REPLACE FUNCTION emergency_user_credit_alert()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF NEW.balance < 0 THEN
                INSERT INTO credit_audit_log (
                    user_id,
                    operation,
                    credits_amount,
                    before_balance,
                    after_balance,
                    success,
                    timestamp,
                    reason
                ) VALUES (
                    NEW.user_id,
                    'negative_balance_attempt_blocked',
                    OLD.balance - NEW.balance,
                    OLD.balance,
                    NEW.balance,
                    false,
                    NOW(),
                    'EMERGENCY: Attempt to set negative balance blocked by trigger'
                );
                
                RAISE EXCEPTION 'EMERGENCY BLOCK: Cannot set negative balance. User: %, Attempted: %', 
                    NEW.user_id, NEW.balance;
            END IF;
            
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS emergency_negative_balance_prevention ON user_credits;
        CREATE TRIGGER emergency_negative_balance_prevention
            BEFORE UPDATE OF balance ON user_credits
            FOR EACH ROW
            WHEN (NEW.balance IS DISTINCT FROM OLD.balance)
            EXECUTE FUNCTION emergency_user_credit_alert();
            
        RAISE NOTICE 'Applied emergency trigger to user_credits table';
    END IF;
END $$;

-- 6. Generate emergency report
DO $$
DECLARE
    total_users INTEGER;
    negative_profile_credits INTEGER;
    negative_user_credits INTEGER;
    total_anomalies INTEGER;
BEGIN
    -- Count totals
    SELECT COUNT(*) INTO total_users FROM profiles;
    
    SELECT COUNT(*) INTO negative_profile_credits 
    FROM profiles WHERE credits < 0;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        SELECT COUNT(*) INTO negative_user_credits 
        FROM user_credits WHERE balance < 0;
    ELSE
        negative_user_credits := 0;
    END IF;
    
    SELECT COUNT(*) INTO total_anomalies FROM credit_anomaly_monitor;
    
    -- Emergency report
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'EMERGENCY CREDIT SYSTEM REPORT';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with negative profile credits: %', negative_profile_credits;
    RAISE NOTICE 'Users with negative user_credits: %', negative_user_credits;
    RAISE NOTICE 'Total credit anomalies: %', total_anomalies;
    RAISE NOTICE '==========================================';
    
    IF negative_profile_credits > 0 OR negative_user_credits > 0 THEN
        RAISE NOTICE 'CRITICAL: Negative credits detected and corrected!';
    ELSE
        RAISE NOTICE 'SUCCESS: No negative credits found';
    END IF;
    RAISE NOTICE '==========================================';
END $$;

-- Add comments for documentation
COMMENT ON VIEW credit_anomaly_monitor IS 'Emergency monitoring view for detecting credit system anomalies';
COMMENT ON FUNCTION emergency_credit_alert() IS 'Emergency trigger function to prevent negative credits in profiles table';
COMMENT ON TRIGGER emergency_negative_credit_prevention ON profiles IS 'Emergency trigger to block negative credit assignments';