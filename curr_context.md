# curr_context — Hitchr Ideation + Progress Journal (Living Doc)

**Purpose**: Keep Hitchr aligned. This file captures the **current ideation**, the **decisions we’ve made**, and a **journal of learnings** so we don’t drift from the vision while building (especially with Emergent AI).

**How to use**:
- Treat this as the **source of context** to paste into AI tools before asking them to build.
- Update it after every meaningful change (product decision, prototype flow update, user feedback, growth insight).
- Keep entries short, dated, and opinionated (decisions + why).

---

## 1) North Star (Vision)

Hitchr is **community mobility infrastructure for India**.

It should feel like:
- **A chai shop conversation, not a corporate pitch**
- **A street mural, not a boardroom deck**
- **A friend’s travel vlog, not a travel agency ad**

Core belief:
- **Everyone is both Rider and Pilot**. We’re not building a “drivers vs riders” marketplace. We’re building a **coordination layer** for people already moving.

What Hitchr is NOT:
- Not a taxi/ride-hailing clone (“order driver to pick you up”)
- Not surge pricing / profit-maximization
- Not a photo-first Instagram clone

---

## 2) The Core Idea (Plain language)

“Find someone already going your way. Join their journey. Travel cheaper, safer, and more human.”

Directional matching:
- Rider wants A → C
- Pilot is already going A → B
- Hitchr matches rider to pilot for A → B
- Rider finishes B → C via another leg or other means

This is why Hitchr can be cheaper than Ola/Uber:
- Pilot was already traveling; you’re sharing cost/effort, not paying a professional driver.

---

## 3) Current Product Thesis (What we’re building first)

### 3.1 Feed-first discovery (movement intelligence)
Users discover “who’s moving where” through a feed:
- “Live Now”
- “Trips Being Planned”
- Communities as hubs of movement culture

Map is important, but Hitchr’s differentiation is **social + contextual movement**, not only spatial hunting.

### 3.2 Trust without harshness
Prefer **positive-only trust signals** (badges, verification, shared communities).
Avoid Uber-style anxiety loops.

### 3.3 Pay after ride (community-first)
The contribution model is intentionally non-transactional:
- **Payment happens AFTER the ride**
- Rider can request pilot to **reduce** or **waive** contribution
- “Pay what feels right” tone (no guilt)
- If payment fails, the journey should not break (“travel assurance mindset” pass), that's for subscription models. 

### 3.4 Journey Composer is a core surface (not optional)
The **Journey Composer** is the center of the product. It answers: “What are you doing today?”

Minimum requirements:
- **Pilot post (Live Now)**: “I’m going A→B soon, seats available”
- **Rider request (Need to go)**: “I need to go A→C; show suggested legs/pilots”
- **Trip planning**: “I’m planning a trip later; who’s in?”
- **Memories (route recaps)**: should exist as seeded content even for first-time users (not photo-first)

This keeps Hitchr route-first (WHERE) instead of becoming a generic social app (WHO).

---

## 4) Current Prototype State (What exists right now)

Primary artifact:
- `hitchr-final-prototype.html` (single-file interactive prototype)

Current flow direction:
- Join Ride (no upfront payment)
- While Riding (demo)
- Complete Ride → Suggested Contribution (adjustable/waivable)
- Fake Gateway (UPI/Card; success/fail simulation)
- Receipt “Paid to Pilot” with correct post-ride wording

Fare logic used in prototype:
- SuggestedContribution = round(sharedDistanceKm × ₹5)
- Shared distance is A → B (pilot’s overlap), not A → C (rider’s full destination)

---

## 4.1) Core screens (App mental model)

Hitchr must be understandable as a 5–6 surface app:

- **Home (Feed-first)**:
  - Live Now (people moving now)
  - Trips Being Planned (future coordination)
  - “Memories” should NOT dominate Home by default (memories are intent-driven via Search/Communities)

- **Journey Composer (Center tab / primary action)**:
  - Create a route-first post (Pilot Live Now / Rider Need-to-Go / Trip Plan / Memory)
  - This is the main way the network becomes “alive”

- **Map/List (Secondary)**:
  - Optional lightweight map
  - Must have a list-first fallback

- **Communities**:
  - Your communities + discover
  - Community pages cluster: Live Now + Trips + Memories

- **Profile**:
  - Trust signals, badges, campus verification
  - History: past rides, contributions, saved routes

- **Riding**:
  - Waiting → Active → Complete
  - Safety actions visible (Share, SOS, Report)

---

## 4.2) First-time user experience (Zero history must still feel alive)

Problem: First-time users have no posts, no friends, no history — the app must still “click” in 3 seconds.

**Rule: Seed content is required** for campus testing and adoption.

On first launch, a new user must see:
- A living feed (not empty)
- A clear primary CTA: “Post your route” (Composer)
- “Join someone already going your way” understanding
- Campus trust visible (Campus Verified)

Minimum onboarding (fast):
1) Choose campus (or via invite code)
2) Optional: pick 3 interests → suggest communities
3) Land on Home with seeded Live Now + Trips
4) Nudge: “Post your first route” (Composer)

Memories behavior:
- Memories should be visible even if user has none:
  - Show memories inside **Search** and **Communities**
  - Memories are route-first (A→B + highlights), not photo-first

## 5) Non‑negotiables (Decision Lock)

1. **Pay after ride** (never before)
2. **pilot can reduce/waive** contribution
3. **Community vibe**: language + design should feel Indian Gen Z street-smart, not imported minimalist
4. **Do not strand users** on payment failure
5. **Dual role mindset** must show up everywhere (today rider, tomorrow pilot)

---

## 6) Strategy: How Hitchr wins (Differentiation)

### 6.1 Cultural differentiation
Most mobility products feel “corporate utilitarian.”
Hitchr should feel "LOCAL" as train, "BOLD" to say yes, and "Alive" in unknown. thats hitch hiking and hitchr true to new modern indians.

### 6.2 Platform differentiation
Not “supply vs demand,” but **networked coordination**:
- People already moving create movement data
- Feed/community structure makes movement discoverable
- Trust signals reduce fear
- Micro-interactions make it feel fun and safe

---

## 7) Monetization philosophy (First principles)

### 7.1 Initial instinct (user love first)
Make users feel:
“Someone just gave me the only platform I need to move freely.”

Build loyalty before monetization pressure.

### 7.2 Long-term monetization paths (aligned with product)
- **Assurance subscriptions** (bailouts / settle-later / discounts)
- **Light platform fee** on contributions where applicable
- **Brand partnerships** (token redemption, mobility/college lifestyle brands)
- **Ads** (only after strong retention + trust; contextual + non-invasive)

### 7.3 Research note (META revenue insight)
META is mostly ads revenue:
- Companies pay to show ads to people likely to buy.
Implication for Hitchr:
- We should not rush ads early.
- First, build a loyal base and high-intent contexts (college mobility, trips, communities).
- Later, offer brands **high-signal audiences** (e.g., commuting students, trip planners, community members) with privacy-respecting targeting.

---

## 8) Go-to-market plan (College-first)

Objective:
- Launch Hitchr in **one college** to validate:
  - Product utility
  - Safety/trust usability
  - Core flows
  - Retention & word of mouth

Why college-first works:
- Dense graph + repeated routes
- Shared identity + easier trust
- Strong referral culture

Expansion:
- If it works in one college, replicate playbook to other colleges.
- Then recruit founding members / operators for rollout.

---

## 9) “Speed-run the app” plan (How to ship fast)

### Phase 0 — Keep prototype as contract (now)
- Prototype defines UX, flows, copy, and interaction rules.
- Keep iterating until it’s unmistakably “Hitchr.”

### Phase 1 — Build a campus MVP that actually runs (fastest path)
Goal: Working app for real users in your college.

**Recommended MVP scope (must-have)**:
- **Campus auth**: college email / invite code + basic profile
- **Rider POV**:
  - See “Live Now” pilots coming your way (directional matching)
  - Join ride request + chat-lite (optional) + safety actions
  - Ride state: waiting → active → complete (manual controls for demo)
  - Post-ride: suggested contribution (reduce/waive/custom) + payment
- **Pilot POV** (must exist in v0, even if behind a toggle):
  - Create “I’m going A→B” post with seats + time window
  - Receive join requests and accept/decline
  - Start ride / complete ride (manual)
  - View contribution status (paid/waived/pending)
- **Trust**: “Campus Verified” + badges (minimal KYC only)
- **Discovery refresh model**:
  - Home feed refresh shows new “Live Now” posts
  - Map can be lightweight; list-first is allowed as long as it *feels live*

**Important clarification**:
- “No mock screens” means: **the flow must behave end-to-end** (create → discover → request → accept → ride → complete → contribution → settlement).
- It’s okay to keep some things simulated under the hood (e.g., payment via UPI deep-link / cash / “settle later”), but the **user journey must be coherent and usable**.

**De-risk list (what we avoid building in full on day 1, but still represent clearly in UI)**:
- **Multi-leg**: show “2‑leg suggested” (A→B + B→C), but execute as sequential single-leg posts (manual handoff)
- **Real-time**: no sockets required initially; use refresh + polling where needed
- **KYC**: minimal campus verification only (no heavy document checks)
- **Maps**: avoid complex map tech; list-first with lightweight route visuals is valid

### Phase 2 — Prove retention and weekly usage
If students use it repeatedly:
- Add assurance tier
- Add token loops
- Add richer communities + planned trips

---

## 9.1) Multi-leg (UI suggested, manual handoff execution)

**Goal**: Users understand multi-leg value *without* building full automation immediately.

**How it appears (Rider)**:
- When rider searches A→C, show:
  - “Suggested plan: 2 legs”
  - Leg 1: A→B (Pilot 1)
  - Leg 2: B→C (Pilot 2)
- Rider joins **Leg 1** first.

**How it executes (Operationally)**:
- Completing Leg 1 triggers:
  - “Continue to next leg” CTA
  - App surfaces pilots currently going B→C
- The rider manually joins Leg 2 (no automatic handoff).

**Why this works for campus MVP**:
- Users immediately “get it” (multi-leg concept)
- Team avoids the hardest automation/edge cases on day one

---

## 9.2) Real-time without sockets (refresh + polling)

**Home / Feed**:
- Pull-to-refresh fetches latest “Live Now” posts.
- A “Last updated: just now” microcopy and subtle animation makes it feel alive.

**Pilot list “coming your way”**:
- Directional matching results can be refreshed manually.
- If we want “feels live,” poll every 10–20s only on the list screen (battery-friendly).

**Ride state**:
- Status can be updated by:
  - manual actions (pilot starts/ends)
  - lightweight polling (every 3–5s only while in ride screen)

---

## 9.3) Pilot POV (screen map)

Pilot mode must be obvious and usable.

**Pilot flow**:
1. Pilot mode toggle (Rider ↔ Pilot)
2. Create route post (A→B, time window, seats, optional note)
3. “Requests” inbox (accept/decline)
4. Ride active (safety buttons + share ride)
5. Ride complete → see contribution status

**Pilot home should answer in 3 seconds**:
- “Who wants to join me?”
- “Where am I going?”
- “How many seats?”


---

## 10) Working with Emergent AI (Process Rules)

We will use Emergent AI to build the real app from prototypes + action plan.

---

## 10.1) Campus MVP v0 — Acceptance Checklist (Definition of Done)

**Rule**: The MVP is “done” only when every item below is true on a clean run from scratch.

### A) Setup & Run (Developer Experience)
- [ ] Repo runs locally with **one clear command per service** (or a single `dev` command).
- [ ] App boots with **seed data** (so demo works without manual DB setup).
- [ ] Errors are readable (no silent failures); basic logging exists.

### B) Onboarding & Trust (Minimal KYC, campus-first)
- [ ] User can sign up/log in using **college email OR invite code** (pick one and implement cleanly).
- [ ] User profile exists (name, college, optional avatar).
- [ ] “Campus Verified” badge is shown wherever identity matters (cards, ride screens).
- [ ] No heavy document KYC required in v0.

### C) Rider POV — Discovery (Feed/List-first is OK)
- [ ] Rider sees a **Home/Feed** with “Live Now” routes posted by pilots.
- [ ] Rider can **pull-to-refresh** to fetch new routes.
- [ ] Feed items clearly show: pilot, A→B route, departure time window, seats available, trust signals.
- [ ] Rider can filter/search by destination (at least basic: “Where are you going?” → matches).
- [ ] “Coming your way” list exists (directional matching), even if simplified.
- [ ] First-time user does NOT see an empty app (seed content exists: Live Now + Trips + Communities + Memories in Search/Communities).

### D) Pilot POV — Create & Manage Routes (Must exist)
- [ ] Pilot mode toggle exists (Rider ↔ Pilot).
- [ ] Pilot can create a route post with:
  - [ ] From (A)
  - [ ] To (B)
  - [ ] Time window (e.g., leaving in 15–30 min)
  - [ ] Seats available
  - [ ] Optional note (e.g., “near library gate”)
- [ ] Pilot can see their active post(s) and status.

### D.1) Journey Composer (Must exist)
- [ ] There is a dedicated **Composer** surface (center tab or primary CTA).
- [ ] Composer supports at minimum:
  - [ ] Pilot Live Now post (A→B, seats, time window)
  - [ ] Rider Need-to-go request (A→C) that triggers “2-leg suggested” UI when needed
- [ ] Composer makes “route-first” obvious (From/To are primary, not images).

### E) Join Request & Seat Confirmation (Two-sided)
- [ ] Rider can request to join a pilot’s route.
- [ ] Pilot receives the request in a “Requests” inbox.
- [ ] Pilot can Accept / Decline.
- [ ] Rider sees the outcome (accepted/declined).
- [ ] Seat count updates correctly after acceptance.

### F) Ride State (Manual controls allowed)
- [ ] Once accepted, ride has states:
  - [ ] Waiting (pre-pickup)
  - [ ] Active (in-ride)
  - [ ] Complete (ride ended)
- [ ] Pilot can Start Ride and Complete Ride manually.
- [ ] Rider sees ride state updates within a reasonable time:
  - [ ] Either via manual refresh OR lightweight polling
  - [ ] Polling is scoped (only while on ride screens)

### G) Post-Ride Contribution (Non-negotiable)
- [ ] Contribution happens **after** ride completion only.
- [ ] Ride Complete screen explains overlap (A→B vs rider’s A→C intent if present).
- [ ] Suggested contribution is calculated from **shared distance (A→B)**:
  - [ ] Suggested = round(sharedDistanceKm × ₹5) (current v0 rule)
- [ ] Rider can:
  - [ ] Pay suggested
  - [ ] Reduce amount
  - [ ] Enter custom amount
  - [ ] Waive (₹0) with guilt-free copy
- [ ] Pilot sees contribution status for that ride: Paid / Waived / Pending.

### H) Multi-leg (UI suggested, manual execution)
- [ ] If rider searches A→C and no single pilot covers it, UI can show:
  - [ ] “Suggested plan: 2 legs” (A→B + B→C)
- [ ] Execution is manual:
  - [ ] Rider completes leg 1, then taps “Continue to next leg”
  - [ ] App surfaces B→C options
  - [ ] Rider requests leg 2 normally
- [ ] No automatic handoff required in v0, but the concept must be understandable.

### I) Real-time Model (No sockets required)
- [ ] Home feed refresh works reliably.
- [ ] Optional: list polling every 10–20s is acceptable on discovery screen.
- [ ] Ride screen polling every 3–5s is acceptable only while ride screen is open.
- [ ] App does not require websockets to function in v0.

### J) Safety (Minimum viable)
- [ ] Ride screens contain visible safety affordances:
  - [ ] Share ride
  - [ ] SOS / Get help (can be stubbed to a phone number / modal)
  - [ ] Report user (simple form / reason list)
- [ ] Basic safety copy exists (“Only meet at campus gates”, etc.).

### K) UX “3-second understanding” test (Must pass)
- [ ] In ≤3 seconds, a new student can answer:
  - [ ] “What is this?” (join people already going your way)
  - [ ] “Is it safe?” (campus verified + safety buttons)
  - [ ] “How do I use it right now?” (Join Ride / Post Route)

### L) Demo Script (Campus pilot ready)
- [ ] There is a simple 60–90s demo path that always works:
  1) Pilot posts A→B
  2) Rider refreshes and sees it
  3) Rider requests to join
  4) Pilot accepts
  5) Pilot starts ride
  6) Pilot completes ride
  7) Rider contributes (or waives)
  8) Pilot sees status

### Golden rules for AI building
1. Always paste:
   - North Star + Non‑negotiables
   - Current prototype flow
   - Acceptance criteria
2. Build in small vertical slices:
   - One flow end-to-end → test → polish → expand
3. No “creative rewrites” of product logic without updating this doc.

### AI prompt seed (paste into tools)
“Build Hitchr according to `curr_context.md` and the prototype UX.  
Do not change non‑negotiables. Implement only MVP scope for campus launch.  
Return: architecture, screens, flows, data model, and acceptance tests.”

---

## 10.2) Emergent AI “1-shot build prompt” (use this to save credits)

Paste this as your FIRST message to Emergent:

```text
Build Hitchr Campus MVP v0.

SOURCE OF TRUTH:
- Use curr_context.md as the product contract and do not violate it.
- The Definition of Done is section “10.1 Campus MVP v0 — Acceptance Checklist”. You must satisfy it fully and stop.

CORE SCREENS (must exist):
- Home (feed-first): Live Now + Trips Being Planned
- Journey Composer (primary action): Pilot Live Now + Rider Need-to-go
- Communities (minimal): list + seeded community pages
- Profile (minimal): Campus Verified badge + basic info
- Riding: Waiting → Active → Complete + safety actions

FIRST-TIME EXPERIENCE:
- App must not be empty for a new user.
- Seed content required: Live Now posts, Trips planned, Communities, and Memories (memories are visible in Search/Communities even if user has none).

MULTI-LEG:
- UI must show “Suggested plan: 2 legs” for A→C when needed.
- Execution must be sequential single-leg (manual handoff).

REAL-TIME:
- No sockets required. Use pull-to-refresh and lightweight polling only on list/ride screens.

CONTRIBUTION:
- Pay AFTER ride only.
- Suggested contribution based on shared distance A→B at ₹5/km; rider can reduce/waive/custom.
- Pilot must see contribution status (Paid/Waived/Pending).

DELIVERABLE:
- A working app (frontend + backend) that runs locally, with seed data, and a short runbook.
- Keep the solution simple and shippable for a single-college pilot.
```

---

## 11) Journal Entries (Ideation + Progress Log)

### 2026-01-27 — Payment flow correction (post-ride, community-first)
- **Decision**: Payment happens **after** ride completion.
- **Why**: Hitchr is community-first; upfront payment feels like ride-hailing. Also aligns with “travel assurance mindset.”
- **Implementation (prototype)**: Ride Complete → suggested contribution (based on shared distance) → reduce/waive/custom → fake gateway → receipt.

### 2026-01-27 — Fare suggestion based on pilot overlap (A→B), not full destination (A→C)
- **Decision**: Suggested contribution should depend on where pilot takes their own turn.
- **Why**: Fairness + trust. Rider shouldn’t pay for distance pilot didn’t share.
- **Prototype rule**: round(sharedDistanceKm × ₹5)

### 2026-01-27 — Copy audit: remove “seat confirmation” language from post-ride receipt
- **Decision**: Receipt language must reflect post-ride settlement.
- **Why**: Avoid narrative mismatch (“confirm your seat” after ride is complete).

### 2026-01-27 — Monetization thinking: META ads insight
- **Observation**: META monetizes largely via ads because companies pay for high-intent targeting.
- **Hitchr implication**: Build loyalty and high-signal contexts first; introduce ads/subscriptions later without harming trust.

---

## 12) Open Questions (Track here to avoid confusion)

- What is the exact campus onboarding/verification method for v0? (college email vs invite code vs ID check later)
- What is the “pilot drop-off at B” experience in real life? (handoff guidance, safety checks)
- What are the first 3 badges that build trust instantly on college campus?
- What minimal safety protocol must exist for college MVP (SOS, share trip, report, community moderation)?

