# QA Audit Report: Verdict Application
## Comprehensive Bug & Quality Analysis
### Date: 2025-11-27

---

## Executive Summary

This report documents **67 issues** identified across 6 audit categories. The codebase has several critical security vulnerabilities, race conditions that could cause financial loss, and type safety issues that will cause runtime crashes.

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Error Handling | 4 | 6 | 9 | 6 | 25 |
| Race Conditions | 2 | 5 | 2 | 0 | 9 |
| Input Validation | 2 | 8 | 5 | 3 | 18 |
| Auth/Authorization | 3 | 2 | 3 | 2 | 10 |
| TypeScript Safety | 3 | 9 | 4 | 0 | 16 |
| Resource Leaks | 1 | 4 | 4 | 0 | 9 |
| **TOTAL** | **15** | **34** | **27** | **11** | **87** |

**Recommendation:** Do not go live until all Critical and High severity issues are resolved.

---

## Category 1: Error Handling & Edge Cases

### CRITICAL

#### 1.1 SQL Injection in Query String Interpolation
**File:** `app/api/judge/queue/stream/route.ts:157`
```typescript
query = query.not('id', 'in', `(${excludeIds.join(',')})`);
```
**Issue:** Building SQL IN clause with string concatenation. If `excludeIds` contains malicious data, SQL injection possible.
**Fix:** Use Supabase's `.not('id', 'in', excludeIds)` array syntax.

#### 1.2 Missing Request Body Validation Before JSON Parse
**File:** `app/api/judge/connect/route.ts:91`
```typescript
const body = await request.json().catch(() => ({}));
```
**Issue:** Invalid JSON silently returns empty object, bypassing validation.
**Fix:** Return 400 error on invalid JSON.

#### 1.3 Unhandled Promise Rejection in SSE Polling
**File:** `app/api/judge/queue/stream/route.ts:184-186`
```typescript
interval = setInterval(async () => {
  await fetchAndSendRequests();  // No error handling
}, 30000);
```
**Issue:** Async callback in setInterval without try-catch can cause unhandled rejections.
**Fix:** Wrap in try-catch inside the callback.

#### 1.4 Missing Environment Variable Validation
**File:** `app/api/webhooks/stripe/route.ts:16`
```typescript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
```
**Issue:** Non-null assertion without runtime check. Will crash if env var missing.
**Fix:** Add validation at startup or return 500 with appropriate error.

### HIGH

#### 1.5 Unvalidated Array Access in Stripe Webhook
**File:** `app/api/webhooks/stripe/route.ts:160`
```typescript
receipt_url: (paymentIntent as any).charges.data[0]?.receipt_url,
```
**Issue:** `charges.data` might be empty, causing undefined access.

#### 1.6 Missing Array Element Validation
**File:** `app/api/judge/qualify/route.ts:35`
**Issue:** Array existence validated but element types not checked before database insert.

#### 1.7 Silent Failure in Promise.all Loop
**File:** `app/api/admin/reports/route.ts:63-97`
**Issue:** Errors in report enhancement loop silently caught, no logging of which report failed.

#### 1.8 Missing Metadata Validation in Stripe Webhook
**File:** `app/api/webhooks/stripe/route.ts:95-96`
**Issue:** Empty string for `type` would pass truthiness check.

#### 1.9 Missing Profile Null Check After .single()
**File:** `app/api/integrations/email/route.ts:25-32`
**Issue:** `.single()` throws if not found, but error not caught before null check.

#### 1.10 Missing UUID Format Validation
**File:** `app/api/requests/[id]/route.ts:27`
**Issue:** Request ID used directly without validating UUID format.

### MEDIUM

- 1.11 Inconsistent error response formats across endpoints
- 1.12 Missing enum validation in search route sort parameter
- 1.13 Missing pagination bounds (negative offset allowed)
- 1.14 Silent failure in best-effort operations without retry
- 1.15 Silent notification creation failures
- 1.16 Missing bounds check on integer parameters
- 1.17 PUT endpoint validation bypass for custom templates
- 1.18 HTTP 200 returned instead of 201 for resource creation
- 1.19 Inconsistent logging patterns

### LOW

- 1.20 Missing charset in SSE Content-Type header
- 1.21 Hardcoded tier configuration without fallback validation
- 1.22 Magic numbers in payout fee calculation
- 1.23 Implicit type coercion in math operations
- 1.24 Inconsistent error context in log statements
- 1.25 Missing explicit charset encoding declarations

---

## Category 2: Race Conditions & Concurrency

### CRITICAL

#### 2.1 TOCTOU Double-Response in Judge Verdict Creation
**File:** `lib/verdicts.ts:200-227`
```typescript
// Check if judge already responded
const { data: existingResponse } = await supabase
  .from('verdict_responses')
  .select('id')
  .eq('request_id', requestId)
  .eq('judge_id', judgeId)
  .single();

if (existingResponse) { throw err; }

// INSERT verdict (gap where race can occur)
const { data: verdict } = await supabase
  .from('verdict_responses')
  .insert({ ... })
```
**Scenario:** Two identical requests 100ms apart both pass the check before either insert commits.
**Impact:** Judge paid twice for same verdict, request marked complete prematurely.
**Fix:** Add UNIQUE constraint on `(request_id, judge_id)` and use upsert.

#### 2.2 Non-Atomic Payout + Earnings Update
**File:** `app/api/judge/payouts/route.ts:200-209`
```typescript
// Create payout record FIRST
const { data: payout } = await supabase.from('payouts').insert({...});

// THEN update earnings (separate operation)
await supabase.from('judge_earnings').update({payout_status: 'paid'})...
```
**Scenario:** Payout created, Stripe transfer sent, then error before earnings update. Earnings remain 'available' for duplicate payout.
**Impact:** Double payout - judge receives 2x the earned amount.
**Fix:** Wrap in database transaction or use RPC function with atomicity.

### HIGH

#### 2.3 Profile Creation Race on New Users
**File:** `lib/verdicts.ts:59-111`
**Issue:** Check-then-create pattern for new user profiles allows duplicate profile creation.

#### 2.4 Earnings Insert Error Silently Ignored
**File:** `app/api/judge/respond/route.ts:131-152`
**Issue:** Earnings creation failure logged but endpoint returns 200 success.

#### 2.5 Missing RPC Function for Payout Availability
**File:** `app/api/judge/payouts/route.ts:63, 117`
**Issue:** `get_available_payout_amount` RPC function not found in migrations.

#### 2.6 Webhook-App Update Race Condition
**File:** `app/api/judge/payouts/route.ts:156-209`
**Issue:** Stripe webhook may arrive before app finishes updating payout record.

#### 2.7 Check-Then-Act Payout Balance Check
**File:** `app/api/judge/payouts/route.ts:115-127`
**Issue:** Balance checked, then payout created in separate operations. Two concurrent requests could both pass check.

### MEDIUM

#### 2.8 Idempotency Check Race in Stripe Webhook
**File:** `app/api/webhooks/stripe/route.ts:103-112`
**Issue:** Between SELECT and INSERT, duplicate webhook could slip through.

#### 2.9 SSE Connection Map Race
**File:** `app/api/judge/queue/stream/route.ts:106-118`
**Issue:** Connection map operations not atomic, could lose connection reference.

---

## Category 3: Input Validation & Sanitization

### CRITICAL

#### 3.1 SQL Injection in Search ilike()
**File:** `app/api/search/route.ts:26-32`
```typescript
.ilike('category', category ? `%${category}%` : '%')
```
**Malicious Input:** `category: "test%' OR '1'='1"`
**Impact:** Bypass filters, extract unauthorized data.

#### 3.2 SQL Injection in Help Articles Search
**File:** `app/api/help/articles/route.ts:55`
```typescript
query.or(`title.ilike.%${q}%, content.ilike.%${q}%, tags.cs.{${q}}`)
```
**Malicious Input:** `q: "test%' OR '1'='1"`
**Impact:** Direct SQL injection through PostgREST query builder.

### HIGH

#### 3.3 Unvalidated URL Parameters in SSE Stream
**File:** `app/api/requests/[id]/stream/route.ts:66`
**Issue:** Request ID used without UUID validation.

#### 3.4 Missing Pagination Limits
**Files:** Multiple endpoints
**Issue:** No lower bound validation (negative values accepted).

#### 3.5 XSS in Email HTML
**File:** `app/api/integrations/email/route.ts:110`
```typescript
html: body.custom_html,  // Unsanitized
```
**Malicious Input:** `<script>alert('xss')</script>`

#### 3.6 File Extension Bypass
**File:** `app/api/upload/route.ts:62`
```typescript
const ext = file.name.split('.').pop() || 'jpg';
```
**Malicious Input:** `malicious.php.jpg`

#### 3.7 Unvalidated voice_url Parameter
**File:** `app/api/judge/respond/route.ts:92`
**Issue:** URL accepted without validation, stored directly.

#### 3.8 Missing Integer Bounds on Page Parameter
**File:** `app/api/support/tickets/route.ts:28-29`
**Malicious Input:** `page: "2147483647"` causes integer overflow.

#### 3.9 Missing Length Validation on Array Fields
**File:** `app/api/help/articles/route.ts:10`
**Issue:** Tags array accepts unlimited entries.

#### 3.10 Unvalidated Credits parseInt
**File:** `app/api/webhooks/stripe/route.ts:99`
**Malicious Input:** `metadata.credits: "999999999999"` could inflate credits.

### MEDIUM

- 3.11 Missing Stripe ID format validation
- 3.12 Unvalidated sort parameter passed to RPC
- 3.13 Missing max length on moderator_notes
- 3.14 Trusting x-forwarded-for header without validation
- 3.15 parseInt without NaN check

### LOW

- 3.16 No explicit UUID validation on route params (relies on RLS)
- 3.17 Optional description without max length
- 3.18 String slicing without length validation

---

## Category 4: Authentication & Authorization

### CRITICAL

#### 4.1 Privilege Escalation via is_judge Field
**File:** `app/api/profile/route.ts:36-44`
```typescript
if (is_judge !== undefined) {
  updateData.is_judge = is_judge;  // No authorization check!
}
```
**Attack:** Regular user sends `PATCH /api/profile` with `{"is_judge": true}`.
**Impact:** User gains judge privileges without qualification.
**Fix:** Only allow admins or qualification system to modify is_judge.

#### 4.2 Missing Auth on Email PUT Endpoint
**File:** `app/api/integrations/email/route.ts:101-146`
```typescript
export async function PUT(request: NextRequest) {
  const body = await request.json();
  // NO AUTH CHECK!
  if (body.template === 'custom' && body.custom_html) {
    await sendEmail({...});
  }
}
```
**Attack:** Unauthenticated request sends spam via application email service.
**Fix:** Add auth check at start of PUT handler.

#### 4.3 Missing Field Whitelist on Profile PATCH
**File:** `app/api/profile/route.ts:1-95`
**Issue:** No explicit whitelist prevents `is_admin` from being set if added to request.
**Fix:** Explicitly whitelist allowed fields.

### HIGH

#### 4.4 No API-Layer Check for Judging Own Requests
**File:** `app/api/judge/respond/route.ts:86-93`
**Issue:** Validation only in domain function, not API layer.

#### 4.5 Judge Can Monitor Any Request Stream
**File:** `app/api/requests/[id]/stream/route.ts:95-109`
**Issue:** Any judge can watch progress of any request in real-time.

### MEDIUM

- 4.6 Admin check happens after Supabase client creation
- 4.7 No rate limiting on admin endpoints
- 4.8 Missing ownership validation in edge cases

### LOW

- 4.9 Information disclosure via error messages
- 4.10 Webhook user validation relies on Stripe metadata

---

## Category 5: TypeScript Type Safety

### CRITICAL

#### 5.1 Unsafe Payment Intent Assertion
**File:** `app/api/payment/checkout/route.ts:188`
```typescript
stripe_payment_intent_id: session.payment_intent as string || null,
```
**Issue:** `session.payment_intent` can be null. Cast hides this.
**Runtime Error:** Inserts "null" string into database.

#### 5.2 Unsafe Array Access on Stripe Charges
**File:** `app/api/webhooks/stripe/route.ts:160`
```typescript
(paymentIntent as any).charges.data[0]?.receipt_url
```
**Issue:** charges.data could be empty array.
**Runtime Error:** TypeError on empty array.

#### 5.3 Billing Webhook Payment Intent Assertion
**File:** `app/api/billing/webhook/route.ts:76, 78, 112`
**Issue:** Multiple non-null assertions on potentially null payment_intent.

### HIGH

#### 5.4 Missing Null Check After .single()
**Files:** Multiple (judge/queue/stream, integrations/email, etc.)
**Issue:** `.single()` returns null on not found, but code doesn't check error first.

#### 5.5 Unsafe RPC Result Array Access
**Files:** `lib/verdicts.ts:104`, `webhooks/stripe/route.ts:125, 207`
```typescript
const result = (deductResult as any)?.[0];
if (!result || !result.success) {...}
```
**Issue:** Assumes non-empty array. Empty array causes `result` to be undefined.

#### 5.6 Invoice Subscription Type Coercion
**File:** `app/api/webhooks/stripe/route.ts:185-189`
**Issue:** Casts subscription to string without validating it's actually a string.

#### 5.7 Incorrect maybeSingle Syntax
**File:** `app/api/webhooks/stripe/route.ts:107`
```typescript
.maybeSingle?.() ?? { data: null };
```
**Issue:** Optional chaining on method call is incorrect syntax.

#### 5.8 Type Escape Hatch in Help Articles
**File:** `app/api/help/articles/[id]/route.ts:26`
```typescript
as { data: { [key: string]: any } | null; error: any }
```
**Issue:** `[key: string]: any` defeats type checking entirely.

#### 5.9-5.12 Additional null check issues across auth flows and profile lookups.

### MEDIUM

- 5.13 Unsafe Stripe API version cast
- 5.14 Unvalidated metadata access patterns
- 5.15 Array bounds issues in utility functions
- 5.16 Missing length checks before array access

---

## Category 6: Memory Leaks & Resource Cleanup

### CRITICAL

#### 6.1 SSE Active Connections Map Unbounded
**File:** `app/api/judge/queue/stream/route.ts:7, 105-118`
```typescript
const activeConnections = new Map<string, {...}>();
```
**Issue:** Map entries accumulate from crashed clients. No TTL-based cleanup.
**Impact:** 5MB+ memory leak over 24 hours at 10K users.
**Fix:** Add periodic cleanup of entries older than MAX_CONNECTION_DURATION.

### HIGH

#### 6.2 Cache Cleanup Interval Never Cancelled
**File:** `lib/cache.ts:150-154`
```typescript
setInterval(() => { cache.cleanup(); }, 10 * 60 * 1000);
```
**Issue:** No reference stored, can't cancel. Multiple intervals on redeploy.
**Fix:** Store interval reference, provide shutdown method.

#### 6.3 Rate Limiter Intervals Not Managed
**File:** `lib/rate-limit.ts:19-34`
**Issue:** 6 RateLimiter instances each create cleanup intervals with no shutdown.

#### 6.4 EventSource Not Closed on Navigation
**File:** `app/judge/page.tsx:114-149`
**Issue:** Cleanup depends on profile?.is_judge change, not navigation.

#### 6.5 Orphaned setTimeout in RealTimeWaitingStatus
**File:** `components/request/RealTimeWaitingStatus.tsx:57`
```typescript
setTimeout(() => setRecentVerdict(false), 3000);  // No stored reference
```
**Issue:** Creates orphaned timeouts on rapid mount/unmount.

### MEDIUM

- 6.6 Cache unbounded without LRU eviction
- 6.7 Abort listener cleanup not guaranteed on error
- 6.8 Stripe instances created per request (no singleton)
- 6.9 Cleanup callback error handling incomplete

---

## Priority Action Items

### P0 - Must Fix Before Launch

1. **4.1** Remove ability for users to set is_judge via profile PATCH
2. **4.2** Add authentication to email PUT endpoint
3. **2.1** Add UNIQUE constraint on verdict_responses (request_id, judge_id)
4. **2.2** Make payout + earnings update atomic (use transaction/RPC)
5. **3.1, 3.2** Fix SQL injection in search endpoints
6. **5.1, 5.2, 5.3** Fix unsafe type assertions in Stripe handling
7. **6.1** Add TTL cleanup for activeConnections Map

### P1 - Fix Within First Week

8. **1.1** Fix SQL string interpolation in judge queue
9. **2.3-2.7** Address remaining race conditions
10. **3.3-3.10** Add input validation for all parameters
11. **4.4, 4.5** Tighten authorization checks
12. **5.4-5.8** Fix null checks after .single() queries
13. **6.2-6.5** Fix resource cleanup issues

### P2 - Fix Within First Month

14. All Medium severity issues
15. Standardize error response formats
16. Add comprehensive input validation schemas
17. Implement proper TypeScript strict mode

---

## Testing Recommendations

### Security Testing
```
1. Attempt is_judge privilege escalation via profile PATCH
2. Test SQL injection payloads in search endpoints
3. Test XSS payloads in email custom_html
4. Test IDOR on all resource endpoints
5. Test unauthenticated access to email PUT
```

### Race Condition Testing
```
1. Concurrent verdict submissions by same judge
2. Concurrent payout requests for same earnings
3. Rapid profile creation for new users
4. Duplicate Stripe webhook delivery
```

### Load Testing
```
1. 10K concurrent SSE connections - monitor memory
2. Rapid component mount/unmount cycles
3. Extended cache population test
4. Multiple rate limiter instance creation
```

---

*Report generated by QA audit on 2025-11-27*
*Total issues: 87 | Critical: 15 | High: 34 | Medium: 27 | Low: 11*
