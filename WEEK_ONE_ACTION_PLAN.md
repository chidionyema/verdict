# Week One Action Plan - Fix Showstoppers
## Goal: Production-Ready by End of Week

---

## DAY 1 - Monday (Stripe + Payments)

### Morning (4 hours):
**Fix Stripe Webhook Handlers**

1. Implement `handleCheckoutSessionCompleted`:
```typescript
async function handleCheckoutSessionCompleted(session, supabase) {
  const { user_id, credits } = session.metadata;

  // Atomic credit addition
  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: user_id,
    p_credits: parseInt(credits)
  });

  // Log transaction
  await supabase.from('transactions').insert({
    user_id,
    type: 'purchase',
    credits_delta: parseInt(credits),
    amount_cents: session.amount_total,
    stripe_session_id: session.id,
    status: 'completed'
  });
}
```

2. Create SQL function for atomic credit addition:
```sql
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_credits INT)
RETURNS INT AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE profiles
  SET credits = credits + p_credits
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;
```

3. Implement remaining handlers:
   - `handlePaymentIntentSucceeded`
   - `handlePaymentIntentFailed`
   - `handleInvoicePaymentSucceeded`
   - `handleInvoicePaymentFailed`

### Afternoon (4 hours):
**Fix Credit Race Condition**

1. Create atomic deduct function:
```sql
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INT)
RETURNS TABLE(success BOOLEAN, new_balance INT) AS $$
DECLARE
  current_balance INT;
  new_bal INT;
BEGIN
  SELECT credits INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Lock row

  IF current_balance < p_credits THEN
    RETURN QUERY SELECT FALSE, current_balance;
  ELSE
    UPDATE profiles
    SET credits = credits - p_credits
    WHERE id = p_user_id
    RETURNING TRUE, credits INTO success, new_bal;

    RETURN QUERY SELECT TRUE, new_bal;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

2. Update `lib/verdicts.ts`:
```typescript
// Replace lines 94-109
const { data: result } = await supabase.rpc('deduct_credits', {
  p_user_id: userId,
  p_credits: creditsToUse
});

if (!result[0].success) {
  throw new Error('INSUFFICIENT_CREDITS');
}
```

---

## DAY 2 - Tuesday (TypeScript + Rate Limiting)

### Morning (4 hours):
**Remove @ts-nocheck from Critical Files**

Priority order:
1. `app/api/judge/respond/route.ts`
2. `app/api/requests/route.ts`
3. `app/api/webhooks/stripe/route.ts`
4. `app/api/judge/queue/stream/route.ts`
5. `lib/verdicts.ts`

For each file:
1. Remove `// @ts-nocheck`
2. Fix type errors (add proper types)
3. Test the endpoint
4. Commit

### Afternoon (4 hours):
**Implement Rate Limiting**

1. Install package:
```bash
npm install rate-limiter-flexible
```

2. Create `lib/rate-limiter.ts`:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const requestRateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per minute
});

export const verdictRateLimiter = new RateLimiterMemory({
  points: 10, // 10 verdicts
  duration: 60, // per minute
});

export const uploadRateLimiter = new RateLimiterMemory({
  points: 3, // 3 uploads
  duration: 60, // per minute
});
```

3. Apply to endpoints:
```typescript
// In each route
const rateLimiterKey = user.id;
try {
  await requestRateLimiter.consume(rateLimiterKey);
} catch {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

---

## DAY 3 - Wednesday (SSE + Database)

### Morning (4 hours):
**Fix SSE Memory Leak**

Option A - Quick Fix (polling):
1. Add max connection time:
```typescript
// After line 137
const maxDuration = 5 * 60 * 1000; // 5 minutes
setTimeout(() => {
  cleanup();
  controller.close();
}, maxDuration);
```

2. Add connection tracking:
```typescript
const activeConnections = new Map<string, number>();

// Before creating stream
if (activeConnections.has(user.id)) {
  return NextResponse.json(
    { error: 'Already connected' },
    { status: 409 }
  );
}
activeConnections.set(user.id, Date.now());

// In cleanup
activeConnections.delete(user.id);
```

Option B - Better Fix (Supabase Realtime):
```typescript
// Use Supabase's built-in realtime instead of polling
const channel = supabase
  .channel('requests')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'verdict_requests',
    filter: 'status=eq.open'
  }, (payload) => {
    fetchAndSendRequests();
  })
  .subscribe();
```

### Afternoon (4 hours):
**Run Database Migrations**

1. Connect to Supabase:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

2. Run migrations:
```bash
# Performance indexes
supabase db push supabase/migrations/add_performance_indexes.sql

# Judge tables
supabase db push supabase/migrations/20250124_create_judge_tables.sql
```

3. Verify indexes:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public';
```

4. Verify tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

---

## DAY 4 - Thursday (Security + Monitoring)

### Morning (4 hours):
**Remove Debug Endpoints**

1. Delete debug pages:
```bash
rm -rf app/debug
rm -rf app/debug-nav
rm -rf app/debug-rls
```

2. Protect debug APIs:
```typescript
// app/api/debug/*/route.ts
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { error: 'Not available in production' },
    { status: 403 }
  );
}
```

3. Remove `/api/fix-my-credits` entirely

### Afternoon (4 hours):
**Setup Error Tracking**

1. Sign up for Sentry (free tier)

2. Install:
```bash
npm install @sentry/nextjs
```

3. Configure:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

4. Add error boundary:
```tsx
// app/error.tsx
'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## DAY 5 - Friday (Testing + Polish)

### Morning (4 hours):
**Load Testing**

1. Create test script:
```typescript
// test/load-test.ts
import { test } from '@playwright/test';

test('50 concurrent judges', async ({ page }) => {
  // Simulate 50 judges opening dashboard
  const promises = Array(50).fill(null).map(() =>
    page.goto('/judge/dashboard')
  );
  await Promise.all(promises);
});
```

2. Monitor:
   - Database connections
   - Memory usage
   - Response times
   - Error rates

3. Fix any issues found

### Afternoon (4 hours):
**Final Checks**

1. ✅ All @ts-nocheck removed
2. ✅ All migrations run
3. ✅ Rate limiting works
4. ✅ Stripe webhooks tested (use Stripe CLI)
5. ✅ Error tracking receives errors
6. ✅ SSE doesn't leak memory
7. ✅ Debug endpoints removed/protected
8. ✅ Environment variables validated

**Deploy to staging and test end-to-end:**
1. User signs up → gets starter credits
2. User creates request → credits deducted
3. Judge sees request → submits verdict
4. User sees verdict → request completes
5. User buys credits → Stripe webhook adds credits
6. Verify all steps in database

---

## Weekend - Soft Launch Prep

### Saturday:
- Write deployment runbook
- Setup monitoring alerts
- Create rollback plan
- Test backup/restore

### Sunday:
- Rest (you'll need it!)

---

## Monday Week 2 - Soft Launch

**Launch to 10 beta users:**
1. Invite friends/colleagues
2. Monitor closely
3. Fix any bugs immediately
4. Iterate based on feedback

**If beta goes well (no critical bugs):**
- Scale to 50 users Wednesday
- Scale to 100 users Friday
- Full public launch next Monday

---

## Success Criteria

Before declaring "production-ready":
- [ ] Zero TypeScript errors
- [ ] All database migrations run successfully
- [ ] Rate limiting prevents abuse
- [ ] Stripe webhooks process correctly (test with Stripe CLI)
- [ ] No memory leaks in SSE (test with 50 connections for 1 hour)
- [ ] Error tracking captures all errors
- [ ] Load test passes (50 concurrent users)
- [ ] Manual QA passes all critical flows
- [ ] Staging environment mirrors production
- [ ] Rollback procedure documented and tested

---

## Emergency Contacts

If something breaks in production:
1. Check Sentry for errors
2. Check Supabase logs
3. Check Vercel/hosting logs
4. Rollback to previous deployment if needed

---

**Remember:** It's better to delay a week than to launch broken and damage reputation.

**You've got this!** The code is 80% there, just needs the final 20% of polish.
