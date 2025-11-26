## Launch Readiness Checklist

This file tracks the minimum work required to move from **invite‑only beta** to a **public launch** for Verdict.

### P0 – Must‑have before public launch

- **Lock product offering**
  - Decide whether v1 ships as:
    - **Basic only**: 1 credit → 3 expert verdicts; remove tiered language from UI, keep `VERDICT_TIERS` only for future use, or
    - **Basic + Standard + Premium**: expose tier picker in the request flow and ensure all backend calls derive `creditsToCharge` and `targetVerdictCount` from the selected tier.
  - Make pricing super explicit on:
    - Landing pages
    - `/start` / onboarding flow
    - Account / credits page

- **Access & privacy hardening**
  - Tighten `/api/requests/[id]` and related routes so:
    - Seekers can only see **their own** requests.
    - Judges can only see full details for:
      - Requests they are currently judging (in their queue), or
      - Requests they have already judged.
    - Admins retain broader access where needed.
  - Confirm RLS policies and service‑client usages are consistent with this model.

- **Core automated tests in CI**
  - Add a CI job that runs on every main‑branch commit:
    - `npm run sim:full` (full multi‑user flow).
    - `npm run sim:edges` (partial fill, duplicate response, closed request rejection).
  - Add a lightweight E2E “happy path” test (Playwright or Cypress):
    - Seeker logs in → creates request → success/waiting page.
    - Judge logs in → claims and submits 3 verdicts.
    - Seeker refreshes `/requests/{id}` and sees results.

- **Operational guardrails**
  - Provide a minimal admin surface (page or protected scripts) that allows operators to:
    - Find requests stuck in `in_progress` where `received_verdict_count >= target_verdict_count`.
    - Manually update request status (e.g. force `completed` or `cancelled` with audit note).
    - Inspect a judge’s earnings history and adjust with a clear audit trail (e.g. separate “adjustments” table).

- **Judge payout correctness**
  - Verify, with real data in staging:
    - For each `verdict_responses.id`, there is **exactly one** `judge_earnings` row with the expected amount.
    - No negative earnings exist (CHECK constraint is active).
  - Add a simple reconciliation script or job that:
    - Scans recent `verdict_responses` and asserts matching `judge_earnings` records.
    - Logs discrepancies for manual review.

### P1 – Strongly recommended for launch window

- **Tier selection UX (if tiers ship)**
  - Implement a clear tier selector in the request flow:
    - Show “Basic / Standard / Premium” with verdict counts, delivery expectations, and price per credit.
  - Reflect the chosen tier in:
    - Waiting page messaging (“3 verdicts on the way” vs “5” / “7”).
    - Results page copy and any emails/notifications.

- **Partial results UX**
  - Confirm the seeker experience when verdicts are partially filled:
    - Success page: clearly indicates “You already have X of Y verdicts” and offers a primary action to view them.
    - Request detail page: clearly communicates that more verdicts are coming, and updates in real time as they arrive.

- **Judge onboarding & expectations**
  - Add a simple “Become a Judge” flow / page that explains:
    - Requirements, payout rates, and expectations for quality.
    - How and when payouts happen.
  - Ensure new judges can reliably:
    - See the queue.
    - Respond.
    - View their earnings on the dashboard and in the earnings table.

- **Notifications robustness**
  - Confirm `create_notification` is reliably called on:
    - New verdict.
    - All verdicts completed.
  - Add logging/monitoring for notification failures and a way to resend or compensate (even if manual).

### P2 – Nice‑to‑have but not launch blockers

- **Admin / support tools**
  - Simple internal views for support to:
    - Look up a user by email and see their requests, verdicts, and earnings.
    - Manually grant/revoke credits with an audit note.

- **Observability**
  - Hook the app into an error‑tracking service (Sentry, etc.) and:
    - Capture unhandled route errors and key client‑side exceptions.
    - Set up basic alerts on spikes in 5xx responses.

- **Performance & scaling checks**
  - Run a low‑volume load test against:
    - Judge SSE queue.
    - Seeker request/response APIs.
  - Verify Supabase and Next.js can handle the expected initial launch traffic envelope.

---

Once all **P0** items are checked off and most **P1** items are in a good state, we can confidently move from **invite‑only beta** to a **public launch** with clear understanding of remaining risks. 


