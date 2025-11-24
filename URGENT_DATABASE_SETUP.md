# URGENT: Missing Database Tables

## Problem
The judge demographics feature is failing because two database tables are missing:
- `judge_demographics` - stores judge profile information
- `judge_availability` - tracks judge online status

## Solution
You need to run the SQL migration in your Supabase project.

### Option 1: Run via Supabase Studio (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/migrations/20250124_create_judge_tables.sql`
5. Click "Run" or press Ctrl+Enter

### Option 2: Run via Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

## Verify Setup
After running the migration, verify the tables were created:
1. Go to "Table Editor" in Supabase Studio
2. You should see two new tables:
   - `judge_demographics`
   - `judge_availability`

## What This Fixes
- ✓ Judge qualification process will work
- ✓ Demographics can be saved
- ✓ Judge availability tracking will function
- ✓ No more "Demographics API error: {}" messages

## Related Files
- Migration SQL: `supabase/migrations/20250124_create_judge_tables.sql`
- API endpoint: `app/api/judge/demographics/route.ts`
- Qualification page: `app/judge/qualify/page.tsx`
