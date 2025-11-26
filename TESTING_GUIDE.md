### Testing Guide

This project has three main layers of automated tests:

- **Unit / domain tests (Vitest)** – fast checks around core business rules.
- **Simulation tests (DB-backed integration)** – multi-user, money, and lifecycle invariants against a real Supabase DB.
- **End-to-end UI tests (Playwright)** – high-level seeker → judge → seeker journeys through the browser.

---

### 1. Prerequisites

- **Node** and dependencies installed:

```bash
npm install
```

- A working **Supabase project** and the app already running in development (the same setup you use for normal dev).
- A populated **`.env.local`** with at least:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

For best isolation, point these at a **test database** (not production).

---

### 2. Unit / domain tests (Vitest)

These tests focus on core logic in `lib/verdicts.ts` (credits, request lifecycle, judge restrictions, etc.).

- **Run once:**

```bash
npm run test:unit
```

- **Watch mode during development:**

```bash
npm run test:unit:watch
```

Vitest config lives in `vitest.config.ts`, tests live under `tests/**/*.test.ts`.

---

### 3. Simulation tests (integration, DB-backed)

These reuse the same domain logic and Supabase instance as the app, but drive it through **simulation scripts**.  
They are high-value checks for:

- Multi-user verdict flow
- Atomic closing (`increment_verdict_count_and_close`)
- Credits deduction / refund (`deduct_credits`, `refund_credits`)
- Duplicate / closed-request protection

Commands:

```bash
# Full flow (seeker + 3 judges, request closes correctly)
npm run test:sim:full

# Edge cases (partial fill, duplicate responses, closed request)
npm run test:sim:edges

# Both (recommended baseline integration suite)
npm run test:sim
```

These scripts use `.env.local` via `env-cmd` and expect a reachable Supabase project.

---

### 4. End-to-end browser tests (Playwright)

Playwright tests simulate a real user in the browser, hitting a running Next.js app.

#### 4.1. Start the app

In one terminal:

```bash
npm run dev
```

This should start the app on `http://localhost:3000` (or your usual dev port).

#### 4.2. Run E2E tests

In another terminal:

```bash
npm run test:e2e
```

By default, Playwright is configured in `playwright.config.ts` to:

- Look for specs under `tests/e2e/`
- Use `http://localhost:3000` as the base URL (override with `PLAYWRIGHT_BASE_URL` if needed)

The initial spec `tests/e2e/seeker-judge-flow.spec.ts` covers:

- Seeker visiting `/start`
- Submitting a text-based decision request
- Being redirected to `/success` and seeing verdict progress UI

You can expand this folder with additional flows as needed.

---

### 5. Running the full test suite

To run unit tests plus the simulation tests in one command:

```bash
npm test
```

This is a good default for CI:

- **Vitest** – fast domain checks.
- **Sim scripts** – deep integration checks for money and lifecycle correctness.

You can optionally add `npm run test:e2e` in CI once you have a stable way to:

- Boot the Next.js server
- Point Playwright at the correct base URL
- Use a disposable test database

---

### 6. Suggested CI wiring (high level)

In your CI pipeline:

1. Install dependencies:

```bash
npm ci
```

2. Apply Supabase schema for a test database (using your existing SQL scripts).
3. Export `.env.local`-equivalent values for the test environment.
4. Run:

```bash
npm test
```

5. (Optional) Start the app and run E2E:

```bash
npm run dev &
npm run test:e2e
```

This keeps your CI focused on the most critical invariants while still allowing full browser coverage when you’re ready.


