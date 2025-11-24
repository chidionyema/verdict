# Database Migration Notes for Pricing Changes

## Current State

The database schema has `target_verdict_count INTEGER DEFAULT 10` in the `verdict_requests` table.

## Options for Existing Data

### Option 1: Leave Existing Requests As-Is (RECOMMENDED)
- Existing requests with `target_verdict_count: 10` will complete with 10 verdicts
- New requests will use `target_verdict_count: 5` (set in application code)
- **Pros:** No user disappointment, honors existing commitments
- **Cons:** One-time cost for existing requests

### Option 2: Update All Open Requests
Run this SQL in Supabase:
```sql
-- Update all open/in_progress requests to 5 verdicts
UPDATE verdict_requests
SET target_verdict_count = 5
WHERE status IN ('open', 'in_progress', 'pending')
AND target_verdict_count = 10;
```

**Pros:** Consistent experience
**Cons:** May disappoint users expecting 10 verdicts

### Option 3: Update Schema Default Only
Run this SQL in Supabase:
```sql
-- Update default for new requests only
ALTER TABLE verdict_requests 
ALTER COLUMN target_verdict_count SET DEFAULT 5;
```

**Pros:** Future requests use correct default
**Cons:** Existing requests still have 10

## Recommended Approach

**Use Option 1 + Option 3:**
1. Update schema default (Option 3) - for new installations
2. Leave existing requests as-is (Option 1) - honor commitments
3. Application code already sets 5 for new requests

## SQL Migration Script

If you want to update the default:

```sql
-- Update default value for new requests
ALTER TABLE verdict_requests 
ALTER COLUMN target_verdict_count SET DEFAULT 5;

-- Optional: Update open requests (only if you want consistency)
-- UPDATE verdict_requests
-- SET target_verdict_count = 5
-- WHERE status IN ('open', 'in_progress', 'pending')
-- AND target_verdict_count = 10
-- AND created_at > NOW() - INTERVAL '24 hours'; -- Only recent ones
```

## Credit Packages Update

If you have a `credit_packages` table, update it:

```sql
-- Update credit package prices
UPDATE credit_packages
SET price_cents = CASE
  WHEN credits = 5 THEN 1495   -- $14.95
  WHEN credits = 10 THEN 2990  -- $29.90
  WHEN credits = 25 THEN 7475  -- $74.75
  WHEN credits = 50 THEN 14950 -- $149.50
  ELSE price_cents
END
WHERE is_active = true;
```

## Verification

After migration, verify:
```sql
-- Check default value
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'verdict_requests' 
AND column_name = 'target_verdict_count';

-- Check recent requests
SELECT target_verdict_count, COUNT(*) 
FROM verdict_requests 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY target_verdict_count;
```

