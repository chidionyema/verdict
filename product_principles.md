# Verdict: Product Principles

## What Verdict Is

Verdict is a private decision coach. Users bring real dilemmas - what to wear, whether to take the job, how to handle a difficult conversation - and get honest, anonymous feedback from real humans.

The core promise: **You get clarity on hard decisions without judgment following you.**

---

## The Public Layer

Verdict also maintains a public library of dilemmas.

This is not a social feed of users. It's a collection of **questions people wrestle with** and the verdicts they received. The unit of content is the dilemma, never the person.

Think of it as:
- Reddit's anonymity model (the question matters, not who asked)
- PostSecret's constraint (the truth is the content, identity is protected)
- A decision archive others can learn from

---

## The Governing Rule

**We publish dilemmas, not people.**

This principle decides everything:

| Question | Answer |
|----------|--------|
| Can we show the user's name? | No. Ever. |
| Can we show their face? | Only cropped/blurred, only with explicit consent. |
| Can we show their question? | Yes, if they opt in, framed as "Someone asked..." |
| Can we show the verdicts? | Yes, anonymised. |
| Can judges be identified? | Only if they explicitly choose creator/expert mode. |

Default state: **Private. Always.**

Public participation is opt-in, anonymised, and framed as contribution ("help others facing this") not exposure ("share your story").

---

## The Trust Narrative

What we tell users:

> "Your verdicts are private by default. If you choose to share, we only share the dilemma and the anonymised feedback - never your identity. You're contributing a question to help others, not putting yourself on display."

What we never do:
- Expose identity without explicit consent
- Use dark patterns to push public sharing
- Make private the "lesser" option

---

## First Experiment

**Goal:** Validate that "dilemmas not people" framing increases opt-in and maintains trust.

**Scope:**
- Text-only dilemmas (no photos in v1)
- Post-verdict opt-in prompt
- Copy: "Can we share this question and the verdicts (anonymised) to help others facing similar decisions?"
- Options: Private (default) / Share anonymously

**Metrics:**
- Opt-in rate (target: >25%)
- User sentiment (qualitative feedback)
- Any trust concerns raised

**If successful, layer in:**
1. Cropped/face-hidden photos
2. Small public feed (not homepage)
3. "This Week in Verdicts" editorial content

---

## Decision Filter

For every feature, ask:

1. Does this expose dilemmas or people?
2. Does this make sharing feel like contribution or exposure?
3. Is private still the respected default?
4. Would a user feel safe bringing their real problem here?

If any answer is wrong, redesign.

---

## What This Unlocks

- **Content engine** without privacy risk
- **SEO/social distribution** without individual exposure
- **Trust moat** - "the place where your question is safe"
- **Judge profiles** can exist separately (experts/characters) without conflicting with requester anonymity

---

## One-Line Summary

> Verdict is a private decision coach with a public library of dilemmas, where users choose what graduates into the library - and only the question ever does.