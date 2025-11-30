# UX Coherence Audit: AskVerdict Economy Model
**Date:** January 2025  
**Status:** Critical gaps identified - Requires unified redesign

---

## 🚨 The Core Problem

We've built brilliant individual features but created **three disconnected apps** instead of **one unified economy**:

1. **Transaction Service** (hidden pricing, utility-based)
2. **Community Platform** (public feed, judging)
3. **Premium Product** (private submissions, expert judges)

**Result:** Users don't understand they're in an economy, not just a service.

---

## 🎯 The Vision: The Verdict Economy

### The Three Products in One

```
┌─────────────────────────────────────────────────────┐
│           THE VERDICT ECONOMY                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│   FREE TIER (Community Mode)                        │
│   ┌──────────────────────────────────────────────┐  │
│   │  Judge 5 → Earn 1 credit                     │  │
│   │  Post to public feed → Get unlimited verdicts│  │
│   │  Scroll/judge for entertainment               │  │
│   └──────────────────────────────────────────────┘  │
│              │                                       │
│              ▼                                       │
│   PAID TIER (Private Mode)                          │
│   ┌──────────────────────────────────────────────┐  │
│   │  Skip judging → Pay cash                     │  │
│   │  Keep private → Pay premium                  │  │
│   │  Verified expert judges → Pay more           │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔴 CRITICAL UX GAPS

### 1. **Navigation Chaos**

**Current State:**
- "Categories" dropdown (misaligned)
- "Discover", "🔥 Roast Me", "New Request", "Review"
- Hidden /feed page
- Confusing hierarchy

**Required State:**
```
[AskVerdict] [Discover] [Submit] [Judge Queue] [Credits: 5] [Account]
```

**Fix:**
- Remove Categories dropdown (move to footer)
- Three clear products: Discover → Submit → Judge
- Credits always visible and prominent
- Consistent alignment and spacing

---

### 2. **Submission Flow Fragmentation**

**Current State:**
- `/start-simple` → Generic flow
- `/start?mode=roast` → Separate roast mode
- No clear public/private choice upfront
- Hidden economy mechanics

**Required State:**
```
/submit
├── Choose: Public (Free) vs Private (£3)
├── Public → Check credits → Earn if needed → Submit
└── Private → Pay → Submit
```

**Fix:**
- Single unified `/submit` page
- Public/Private choice **before** content submission
- Clear credit requirements
- Seamless payment integration

---

### 3. **Economy Model Invisibility**

**Current State:**
- Credits shown but not explained
- No "Judge 5 = Earn 1" messaging
- Economy feels hidden, not celebrated
- Users don't understand the loop

**Required State:**
- Landing page explains economy clearly
- "Judge 5 → Earn 1 → Submit" visible everywhere
- Progress tracking for credit earning
- Clear upgrade path to premium

**Fix:**
- Hero section: "Judge others. Get judged. See how you compare."
- Prominent economy explanation
- Credit earning progress bars
- Upgrade prompts throughout free flow

---

### 4. **Public vs Private Confusion**

**Current State:**
- Public/private choice buried in submission form
- No clear value props for each
- Users don't understand the trade-off
- Viral potential of public mode hidden

**Required State:**
- Choice presented upfront at `/submit`
- Clear benefits for each mode
- Public = Free + Viral + Shareable
- Private = £3 + Fast + Confidential

**Fix:**
- Redesign `/submit` as choice page
- Two equal cards showing benefits
- Smart routing based on selection
- Clear pricing transparency

---

### 5. **Feed/Discover Fragmentation**

**Current State:**
- `/feed` exists but not prominent
- `/discover` is separate page
- No clear "this is where you judge to earn"
- Judging UI not integrated with credit earning

**Required State:**
- Single `/discover` or `/feed` (choose one)
- Clear "Judge to Earn" messaging
- Credit progress visible while judging
- Reward feedback for completing 5 judgments

**Fix:**
- Unify feed/discover into one experience
- Add credit earning UI to feed
- Show progress: "2/5 judgments → 0.4 credits"
- Celebration when credit earned

---

### 6. **Roast Mode Disconnection**

**Current State:**
- "🔥 Roast Me" as separate nav item
- Hidden in URL parameters
- Not integrated with public/private choice
- Viral sharing not built-in

**Required State:**
- Roast mode = option in submission flow
- Choose: "Help Me" vs "Roast Me" for public
- Automatic shareable content generation
- Built into results page

**Fix:**
- Remove "🔥 Roast Me" from nav
- Add tone selection: "Help Me" / "Roast Me" / "Be Brutal"
- Generate share cards automatically
- "Share Your Roast" button in results

---

## 📐 THE UNIFIED USER JOURNEY

### New User Flow

```
1. Landing Page
   └── "Judge others. Get judged. See how you compare."
   └── Three cards: Discover | Submit | Judge Queue

2. Click "Submit"
   └── Choose: Public (Free) vs Private (£3)
   └── If Public + No Credits → Redirect to /earn-credits
   └── If Public + Has Credits → Continue to submission

3. Earn Credits Flow
   └── "Judge 5 submissions to earn 1 credit"
   └── Redirect to /discover with progress tracking
   └── Show: "2/5 judgments → 0.4 credits earned"

4. Submit Content
   └── Choose category
   └── Choose tone: Help Me / Roast Me
   └── Upload content
   └── Submit

5. Get Results
   └── Show feedback
   └── Show benchmarks: "You scored better than 68%"
   └── Share option for roast content
```

---

## 🎨 REDESIGN PRIORITIES

### Priority 1: Navigation Clarity (1-2 hours)

**Remove:**
- Categories dropdown from nav (move to footer)
- "🔥 Roast Me" from nav
- Confusing secondary nav items

**Add:**
- Clear three products: Discover | Submit | Judge Queue
- Prominent credit display
- Consistent alignment

---

### Priority 2: Submission Flow Unification (2-3 hours)

**Create:**
- `/submit` as choice page (Public vs Private)
- Smart routing to credit earning
- Integrated payment for private
- Tone selection in flow (not separate)

**Remove:**
- Separate roast mode URL
- Hidden public/private options
- Fragmented flows

---

### Priority 3: Economy Visibility (2-3 hours)

**Add:**
- Landing page economy explanation
- Credit earning progress everywhere
- "Judge 5 = Earn 1" messaging
- Upgrade prompts throughout

**Fix:**
- Credit display prominence
- Progress tracking
- Reward celebrations

---

### Priority 4: Feed Unification (1-2 hours)

**Decide:**
- Use `/discover` OR `/feed` (not both)
- Integrate credit earning UI
- Show progress while judging
- Clear "Judge to Earn" messaging

---

## ✅ COHERENCE CHECKLIST

- [ ] Navigation shows 3 clear products
- [ ] Credits always visible and prominent
- [ ] Public/Private choice is upfront
- [ ] Economy model explained on landing
- [ ] Credit earning progress is visible
- [ ] Roast mode is integrated, not separate
- [ ] Feed/Discover unified into one
- [ ] Payment integrated seamlessly
- [ ] Upgrade prompts are contextual
- [ ] Viral sharing built into flow

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Navigation & Flow (Today)
1. Fix navigation alignment
2. Remove Categories dropdown from nav
3. Create unified `/submit` page
4. Add `/earn-credits` redirect page

### Phase 2: Economy Visibility (Today)
1. Update landing page hero
2. Add credit progress tracking
3. Prominent credit display
4. Economy explanation section

### Phase 3: Feed Integration (Tomorrow)
1. Unify feed/discover
2. Add credit earning UI
3. Progress tracking
4. Celebration animations

---

## 💡 KEY INSIGHTS

**What we're building:**
- Not a service → An economy
- Not utility → Habit-forming platform
- Not paid-first → Freemium with clear upgrade

**User psychology:**
- Judge 5 creates investment
- Public feed creates addiction
- Benchmarking creates FOMO
- Roast content creates virality

**Revenue model:**
- Free users create content
- Free users judge others
- Paying users skip the loop
- Experts earn real money

---

**This audit identifies the gaps. The fix is clear: unify the experience around the economy model.**

