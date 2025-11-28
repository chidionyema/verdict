# Next.js SaaS Starter Kit - Extraction Guide

This document catalogs all reusable patterns from the Verdict codebase that can be extracted into a starter template for future projects.

---

## Quick Reference: Copy-Paste Ready

| Component | Source File | Effort | Dependencies |
|-----------|-------------|--------|--------------|
| Rate Limiter | `lib/rate-limiter.ts` | Direct copy | None |
| Logger | `lib/logger.ts` | Direct copy | `@logtail/node` (optional) |
| Env Validation | `lib/env.ts` | Parameterize | None |
| Supabase Client | `lib/supabase/` | Direct copy | `@supabase/ssr` |
| API Utils | `lib/api-utils.ts` | Direct copy | None |
| Cookie Consent | `components/cookie-consent.tsx` | Direct copy | None |
| Analytics Provider | `components/analytics-provider.tsx` | Direct copy | `@vercel/analytics` |
| Error Boundary | `components/ErrorBoundary.tsx` | Direct copy | None |
| Email Service | `lib/email.ts` | Parameterize | `resend` |
| Stripe Integration | `lib/stripe.ts` | Parameterize | `stripe` |
| Credit System SQL | `supabase/migrations/20250124_atomic_credit_operations.sql` | Direct copy | Supabase |

---

## Tier 1: Zero-Config Extraction (Copy & Use)

### 1. Rate Limiter (`lib/rate-limiter.ts`)

**What it does:** In-memory rate limiting with sliding window algorithm. No Redis needed.

**Features:**
- LRU cache with automatic cleanup
- Pre-configured limiters for common endpoints
- Memory-bounded (won't grow unbounded)

**Usage:**
```typescript
import { rateLimiters, checkRateLimit } from '@/lib/rate-limiter';

// In API route
const { allowed, error } = await checkRateLimit(rateLimiters.api, identifier);
if (!allowed) return NextResponse.json({ error }, { status: 429 });
```

**Pre-configured limiters:**
- `requestCreation`: 5/minute
- `verdictSubmission`: 10/minute
- `fileUpload`: 3/minute
- `paymentEndpoint`: 5/minute
- `authAttempt`: 5/5 minutes
- `api`: 30/minute

---

### 2. Structured Logger (`lib/logger.ts`)

**What it does:** Production-ready logging with Better Stack integration + console fallback.

**Features:**
- Structured JSON in production
- Console output in development
- Error serialization
- Serverless-safe flush

**Usage:**
```typescript
import { log } from '@/lib/logger';

log.info('User signed up', { userId, email });
log.error('Payment failed', error, { orderId });
log.warn('Rate limit approaching', { remaining: 5 });
```

**Config:** Set `LOGTAIL_TOKEN` for production logging, otherwise falls back to console.

---

### 3. Environment Validation (`lib/env.ts`)

**What it does:** Type-safe environment variables with fail-fast validation.

**Features:**
- Validates on startup (catches missing vars early)
- Beautiful error formatting
- Demo mode support
- Distinguishes required vs optional

**Customize for your project:**
```typescript
export const env = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: optionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  stripe: {
    secretKey: optionalEnv('STRIPE_SECRET_KEY'),
    webhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET'),
  },
  // Add your own...
};
```

---

### 4. Supabase Auth Pattern (`lib/supabase/`)

**Files:**
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client with cookie handling

**Features:**
- Type-safe with generated types
- Cookie-based sessions for SSR
- Service role client for admin operations
- Connection pooling support

**Usage:**
```typescript
// Server Component or API Route
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client Component
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

---

### 5. API Error Utilities (`lib/api-utils.ts`)

**What it does:** Consistent error responses + request helpers.

**Features:**
- Standard error format
- Timeout wrapper for fetch
- JSON body parser with validation

**Usage:**
```typescript
import { ApiError, fetchWithTimeout, parseJsonBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ email: string }>(request);
    // ... handler logic
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse();
    return ApiError.internal().toResponse();
  }
}
```

---

## Tier 2: Minimal Config Needed

### 6. Cookie Consent Banner (`components/cookie-consent.tsx`)

**What it does:** GDPR-compliant cookie consent with granular preferences.

**Features:**
- Three categories: essential, analytics, marketing
- localStorage persistence
- Custom event emission for analytics tools
- Settings panel for granular control

**Customize:**
- Update branding colors in component
- Modify copy text
- Add/remove consent categories

**Usage:**
```tsx
// In layout.tsx
import { CookieConsentBanner } from '@/components/cookie-consent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
```

---

### 7. Analytics Provider (`components/analytics-provider.tsx`)

**What it does:** Multi-provider analytics with consent awareness.

**Supported providers:**
- Vercel Analytics (no consent needed)
- Vercel Speed Insights (no consent needed)
- Microsoft Clarity (no consent needed)
- Google Analytics (consent required)
- PostHog (consent required)

**Config via env vars:**
```env
# Optional - only loads if set
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxx
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXX
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

### 8. Email Service (`lib/email.ts`)

**What it does:** Transactional email with templates.

**Included templates:**
- Welcome email
- Email verification
- Password reset
- Payment receipt
- Generic template (extensible)

**Customize:**
1. Update sender email: `from: 'Your App <hello@yourapp.com>'`
2. Update branding in HTML templates
3. Add new template types to `EmailTemplate` union

**Usage:**
```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  type: 'welcome',
  to: user.email,
  data: { name: user.name }
});
```

---

### 9. Stripe Integration (`lib/stripe.ts`)

**What it does:** Payment processing with demo mode support.

**Features:**
- Graceful fallback when keys not set
- Demo mode for development
- Checkout session creation
- Webhook handling
- Credit/unit allocation

**Key files:**
- `lib/stripe.ts` - Client initialization
- `app/api/payment/checkout/route.ts` - Create sessions
- `app/api/webhooks/stripe/route.ts` - Handle events

**Customize:**
1. Update `CREDIT_PACKAGES` in `lib/validations.ts`
2. Modify webhook handler for your business logic
3. Update success/cancel URLs

---

## Tier 3: Database Patterns

### 10. Atomic Credit Operations (`supabase/migrations/20250124_atomic_credit_operations.sql`)

**What it does:** Race-condition-free credit/balance operations.

**Functions:**
```sql
add_credits(user_id, amount)      -- Add credits with row lock
deduct_credits(user_id, amount)   -- Deduct with balance check
refund_credits(user_id, amount, reason)
```

**Why it matters:** Prevents double-spending and race conditions in concurrent environments.

**Usage:**
```typescript
const { data, error } = await supabase.rpc('deduct_credits', {
  p_user_id: userId,
  p_credits: 1
});
if (data !== 'success') {
  // Handle insufficient balance
}
```

---

### 11. RLS Policy Patterns

**Standard patterns from this codebase:**

```sql
-- Users can only see their own data
CREATE POLICY "Users view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all" ON table_name
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Public read access
CREATE POLICY "Public read" ON table_name
  FOR SELECT USING (true);
```

---

## Tier 4: UI Component Library

### Core Components (from `components/ui/`)

| Component | Description |
|-----------|-------------|
| `button.tsx` | CVA-based button with variants |
| `card.tsx` | Content container |
| `badge.tsx` | Status indicators |
| `avatar.tsx` | User avatars |
| `loading-state.tsx` | Loading skeletons |
| `empty-state.tsx` | Empty data states |
| `error-state.tsx` | Error displays |
| `animations.tsx` | Framer Motion presets |

### Feature Components

| Component | Description |
|-----------|-------------|
| `ErrorBoundary.tsx` | React error boundary |
| `InfiniteScroll.tsx` | Pagination helper |
| `NotificationCenter.tsx` | Toast notifications |
| `SearchBar.tsx` | Search interface |

---

## Security Headers (`next.config.ts`)

Copy this security configuration:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.clarity.ms",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://*.supabase.co",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
            "frame-src https://js.stripe.com",
          ].join('; '),
        },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

---

## Recommended Starter Kit Structure

```
your-saas-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── dashboard/page.tsx
│   ├── account/page.tsx
│   ├── admin/page.tsx
│   └── api/
│       ├── health/route.ts
│       ├── auth/
│       ├── billing/
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                     # Design system
│   ├── analytics-provider.tsx
│   ├── cookie-consent.tsx
│   ├── ErrorBoundary.tsx
│   └── Navigation.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── api-utils.ts
│   ├── email.ts
│   ├── env.ts
│   ├── logger.ts
│   ├── rate-limiter.ts
│   ├── stripe.ts
│   └── validations.ts
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql
│       └── 002_atomic_credits.sql
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Dependencies for Starter Kit

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "stripe": "^14.x",
    "resend": "^2.x",
    "zod": "^3.x",
    "zustand": "^4.x",
    "@vercel/analytics": "^1.x",
    "@vercel/speed-insights": "^1.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "class-variance-authority": "^0.x",
    "tailwindcss": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@logtail/node": "^0.x"
  }
}
```

---

## Extraction Checklist

When starting a new project, copy in this order:

1. [ ] `lib/env.ts` → Customize environment variables
2. [ ] `lib/supabase/` → Update Database type import
3. [ ] `lib/logger.ts` → No changes needed
4. [ ] `lib/rate-limiter.ts` → No changes needed
5. [ ] `lib/api-utils.ts` → No changes needed
6. [ ] `lib/email.ts` → Update templates and sender
7. [ ] `lib/stripe.ts` → Update product configuration
8. [ ] `components/cookie-consent.tsx` → Update branding
9. [ ] `components/analytics-provider.tsx` → No changes needed
10. [ ] `components/ErrorBoundary.tsx` → No changes needed
11. [ ] `supabase/migrations/` → Copy relevant migrations
12. [ ] `next.config.ts` → Copy security headers
13. [ ] `components/ui/` → Copy entire design system

---

## What NOT to Copy (Domain-Specific)

These are specific to Verdict and should be reimplemented:

- Judge/seeker business logic
- Verdict request handling
- Quality scoring algorithms
- Demographic matching
- Category-specific validations
- Domain-specific API routes

---

## Future Improvements

Consider adding to the starter kit:

1. **CLI tool** - `npx create-saas-app` to scaffold projects
2. **AI moderation** - OpenAI/Anthropic content moderation
3. **Feature flags** - LaunchDarkly or custom implementation
4. **A/B testing** - PostHog or custom
5. **Background jobs** - Inngest or Trigger.dev integration
6. **File uploads** - S3/R2 integration pattern
7. **Search** - Algolia or Meilisearch pattern
8. **Caching** - Redis/Upstash patterns
