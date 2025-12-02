High-level direction (from product_principles.md)
You’ve made a strong identity call:
Core: “Verdict is a private decision coach.”
Public layer: “We publish dilemmas, not people.”
Rule: Private by default; public participation is opt‑in, anonymised, framed as contribution.
The implementation plan should hard‑bake those principles into data model, flows, and UI so there’s no way to “accidentally” drift into a people‑feed.
Phase 1 – Data & Consent Foundation (1–2 weeks)
1. Database changes (RLS‑safe, principle‑aligned)
Add fields to verdict_requests:
is_public boolean default false
public_consent_at timestamptz null
anonymization_level text check (anonymization_level in ('none','full','text_only')) default 'full'
public_summary text null (optional, short “skim” summary judges can see / we can show publicly)
Optional: public_slug text unique for nice URLs (/dilemmas/should-i-take-this-job-1234), generated server‑side once public.
World‑class UX angle: model dilemmas as first‑class objects now (even if they map 1:1 to requests), so later the public library reads cleanly: PublicDilemma = { category, media, question, verdicts, anonymization_level }.
2. Consent states & transitions
Define explicit states:
PRIVATE (default)
OPT_IN_TEXT_ONLY (maps to is_public = true, anonymization_level = 'text_only')
Later: OPT_IN_FULL / OPT_IN_PARTIAL when you add images.
State machine rule:
Only transitions towards more public happen via an explicit user action.
Transitions back to private always allowed (soft delete from public library, preserve audit trail).
Phase 2 – Post‑Verdict Consent UX (1–2 weeks)
3. Post‑verdict consent modal (core UX surface)
Trigger after a user views their verdict:
Entry point: On /results/[id] (or equivalent), once verdicts are loaded:
Light, non‑blocking banner: “Help others facing a similar decision?”
Primary CTA opens ConsentModal.
ConsentModal content:
Title: “Share this dilemma to help others?”
Body copy (aligned with file):
> “Your verdicts are private by default. If you choose to share, we only share the dilemma and anonymised feedback—never your identity. You’re contributing a question to help others, not putting yourself on display.”
Options (radio buttons, no pre‑selection):
○ Keep private (default)
○ Share this question and the anonymised verdicts (text only v1; mention that no photos or names are shown)
Preview card below showing exactly what will be public:
Category, question/context excerpt, 2–3 verdict snippets, all under “Someone asked…” framing.
Buttons:
Primary: Save choice
Secondary: Cancel
World‑class UX touches:
Make “Keep private” feel just as “legit” as sharing (no shaming/dimmed styles).
One short line under the options:
“You can change this later from your results page.”
4. API & server logic
POST /api/dilemmas/share (auth required):
Input: request_id, choice (private | text_only_public).
Checks:
User owns the request.
Request has completed verdicts.
Side effects:
If private → is_public = false, public_consent_at = null.
If text_only_public → is_public = true, anonymization_level = 'text_only', public_consent_at = now().
Phase 3 – Minimal Public Library (Text‑Only v1) (2–3 weeks)
5. Public dilemmas API
GET /api/dilemmas/public?cursor=...
No auth.
Returns only:
id/public_slug, category, text‑only question/context (sanitised), up to N anonymised verdict snippets (judge ids stripped), aggregate stats (e.g., 2–1 YES).
Query:
FROM verdict_requests WHERE is_public = true AND anonymization_level = 'text_only' AND status = 'closed' ORDER BY public_consent_at DESC LIMIT ...
6. Public library UI (world‑class browsing)
Route: /dilemmas (not yet homepage):
Layout:
Left: filters (category, tag, “Most split”, “Most recent”).
Main: grid or single‑column list of <VerdictCard />.
<VerdictCard /> v1:
Small label row: 💼 Career · Job Offer / ❤️ Dating · Profile
Question: “Someone asked: ‘Should I take a 20% pay cut for a startup?’”
Optional “Context” excerpt (1–2 lines).
Verdict snippets:
Up to 3 mini blocks: “Judge: ‘I’d take it—trajectory > salary.’”
Simple tally line at bottom: VERDICT: 2–1 YES.
Micro‑CTA: “What would you say?” (future interactive layer).
Copy discipline:
Always “Someone asked…”
Never “You asked…” or “Sarah asked…”
No ages, locations, handles in v1.
Phase 4 – Internal Safeguards & Review (1–2 weeks)
7. Content review tools (lightweight but essential)
Admin‑only list of is_public = true dilemmas:
Ability to mark “unpublish” (sets is_public = false).
Flags for “potentially sensitive” categories (e.g., health, legal, trauma).
World‑class trust requirement: an obvious kill switch if something slips through.
8. Text anonymisation pass
Before publishing a text‑only dilemma:
Run server‑side sanitation:
Simple PII scrubber for names, emails, phones, exact locations (heuristics + regex).
E.g., replace “at Google in Mountain View” with “at a big tech company”.
If a text fails basic anonymisation (too specific), either:
Block it from public library (still private to the user), or
Queue it for manual review.
Phase 5 – Validation & Iteration (2–4 weeks)
9. Instrumentation & metrics
Track:
Opt‑in funnel:
Views of verdict → opens of ConsentModal → choices:
Private
Public text‑only