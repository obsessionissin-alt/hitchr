# Hitchr - Wireframe & UX Specification
## Social-First Movement Coordination Platform

---

## Document Purpose
This specification defines the complete screen structure, interaction patterns, and UX rationale for Hitchr v1.0 - a live, intent-based social coordination platform built around real-world movement.

**Core Philosophy:** Movement is the medium, not the product. Community, identity, and coordination are the core value.

---

## Design Principles

### 1. Social-First, Not Transactional
- **Faces over icons over buttons**
- Human-centric design language
- Soft, approachable aesthetics
- Minimal aggressive CTAs
- Emphasis on presence and connection

### 2. Ambient Awareness
- Always showing live context
- Non-intrusive notifications
- Persistent presence indicators
- Quiet background operation

### 3. Dual Persona Support
The UI must serve both:
- **Explorers** (students): Discovery-oriented, social, flexible
- **Reliables** (professionals): Predictability-focused, time-sensitive, trust-heavy

**One system, adaptable presentation.**

### 4. Map-Centric Experience
- Map is the primary canvas
- All interactions overlay or complement the map
- Never replace map with lists/grids as primary view
- Spatial context is constant

### 5. Community as Currency
- Badges and reputation are trust signals
- Identity markers visible throughout
- Journey history builds social capital
- No follower counts or vanity metrics

---

## Screen Architecture

### Navigation Structure
```
┌─────────────────────────────────────┐
│         Default Map Screen          │ ← Home/Primary Screen
│     (Live Presence + Intent)        │
└─────────────────────────────────────┘
           ↓ User Actions
    ┌──────┴───────┬──────────┐
    ↓              ↓          ↓
┌────────┐   ┌─────────┐   ┌─────────┐
│Profile │   │Discovery│   │Movement │
│Screen  │   │  State  │   │  State  │
└────────┘   └─────────┘   └─────────┘
                   ↓
            ┌──────────────┐
            │ Coordination │
            │     Flow     │
            └──────────────┘
                   ↓
            ┌──────────────┐
            │ Post-Journey │
            │    Memory    │
            └──────────────┘
```

---

## Screen 1: Default Map / Presence Screen

### Purpose
The "always-on" view of the world. Hitchr's living map showing real people in real time, creating ambient social awareness before any intent is declared.

### UX Rationale
- **For Explorers:** Feels alive, encourages spontaneous discovery
- **For Reliables:** Shows familiar routes/faces, builds trust over time
- Creates habitual checking behavior ("Let me see who's around")
- No pressure to act - pure information state

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ ☰  HITCHR               👤 [Avatar]  🔔 [23]       │ ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│           🏠                              🔍        │
│                                                     │
│                                                     │
│                                                     │
│              [Live Map Canvas]                      │
│                                                     │
│         👤              👤                          │
│       (Alice)         (Bob)                         │
│     [Early Hitchr]  [City Connector]               │
│                                                     │
│                 👤                                  │
│               (Chris)                               │
│             [Trusted Traveler]                      │
│                                                     │
│         📍 YOU                                      │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │ 🎯 Where are you heading?                   │  │ ← Bottom Sheet (Collapsed)
│  │         [Tap to declare intent]              │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Header Bar
- **Left:** Menu icon (☰) → Profile, Settings, History
- **Center:** "HITCHR" wordmark (subtle, not dominant)
- **Right:** 
  - User avatar (tap to view own profile)
  - Notification bell with count badge

#### B. Map Canvas
- **Base Layer:** Subtle, minimal map (not dominant colors)
- **User Avatars:** 
  - Circular profile photos (not pins)
  - White border with subtle shadow
  - Badge indicator visible (small icon overlay)
  - Size variation based on proximity/relevance
- **Your Location:** Distinct indicator (pulsing dot + ring)
- **Map Controls:**
  - Home button (top-left, recenter on user)
  - Zoom controls (subtle, right side)
  - Optional: Compass

#### C. Community Badge Indicators
Visible on each avatar as small overlays:
- 🌟 Early Hitchr
- 🔗 City Connector  
- ✓ Trusted Traveler
- 🎒 Community Builder
- 🎉 Event Hopper

#### D. Bottom Sheet - Collapsed State
- Gentle upward swipe handle
- Prompt: "Where are you heading?"
- Soft gradient background (translucent)
- CTA: Tap to expand

### Interaction Patterns

1. **Default State:** Map shows all nearby users (within ~5km radius)
2. **Tap Avatar:** Quick preview card
   - Name
   - Primary badge
   - Last seen / current status
   - "Say hi" / "View profile" buttons
3. **Swipe Up Bottom Sheet:** Expands to Intent Declaration
4. **Tap Search Icon:** Quick destination search
5. **Long Press Map:** Explore area (future: see historical activity)

### Design Specifications

**Color Palette:**
- Background: #FFFFFF (white/light mode) or #1A1A1A (dark mode)
- Map: Muted grays (#F5F5F5 base)
- Accent: Warm coral/salmon (#FF6B6B) for active elements
- Secondary: Soft blue (#4A90E2) for trust indicators
- Text: Dark charcoal (#2C2C2C) / Off-white (#F8F8F8)

**Typography:**
- Primary Font: Inter or SF Pro (clean, modern)
- Headers: 18-24px, Medium weight
- Body: 14-16px, Regular
- Badges: 10-12px, Semi-bold

**Spacing:**
- Content padding: 16-20px
- Avatar size: 56-64px (larger for closer proximity)
- Badge overlay: 18-20px
- Bottom sheet peek: 80-100px

### Animation & Transitions
- Avatar entry: Gentle fade + scale (300ms ease-out)
- Map movement: Smooth interpolation
- Bottom sheet expansion: Spring animation (400ms)
- Badge appearance: Subtle pulse on new arrivals

---

## Screen 2: Intent Declaration (Bottom Sheet Expanded)

### Purpose
Optional layer that transforms the map from pure presence to filtered coordination. User declares destination to surface relevant matches.

### UX Rationale
- **Non-mandatory:** Can use Hitchr without ever declaring intent
- **Filters, doesn't replace:** Map stays visible, just re-focuses
- **Natural language:** Not form-filling, feels conversational
- **Flexible matching:** Partial route overlap, not just exact destinations

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                  [Map - Blurred/Dimmed]            │ ← Map stays visible
│                                                     │
├─────────────────────────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Swipe Handle
│                                                     │
│  🎯 Where are you heading?                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍  Search destination...                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📍 Recent Destinations                            │
│  • Coffee Hub, MG Road                             │
│  • University Campus, Whitefield                   │
│  • Airport Terminal 1                              │
│                                                     │
│  ⏱️ When?                                          │
│  ┌──────┬──────┬──────┬──────┐                   │
│  │ Now  │ 15min│ 1hr  │ Later│                   │
│  └──────┴──────┴──────┴──────┘                   │
│                                                     │
│  🚀 I'm flexible with route                        │
│  Toggle: [ON] Show alternative paths               │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │        🌐 Start Discovering                  │  │ ← Primary CTA
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Swipe down to collapse]                         │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Search Input
- Autocomplete with Google Places / Mapbox
- Shows recent destinations (learned behavior)
- Can save favorite locations
- Optional: Voice input

#### B. Time Selector
- Quick-select chips (Now, 15min, 1hr, Later)
- "Now" is default (immediate intent)
- "Later" opens time picker for scheduling
- For Professionals: Shows recurring patterns ("Your usual Monday 9am route?")

#### C. Flexibility Toggle
- **Default ON for Students** (encourage exploration)
- **Default OFF for Professionals** (prefer direct routes)
- When ON: Matches on directional similarity, not exact path
- Shows "X additional potential matches" indicator

#### D. Start Discovering Button
- Primary action button
- Transforms map to Discovery State
- Changes label based on time:
  - "Start Discovering" (now)
  - "Set Intent & Browse" (later)

### Interaction Patterns

1. **Destination Input:**
   - Type → Autocomplete suggestions appear
   - Select → Destination locked, map previews route
   - Recent taps → Quick fill

2. **Time Selection:**
   - Tap chip → Highlight selected
   - Visual feedback shows "Looking for rides leaving ~[time]"

3. **Flexibility:**
   - Toggle ON: Map shows broader radius of users
   - Toggle OFF: Stricter matching on direct path

4. **Submit:**
   - Button press → Transition to Discovery State
   - Map re-focuses, avatars filter/reorder

### Edge Cases
- **No destination entered:** "Browse who's moving now"
- **No matches found:** "No one on this route yet. We'll notify you!"
- **Saved routes:** Quick access to common destinations

---

## Screen 3: Discovery State (Filtered Map + Match List)

### Purpose
Hybrid view combining filtered map with browsable list of matched users. Feels like browsing people, not selecting rides.

### UX Rationale
- **Faces-first:** Profile photos prominent
- **Social discovery:** Browse potential travel companions
- **Low pressure:** No booking, no commitment yet
- **Rich context:** See journey snippets, not just "available"

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ ←  Koramangala → Airport T1           🔔 [23]      │ ← Route Header
├─────────────────────────────────────────────────────┤
│                                                     │
│              [Filtered Map]                         │
│         Route line drawn                            │
│                                                     │
│         👤 (Alice)                                  │
│         [Early Hitchr]                              │
│                                                     │
│              📍 YOU                                 │
│                                                     │
│                   👤 (David)                        │
│                   [City Connector]                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🌊 People on your route (4)            [Map View] │ ← Discovery Sheet
│  ═══════════════════════════════════════════════   │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤   Alice Kumar              0.3 km away     │ │
│  │ 🌟   Early Hitchr             • 2 journeys    │ │
│  │                                                │ │
│  │ "Heading to airport, happy to chat!"          │ │
│  │                                                │ │
│  │ 📍 Koramangala → Terminal 1                   │ │
│  │ ⏱️ Leaving now                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤   David Patel              1.2 km away     │ │
│  │ 🔗   City Connector           • 24 journeys   │ │
│  │                                                │ │
│  │ "Regular airport runs, know the best route"   │ │
│  │                                                │ │
│  │ 📍 Indiranagar → Terminal 1 (via ORR)        │ │
│  │ ⏱️ Leaving in 15 min                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Swipe for more...]                              │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Route Header
- Shows user's declared route
- Back button to edit intent
- Notification bell (still accessible)
- Optional: "Share route" icon

#### B. Filtered Map
- Your destination marked
- Route line drawn (subtle, not dominant)
- Only matched avatars visible
- Matched users pulsing gently
- Map slightly dimmed vs. list focus

#### C. Discovery List Header
- "People on your route (X)" 
- Toggle: [List View] / [Map View]
  - List: Scrollable cards (default)
  - Map: Full map with tap-to-preview

#### D. Match Cards
**Each card contains:**
- Profile photo (large, 64px)
- Name (bold, 16px)
- Community badge + journey count
- Intent snippet (optional, user-written)
- Route details (origin → destination)
- Departure time
- Distance from you
- "Connect" button (primary action)

**Card Priority Sorting:**
1. Departure time proximity
2. Route overlap %
3. Mutual connections (future)
4. Badge reputation

### Interaction Patterns

1. **Tap Card:** Expands to full profile preview modal
2. **Tap Avatar on Map:** Highlights corresponding card
3. **"Connect" Button:** Opens Coordination Flow
4. **Pull to Refresh:** Update live positions
5. **Filter Button (top-right):** 
   - Sort by: Time, Distance, Reputation
   - Show only: Trusted users, First-timers

### Card Design Details

**Visual Treatment:**
- White background with subtle shadow
- Rounded corners (12-16px)
- Padding: 16px
- Margin between cards: 12px
- Border-left accent (color-coded by badge)

**Badge Colors:**
- 🌟 Early Hitchr: Gold (#FFD700)
- 🔗 City Connector: Blue (#4A90E2)
- ✓ Trusted Traveler: Green (#4CAF50)
- 🎒 Community Builder: Purple (#9C27B0)
- 🎉 Event Hopper: Orange (#FF9800)

**Intent Snippets:**
Examples of what users might write:
- "Coffee lover, let's chat about the city!"
- "Regular commute, happy to coordinate"
- "First time to airport, could use guidance"
- "Silent ride preferred, respectful traveler"

### Empty State

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  🌍                                 │
│                                                     │
│         No one on this route yet                   │
│                                                     │
│  We'll notify you when someone matches             │
│  your destination and timing                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          🔔 Notify Me                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Meanwhile, check out:                             │
│  • Who's nearby (4 people)                        │
│  • Popular routes today                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Screen 4: Profile Screen (Self & Others)

### Purpose
Social identity hub showing journey history, earned badges, and trust indicators. NOT a follower-count platform.

### UX Rationale
- **Identity through movement:** Stories built from real journeys
- **Trust signals:** Badges and history create social proof
- **No vanity metrics:** No likes, followers, or popularity contests
- **Earned reputation:** Everything visible is based on action

### Visual Layout (Self Profile)

```
┌─────────────────────────────────────────────────────┐
│ ←  Profile                              ⚙️ Settings │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────┐                           │
│              │  [IMG]  │                           │
│              │  Alice  │                           │
│              │  Kumar  │                           │
│              └─────────┘                           │
│                                                     │
│            Alice Kumar                              │
│         @alicek • Joined Oct 2024                  │
│                                                     │
│  "Exploring the city one ride at a time 🌆"       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🏆 Community Badges                               │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │  🌟  │ │  🔗  │ │  ✓   │ │  🎒  │            │
│  │Early │ │ City │ │Trust │ │Build │            │
│  │Hitchr│ │ Conn │ │Travel│ │  er  │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                     │
│  [Tap to see how you earned these]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📊 Journey Stats                                  │
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │    24      │ │   240 km   │ │     12     │   │
│  │ Journeys   │ │  Together  │ │   Cities   │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🗺️ Journey History                               │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📍 Koramangala → Airport T1                   │ │
│  │ 👤 With David P.                              │ │
│  │ 📅 Jan 8, 2026                                │ │
│  │ "Great conversation about startups!"           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📍 MG Road → Whitefield                       │ │
│  │ 👤 With Sara M.                               │ │
│  │ 📅 Jan 6, 2026                                │ │
│  │ "Smooth ride, good music taste :)"            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [View all journeys →]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Visual Layout (Others' Profile)

```
┌─────────────────────────────────────────────────────┐
│ ←  Back                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────┐                           │
│              │  [IMG]  │                           │
│              │  David  │                           │
│              │  Patel  │                           │
│              └─────────┘                           │
│                                                     │
│            David Patel                              │
│         Member since Aug 2024                       │
│                                                     │
│  "Airport runs • Tech talks • Coffee stops"        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🏆 Community Badges                               │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │  🔗  │ │  ✓   │ │  🎒  │                      │
│  │ City │ │Trust │ │Build │                      │
│  │ Conn │ │Travel│ │  er  │                      │
│  └──────┘ └──────┘ └──────┘                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📊 Journey Stats                                  │
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │    56      │ │   680 km   │ │     18     │   │
│  │ Journeys   │ │  Together  │ │   Routes   │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  💬 What others say                                │
│                                                     │
│  "Reliable and friendly!" - Alice K.               │
│  "Great route recommendations" - Sara M.           │
│  "Punctual and respectful" - James T.             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │            💬 Say Hi                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │            🤝 Connect for Journey            │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Profile Header
- Large circular avatar (120px)
- Name (bold, 22px)
- Username / Join date
- Bio (optional, 2-3 lines max)
- Edit button (self profile only)

#### B. Community Badges Section
**Badge Display:**
- Large icons (48-56px)
- Badge name below
- Tap to see criteria and progress
- Locked badges shown in grayscale

**Badge Earning Criteria (Examples):**
- 🌟 **Early Hitchr:** Joined in first 6 months
- 🔗 **City Connector:** 25+ journeys with 15+ different people
- ✓ **Trusted Traveler:** 10+ journeys with 100% positive feedback
- 🎒 **Community Builder:** Introduced 5+ new users
- 🎉 **Event Hopper:** Coordinated 5+ group movements

#### C. Journey Stats
- Total journeys
- Distance covered (aggregate)
- Unique routes / Cities visited
- Optional: Carbon saved (vs. single trips)

#### D. Journey History
**Each history item:**
- Route (origin → destination)
- Co-travelers (if any)
- Date
- Optional journey note/memory
- Photo attachment (future)

#### E. Social Proof (Others' Profiles)
- "What others say" section
- Short snippets from past journey reviews
- No star ratings, just qualitative feedback

#### F. Action Buttons
- "Say Hi" → Opens chat
- "Connect for Journey" → Pre-fills coordination with this person

### Badge Modal (Expanded View)

```
┌─────────────────────────────────────────────────────┐
│ ←  City Connector Badge                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│                  🔗                                 │
│           City Connector                            │
│                                                     │
│  You've brought people together across the city,   │
│  creating connections through shared journeys.     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Your Progress:                                    │
│                                                     │
│  ✅ 25+ journeys completed                        │
│  ✅ 15+ different travel companions               │
│  ✅ 5+ routes traversed                           │
│                                                     │
│  Earned: September 15, 2024                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │    💙 Share Your Achievement                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Screen 5: Coordination Flow

### Purpose
Simple, human confirmation to coordinate travel. Not a booking, not a payment - just intent alignment.

### UX Rationale
- **Lightweight:** No contracts, no commitments
- **Human:** Feels like texting a friend
- **Flexible:** Can adjust details conversationally
- **Low pressure:** Easy to decline or reschedule

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ ←  Coordinate with David                     ⋮     │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────┐                           │
│              │  [IMG]  │                           │
│              │  David  │                           │
│              │  Patel  │                           │
│              └─────────┘                           │
│                                                     │
│            David Patel                              │
│         🔗 City Connector • 56 journeys            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🗺️ Journey Details                               │
│                                                     │
│  📍 From: Koramangala (near you)                  │
│  📍 To: Airport Terminal 1                        │
│                                                     │
│  ⏱️ Leaving: Now (or in ~10 min)                 │
│  🚗 David has: Car (4 seats available)            │
│                                                     │
│  💬 David says:                                    │
│  "Happy to pick you up from Jyoti Nivas College   │
│   intersection. Know the best route to avoid      │
│   ORR traffic!"                                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ✏️ Add a note (optional)                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ "I'll be near the college gate in 5 min..."  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │         ✅ Confirm & Share Location         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │            💬 Just Chat First               │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Not interested? Swipe to dismiss]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. User Identity
- Profile photo & name (reinforcement)
- Key badge
- Journey count (trust signal)

#### B. Journey Summary
- Matched route
- Departure time (flexible language)
- Vehicle info (if pilot has car/bike)
- Distance between current locations

#### C. Pilot Message
- Pre-written note from the pilot/rider
- Context about pickup, route, preferences
- Personality/tone visible

#### D. Rider Response
- Optional text input
- Suggest alternative pickup points
- Communicate preferences (music, silence, etc.)

#### E. Action Buttons
**Primary:** "Confirm & Share Location"
- Starts live location sharing
- Moves to Movement State
- Sends notification to other party

**Secondary:** "Just Chat First"
- Opens chat interface
- Lower commitment
- For trust-building

**Tertiary:** Swipe to dismiss
- Polite decline
- Optional: "Not right now" with reason

### Confirmation Modal

After tapping "Confirm & Share Location":

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  ✅                                 │
│                                                     │
│         Coordination Confirmed!                     │
│                                                     │
│  David has been notified and can see your          │
│  live location.                                     │
│                                                     │
│  📍 Head to: Jyoti Nivas College Gate              │
│  ⏱️ ETA: ~5 minutes                               │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         💬 Chat with David                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         📍 View on Map                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Tip: Be courteous and communicate if plans change │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Chat Interface (Lightweight)

```
┌─────────────────────────────────────────────────────┐
│ ←  Chat with David                          📍 🔔  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [THEM] Hi! I'm on my way, 5 min out              │
│         9:42 AM                                     │
│                                                     │
│                          [YOU] Perfect! I'm here  │
│                          See you soon              │
│                                        9:43 AM     │
│                                                     │
│  [THEM] 👍                                         │
│         9:43 AM                                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ Type a message...                       📎 ➤ │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Chat Features:**
- Simple text only (v1)
- Location sharing button
- ETA sharing
- Quick replies ("5 min away", "I'm here", "Running late")
- Future: Voice notes, photos

---

## Screen 6: Movement State

### Purpose
Quiet background tracking during active journey. Minimal UI interruptions, auto-confirm start via proximity.

### UX Rationale
- **Non-intrusive:** Journey is happening, UI should fade
- **Ambient safety:** Location sharing visible but subtle
- **Easy access:** Emergency and chat always available
- **Auto-confirmation:** No manual "start ride" button needed

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ ☰  Journey in Progress                  ⋮          │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              [Live Map - Journey View]              │
│                                                     │
│         📍 YOU ━━━━━━→                            │
│                      👤 David                      │
│                                                     │
│              Route to Terminal 1                    │
│                  ━━━━━━━━━                        │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│                     🏁                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │                                              │  │
│  │  📍 To Airport Terminal 1                   │  │
│  │  ⏱️ ETA: 18 min (3.2 km away)              │  │
│  │                                              │  │
│  │  Traveling with David P. 🔗                 │  │
│  │                                              │  │
│  │  ┌────────────┐  ┌────────────┐           │  │
│  │  │   💬 Chat  │  │ 🚨 Safety  │           │  │
│  │  └────────────┘  └────────────┘           │  │
│  │                                              │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Journey auto-ends when destination reached]     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Map View - Journey Mode
- Both users' live locations visible
- Route line drawn from start to destination
- Current progress indicator
- Destination pin (finish flag)
- Simplified map (fewer details, focus on route)

#### B. Journey Info Card (Bottom)
- Destination name
- ETA and distance
- Co-traveler name & badge
- Subtle background (white/translucent)
- Always accessible (not modal)

#### C. Quick Actions
**Chat Button:**
- Opens lightweight chat overlay
- Notification badge if unread messages

**Safety Button:**
- Emergency contact quick-dial
- Share journey with trusted contact
- Report issue
- End journey early

#### D. Auto-Confirmation Logic
**Journey Start:**
- Detects when both users within 50m radius
- Background notification: "Journey started with David"
- Begins duration tracking

**Journey End:**
- Detects arrival at destination (within 100m)
- Transition to Post-Journey screen
- Background notification: "Journey complete! How was it?"

### Safety Panel (Expanded)

```
┌─────────────────────────────────────────────────────┐
│ ←  Safety & Support                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🚨 Emergency Options                              │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         📞 Call Emergency Services            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         📤 Share Journey with Contact         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         🛑 End Journey Now                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         ⚠️ Report Issue                      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ℹ️ Journey Details                                │
│                                                     │
│  Started: 9:45 AM                                  │
│  Duration: 12 minutes so far                       │
│  With: David Patel (🔗 City Connector)            │
│                                                     │
│  Your location is being shared with David          │
│  and [Emergency Contact Name].                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Minimal Notification (Background State)

When app is backgrounded during journey:

```
┌─────────────────────────────────────────────────────┐
│  Hitchr                                        9:52 │
│  🚗 Journey in progress with David                 │
│  ETA to Airport: 15 min                            │
│  [Tap to view]                          [💬] [🚨] │
└─────────────────────────────────────────────────────┘
```

---

## Screen 7: Post-Journey / Community Memory

### Purpose
Capture journey completion, gather feedback, and log memory into user's community identity.

### UX Rationale
- **Celebrate completion:** Positive reinforcement
- **Build reputation:** Feedback contributes to trust
- **Create memory:** Journeys become stories
- **Encourage return:** Prompt for next discovery

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  🎉                                 │
│                                                     │
│         Journey Complete!                           │
│                                                     │
│  You traveled 3.2 km with David                    │
│  from Koramangala to Airport Terminal 1            │
│                                                     │
│  Duration: 18 minutes                              │
│  CO₂ saved: ~0.8 kg vs. separate trips            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ⭐ How was your experience with David?            │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │   👍    │  │   😊    │  │   💬    │          │
│  │  Great  │  │  Good   │  │  Tell   │          │
│  │         │  │         │  │  More   │          │
│  └─────────┘  └─────────┘  └─────────┘          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ✨ Leave a memory (optional)                      │
│  ┌───────────────────────────────────────────────┐ │
│  │ Great conversation about tech startups!       │ │
│  │ David knew all the traffic shortcuts :)       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🏆 Progress Update                                │
│                                                     │
│  • 3 more journeys to unlock "City Connector"     │
│  • New route discovered: Koramangala ↔️ Airport   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │         ✅ Submit & Continue                │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         🌐 Discover Next Journey             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Skip for now]                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### A. Journey Summary
- Celebration header (🎉 emoji + "Journey Complete!")
- Route recap
- Co-traveler name
- Duration & distance
- Environmental impact (CO₂ saved)

#### B. Feedback Section
**Quick Feedback (Required):**
- 👍 Great (positive)
- 😊 Good (neutral-positive)
- 💬 Tell More (opens detailed form)

**No negative option visible initially** to keep positive:
- If user doesn't submit, can report separately
- "Report issue" link at bottom

#### C. Memory Input (Optional)
- Text field for journey note
- Character limit: 200
- Placeholder suggestions:
  - "What did you talk about?"
  - "Any memorable moments?"
  - "Recommendations you exchanged?"
- Optional: Add photo (future)

#### D. Progress Update
- Badge progress notification
- New route/achievement unlocked
- Motivational language

#### E. Action Buttons
**Primary:** "Submit & Continue"
- Saves feedback and memory
- Returns to Default Map

**Secondary:** "Discover Next Journey"
- Pre-fills last destination as origin
- Encourages immediate re-engagement

**Tertiary:** "Skip for now"
- Dismisses modal
- Still logs journey (without detailed feedback)

### Detailed Feedback (If "Tell More" selected)

```
┌─────────────────────────────────────────────────────┐
│ ←  Share Your Experience                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📝 What made this journey special?                │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Text area - 200 chars]                       │ │
│  │                                                │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ⭐ Rate different aspects:                        │
│                                                     │
│  Communication    ●●●●○                            │
│  Punctuality      ●●●●●                            │
│  Courtesy         ●●●●○                            │
│  Route Knowledge  ●●●●●                            │
│                                                     │
│  🤝 Would you travel with David again?            │
│  ○ Yes, definitely                                 │
│  ○ Maybe, depending on route                       │
│  ○ Prefer not                                      │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         ✅ Submit Feedback                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Badge Unlock Celebration

If user unlocks badge during this journey:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  ✨✨✨                            │
│                                                     │
│               Badge Unlocked!                       │
│                                                     │
│                  🔗                                 │
│           City Connector                            │
│                                                     │
│  You've completed 25 journeys with 15 different    │
│  people, building connections across the city!     │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │    💙 Share Achievement                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │    🎉 Continue                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Additional UX Patterns & Considerations

### 1. Onboarding Flow (New Users)

**Screen 1: Welcome**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  🌍                                 │
│                 HITCHR                              │
│                                                     │
│         Move together, build community              │
│                                                     │
│  A live map of real people, real movement.         │
│  Coordinate journeys, discover companions,          │
│  and build identity through shared experiences.    │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         Get Started                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Screen 2: Permission Requests**
- Location (required): "See who's nearby and moving"
- Notifications (recommended): "Get matched when someone shares your route"
- Contacts (optional): "Find friends already on Hitchr"

**Screen 3: Profile Setup**
- Photo upload
- Name
- Bio (optional)
- First destination (to demonstrate intent flow)

**Screen 4: Map Tutorial (Overlay)**
- "This is your city, alive"
- "Tap avatars to see people"
- "Swipe up when you're ready to move"
- "Your journey, your community"

### 2. Empty States

**No nearby users:**
```
🌍
The city is quiet right now.
Be the first to put your area on the map!

[Share Hitchr] [Invite Friends]
```

**No journey history:**
```
🗺️
Your journey story starts here.
Every trip you take builds your community identity.

[Discover Your First Journey]
```

**No badges yet:**
```
🏆
Earn badges by being an active community member.
Travel, connect, and build reputation.

[See Available Badges]
```

### 3. Notification Design

**In-App Notifications:**
- Subtle banner at top (not modal)
- Avatar of relevant person
- Dismissible with swipe

**Examples:**
- "Alice is heading to Airport too! Match now?"
- "You unlocked a new badge: Trusted Traveler ✓"
- "David sent you a message"
- "Your regular route to Whitefield has 3 matches today"

**Push Notifications:**
- Only for high-value moments
- Match found on saved route
- Journey partner nearby
- Badge unlocked
- Safety alerts

### 4. Settings Screen

```
┌─────────────────────────────────────────────────────┐
│ ←  Settings                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  👤 Account                                        │
│  • Edit Profile                                    │
│  • Privacy Settings                                │
│  • Notification Preferences                        │
│                                                     │
│  🗺️ Journey Preferences                           │
│  • Saved Destinations                              │
│  • Regular Routes                                  │
│  • Auto-match Settings                             │
│                                                     │
│  🔒 Safety & Privacy                               │
│  • Emergency Contacts                              │
│  • Location Sharing                                │
│  • Block List                                      │
│  • Report History                                  │
│                                                     │
│  🏆 Community                                      │
│  • Your Badges                                     │
│  • Achievement Progress                            │
│  • Community Guidelines                            │
│                                                     │
│  ℹ️ About                                          │
│  • Help & Support                                  │
│  • Terms of Service                                │
│  • Privacy Policy                                  │
│  • App Version                                     │
│                                                     │
│  🚪 Sign Out                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5. Accessibility Considerations

**Visual:**
- High contrast mode support
- Minimum text size: 14px
- Color-blind friendly badge colors
- Clear focus states for navigation

**Motor:**
- Large touch targets (48x48px minimum)
- No time-pressured interactions
- Swipe gestures have button alternatives

**Cognitive:**
- Simple, clear language
- Consistent patterns across screens
- Progressive disclosure (advanced features hidden)
- Help tooltips for first-time actions

---

## Persona-Specific UX Adaptations

### For Students / Explorers

**Emphasis:**
- Bright, energetic colors
- Discovery prompts: "Explore nearby areas"
- Social features front and center
- Flexible time matching (wider windows)
- Badge gamification more visible

**Notifications:**
- "Someone interesting is heading your way!"
- "3 people exploring [area] right now"
- "Weekend adventure: Join group heading to [destination]"

**Language:**
- Casual, friendly
- Emoji usage
- Social encouragement

### For Professionals / Reliables

**Emphasis:**
- Calmer color palette (blues, grays)
- Predictability: "Your usual route has 2 matches"
- Saved commutes prominent
- Strict time matching (narrow windows)
- Efficiency metrics visible

**Notifications:**
- "Your 9am route to Whitefield has a match"
- "Regular co-traveler Sarah is available today"
- "Traffic alert: Alternative route suggested"

**Language:**
- Professional, respectful
- Time and efficiency focused
- Minimal emoji

**Adaptive Logic:**
- System learns persona from behavior
- Morning weekday usage → Professional UI
- Evening/weekend usage → Explorer UI
- Can be manually toggled in settings

---

## Technical Implementation Notes

### Animation Library
- **React Native:** Use `react-native-reanimated` (v3+)
- **Gestures:** `react-native-gesture-handler`
- **Maps:** `react-native-maps` (Google Maps / Mapbox)

### Performance Targets
- Map frame rate: 60 FPS
- Avatar updates: Max 2-second latency
- Screen transitions: <300ms
- Cold start: <3 seconds

### State Management
- Global: Redux Toolkit / Zustand
- Location updates: WebSocket connection
- Optimistic UI updates for all actions

### Map Optimization
- Cluster avatars when >20 users visible
- Lazy load avatar images
- Reduce map detail when moving fast
- Cache tile data for offline viewing

---

## Design System Summary

### Color Palette

**Primary:**
- Coral: `#FF6B6B` (active elements, CTAs)
- Deep Charcoal: `#2C2C2C` (text)
- Off White: `#F8F8F8` (backgrounds)

**Secondary:**
- Blue: `#4A90E2` (trust, info)
- Green: `#4CAF50` (positive, success)
- Yellow: `#FFC107` (warnings, attention)
- Purple: `#9C27B0` (badges, special)

**Neutrals:**
- Gray 100: `#F5F5F5`
- Gray 300: `#E0E0E0`
- Gray 500: `#9E9E9E`
- Gray 700: `#616161`
- Gray 900: `#212121`

### Typography Scale

```
H1: 32px, Bold
H2: 24px, Bold
H3: 20px, Semi-bold
Body Large: 16px, Regular
Body: 14px, Regular
Caption: 12px, Regular
Button: 16px, Semi-bold
```

### Spacing System (8px base)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Component Library

**Buttons:**
- Primary: Filled coral, rounded 8px, height 48px
- Secondary: Outlined, rounded 8px, height 48px
- Tertiary: Text only, no border

**Cards:**
- Border radius: 12-16px
- Shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Padding: 16px

**Inputs:**
- Border radius: 8px
- Height: 48px
- Border: 1px solid Gray 300
- Focus: Border color → Primary

**Avatars:**
- Small: 32px
- Medium: 48px
- Large: 64px
- Profile: 120px
- Border: 2px white + shadow

---

## Success Metrics (Aligned with UX)

### Engagement
- Daily active users opening map (habit formation)
- Average session duration (aim: 3-5 minutes)
- Return rate within 7 days (>60%)

### Social
- % of users with >3 journey partners (community depth)
- Average time from intent to coordination (<10 minutes)
- Badge unlock rate (gamification effectiveness)

### Trust & Safety
- Positive feedback rate (>90%)
- Safety incidents per 1000 journeys (<1)
- Repeat journey partners (trust building)

### Product-Market Fit
- Organic sharing rate (virality)
- NPS score (>40)
- Weekly usage frequency (3+ times for students, 5+ for professionals)

---

## Next Steps for Implementation

### Phase 1: Core Experience (MVP)
1. **Screen 1:** Default Map with live avatars
2. **Screen 3:** Discovery State (simplified)
3. **Screen 5:** Coordination Flow (basic)
4. **Screen 6:** Movement State (auto-tracking)

### Phase 2: Identity Layer
5. **Screen 4:** Profile & Badge system
6. **Screen 7:** Post-Journey feedback
7. **Screen 2:** Enhanced Intent Declaration

### Phase 3: Refinement
- Persona-adaptive UI
- Advanced matching algorithms
- Chat system enhancement
- Community features (groups, events)

---

## Conclusion

Hitchr's UX is designed to feel like **Instagram-on-a-map** - a social platform where movement creates the content, and community emerges from shared journeys.

**Key Differentiators:**
- ✅ Map-first, always visible
- ✅ Faces not pins, humans not data points
- ✅ Intent-based, not demand-based
- ✅ Community identity through movement
- ✅ Zero transactional pressure

**This is not a ride app. This is a social coordination platform.**

The design succeeds when users:
1. Open Hitchr before stepping out (habit)
2. Feel part of a living community (belonging)
3. Build identity through journeys (status)
4. Recommend to friends naturally (organic growth)

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Created By:** Hitchr Design Team  
**Status:** Ready for Development Implementation



