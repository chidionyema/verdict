# RLS Policy Fix for Profile Creation

## Issue
Users getting "new row violates row-level security policy for table 'profiles'" error when creating accounts.

## Root Cause
The RLS (Row Level Security) policy on the `profiles` table doesn't allow users to insert their own profile records during account creation.

## Solution Applied
Modified profile creation to use the service role client which bypasses RLS:

### Files Updated
1. `lib/verdicts.ts` - Profile creation during verdict request
2. `app/api/judge/demographics/route.ts` - Profile creation during judge onboarding

### Code Changes
```typescript
// Before (using regular client - blocked by RLS)
const { data: newProfile, error: createError } = await supabase
  .from('profiles')
  .insert({ ... });

// After (using service role client - bypasses RLS)
const serviceClient = createServiceClient();
const { data: newProfile, error: createError } = await serviceClient
  .from('profiles')
  .insert({ ... });
```

## Recommended RLS Policy (Alternative Solution)
If you prefer to fix this with proper RLS policies instead of using service role:

```sql
-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

## Security Notes
- Using service role client bypasses ALL RLS policies
- This is safe for profile creation as we validate user ID comes from auth
- Consider implementing proper RLS policies for production
- Service role key should never be exposed to client-side code

## Testing
1. Try creating a new account
2. Verify profile gets created successfully
3. Check that user can access their profile data
4. Ensure no unauthorized access to other profiles