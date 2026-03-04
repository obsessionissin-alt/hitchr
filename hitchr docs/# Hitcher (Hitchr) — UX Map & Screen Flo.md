# Hitcher (Hitchr) — UX Map & Screen Flow Document

## 1. Product Overview

**Hitcher** is a social-first hitchhiking and carpooling application designed to help people:

* Commute together for **education and work** (school, college, office)
* **Plan trips** and find people to join journeys
* Enable **explorers** to discover places via real-time movement intelligence

The core philosophy is **Feed‑First, Route‑Centric, Social Discovery**, not a traditional map-only utility.

---

## 2. Core Personas

### Persona 1: Daily Movers (Education & Work)

* Students, interns, office-goers
* Travel same routes repeatedly
* Pain points: cost, safety, loneliness, unreliable transport
* Primary goals:

  * Find trusted people on the same route
  * Save money and time
  * Build familiar travel circles

### Persona 2: Trip Groups

* Friends or solo travelers planning trips
* Want to add people to reduce cost / increase fun
* Primary goals:

  * Discover others going the same way
  * Coordinate plans easily
  * Build short-term travel communities

### Persona 3: Explorers

* Curious, spontaneous travelers
* Use Hitcher for discovery rather than necessity
* Primary goals:

  * See where people are going
  * Join journeys impulsively
  * Discover places through people

---

## 3. Information Architecture (Top-Level Navigation)

**Bottom Navigation (5 Tabs)**

1. Home (Feed)
2. Communities
3. Journey Composer (Primary Action)
4. Map
5. Profile

**Global Actions**

* Search (Header Icon)
* Notifications

---

## 4. Screen‑to‑Screen UX Map (High Level)

```
Onboarding → Home Feed
Home Feed → Search
Home Feed → Journey Composer
Home Feed → Trip Detail
Home Feed → Profile Preview

Journey Composer → Route Setup → Ride Post → Home Feed

Map → List View ↔ Map View
Map → Trip Detail

Communities → Community Feed → Trip Detail
Communities → Memories

Trip Detail → Join Ride → While Riding
While Riding → End Ride → Memory Creation

Profile → My Trips / Badges / Settings
```

---

## 5. Detailed Screen Breakdown

## 5.1 Onboarding

**Purpose**: Trust + clarity in under 60 seconds

**Screens**:

* Phone/Login
* Basic profile setup
* Safety assurance intro

**UX Notes**:

* Minimal steps
* Emphasis on community and safety

---

## 5.2 Home Feed (Feed‑First Architecture)

**Purpose**: Social discovery of movement

**Sections**:

1. Live Now (active rides nearby)
2. Trips Being Planned

**Key Features**:

* No memories here (intentional)
* Feed shows people, not vehicles
* Trust badges visible

**User Actions**:

* Tap trip → Trip Detail
* Tap profile → Profile Preview
* Open Search

---

## 5.3 Search (Intent‑Driven Discovery)

**Purpose**: Explore memories, destinations, people

**Content**:

* Trending destinations
* Past memories
* Communities

**UX Rationale**:

* Keeps Home focused on real-time
* Search supports curiosity

---

## 5.4 Journey Composer (Center Tab)

**Purpose**: Create rides or trip plans

**Flow**:

```
Select Route → Set Time → Choose Intent → Post Ride
```

**Features**:

* Route-first creation
* Not photo-first
* Hinglish microcopy

**Why Center Tab**:

* Primary action
* Always accessible

---

## 5.5 Trip Detail Screen

**Purpose**: Decision-making hub

**Shows**:

* Route & stops
* Who’s going
* Trust badges
* Community context

**Actions**:

* Hit (join ride)
* Chat
* Save

---

## 5.6 Map Screen

**Purpose**: Spatial awareness of movement

**Modes**:

* Map View
* List View (toggle)

**UX Rationale**:

* Supports two mental models
* Map for explorers, list for planners

---

## 5.7 Communities

**Purpose**: Belonging + repeat travel

**Types**:

* College
* Office
* Trip-based

**Features**:

* Community feed
* Shared memories
* Trip posts

---

## 5.8 While Riding

**Purpose**: Safety + clarity

**Features**:

* Ride status
* Emergency actions
* Manual End Ride button

**UX Choice**:

* Manual control builds trust

---

## 5.9 Memory Creation

**Purpose**: Reflection + social proof

**Triggered After**:

* Ride ends

**Visible In**:

* Search
* Communities
* Profile

---

## 5.10 Profile

**Purpose**: Trust & identity

**Includes**:

* Badges (not ratings)
* Trip history
* Memories
* Settings

---

## 6. Safety & Trust UX

* Positive-only badges
* No public negative ratings
* Ride verification
* Community moderation

---

## 7. UX Principles Applied

* Feed‑First Discovery
* Route‑Centric Thinking
* Intent‑Based Navigation
* Cultural Microcopy (Hinglish)
* Emotional Design (Day/Night themes)

---

## 8. Success Criteria (UX)

* User understands value in <60 seconds
* Navigation feels intuitive without explanation
* App feels Indian, social, and alive
* Movement feels human, not mechanical

---

## 9. Complete UI Screen Flow Based on User Behaviour

This section maps **exact UI screen-to-screen flows** depending on what the user intends to do. It answers: *what screen comes next, and why*.

---

### FLOW A: First-Time User (Any Persona)

```
App Launch
→ Splash Screen
→ Login / Signup
→ Basic Profile Setup
→ Safety Intro
→ Home Feed
```

**Behaviour logic**:

* User has no context → we orient them socially first
* Home Feed is the grounding point for all users

---

### FLOW B: Daily Commuter (Education / Work)

**Goal**: Find or post a recurring ride

```
Home Feed
→ Live Now / Planned Trips
→ Trip Detail
→ Hit (Join)
→ Chat Screen
→ While Riding
→ End Ride
→ Memory Prompt (Optional)
→ Home Feed
```

**Alternate (Posting a Ride)**

```
Home Feed
→ Journey Composer (Center Tab)
→ Route Selection
→ Time & Frequency
→ Post Ride
→ Home Feed (Post Visible)
```

**Why this flow**:

* Repetitive use
* Low friction
* Trust builds over time via badges & repetition

---

### FLOW C: Trip Planner (Group Travel)

**Goal**: Add more people to a planned trip

```
Home Feed
→ Trips Being Planned
→ Trip Detail
→ View Participants
→ Join / Share Trip
→ Chat
```

**Alternate (Creating Trip)**

```
Journey Composer
→ Route Setup
→ Trip Intent (Leisure / Adventure)
→ Add Notes
→ Post Trip
→ Community Feed / Home Feed
```

---

### FLOW D: Explorer / Discovery User

**Goal**: Discover places & spontaneous rides

```
Home Feed
→ Search (Header)
→ Trending Destinations
→ Memory View
→ Trip Detail
→ Hit (Join)
→ While Riding
```

**Why Search First**:

* Explorer intent is curiosity-based
* Memories are discovery tools, not utilities

---

### FLOW E: Map-Based Behaviour

**Goal**: Visualize movement

```
Map Tab
→ Map View
↔ List View Toggle
→ Trip Detail
→ Join / Save
```

**Mental Models Supported**:

* Spatial thinkers → Map
* Logical planners → List

---

### FLOW F: Community-Based Behaviour

**Goal**: Travel with known groups

```
Communities Tab
→ Select Community
→ Community Feed
→ Trip Post
→ Trip Detail
→ Join Ride
```

---

### FLOW G: While Riding (Active State)

```
Ride Started
→ While Riding Screen
→ Live Status
→ Emergency Options
→ Manual End Ride
→ Memory Creation
```

**UX Reasoning**:

* Active rides require clarity, not clutter
* Manual end = user control

---

### FLOW H: Profile & Trust Exploration

```
Home Feed / Trip Detail
→ Profile Preview
→ Full Profile
→ Badges / Trips / Memories
→ Back to Feed
```

---

### FLOW I: Edge & Return Paths

```
Any Screen
→ Notifications
→ Relevant Trip / Chat

Any Screen
→ Bottom Nav
→ Home Feed (Reset State)
```

---

## 10. Behaviour-to-Screen Logic Summary

| User Intent      | Entry Screen | Next Screen      |
| ---------------- | ------------ | ---------------- |
| Just opened app  | Splash       | Home Feed        |
| Wants to ride    | Home         | Trip Detail      |
| Wants to post    | Anywhere     | Journey Composer |
| Wants to explore | Home         | Search           |
| Wants visuals    | Map          | Trip Detail      |
| Wants safety     | While Riding | Emergency        |

---

## 11. UX Philosophy Reinforced

* **Home = Social Context**
* **Composer = Action**
* **Search = Curiosity**
* **Map = Awareness**
* **Communities = Belonging**
* **Profile = Trust**

---

## 13. Figma‑Ready Screen List (Production‑Level)

This is a **one‑to‑one screen list** you can directly convert into Figma frames. Each screen represents a **single state**, not a feature.

---

### A. Onboarding & Entry

1. Splash Screen
2. Login / Signup (Phone / Email)
3. OTP Verification
4. Basic Profile Setup

   * Name, photo, gender (optional), age range
5. Safety Intro
6. Permissions Screen (Location, Notifications)
7. Entry to Home Feed

---

### B. Home (Feed‑First)

8. Home Feed – Default State
9. Home Feed – Live Now Expanded
10. Home Feed – Trips Being Planned Expanded
11. Profile Preview (Bottom Sheet)
12. Empty State (No Nearby Trips)

---

### C. Search (Intent‑Driven)

13. Search Overlay – Default
14. Search – Trending Destinations
15. Search – Memories Feed
16. Search – Community Results
17. Memory Detail View

---

### D. Journey Composer (Center Tab)

18. Composer Entry
19. Route Selection Screen
20. Route Confirmation
21. Time & Frequency Selection
22. Intent Selection (Work / Trip / Explore)
23. Notes / Context Screen
24. Post Preview
25. Post Success Confirmation

---

### E. Trip & Ride

26. Trip Detail – Default
27. Trip Detail – Joined State
28. Participants List
29. Chat Screen
30. Trip Cancel / Leave Confirmation

---

### F. Map

31. Map View – Default
32. Map View – Cluster Expanded
33. List View
34. Map/List Toggle State

---

### G. Communities

35. Communities Home
36. Community Feed
37. Community Memories
38. Community Members List

---

### H. While Riding

39. While Riding – Active
40. Emergency Actions Sheet
41. End Ride Confirmation

---

### I. Memories

42. Memory Creation
43. Memory Preview
44. Memory Posted Confirmation

---

### J. Profile & Trust

45. Profile – Self
46. Profile – Other User
47. Badges Explanation
48. Trip History
49. Settings

---

### K. System & Edge States

50. Notifications
51. Error State
52. No Internet State

---

## 14. UX Journey Maps (Persona‑Based)

### Persona 1: Daily Commuter (Student / Office)

**Goal**: Reliable, safe daily commute

| Step          | Screen        | Emotion        | Pain Point          | UX Response        |
| ------------- | ------------- | -------------- | ------------------- | ------------------ |
| App Open      | Home Feed     | Neutral        | Unsure who’s nearby | Live Now section   |
| Discover Ride | Trip Detail   | Curious        | Safety concern      | Badges visible     |
| Join Ride     | Chat          | Slight anxiety | Awkward intro       | Icebreaker prompts |
| Ride Active   | While Riding  | Alert          | Safety              | Emergency access   |
| Ride End      | Memory Prompt | Relaxed        | Forget feedback     | Optional memories  |

---

### Persona 2: Trip Planner (Group Travel)

**Goal**: Add people & coordinate smoothly

| Step        | Screen       | Emotion | Pain Point     | UX Response        |
| ----------- | ------------ | ------- | -------------- | ------------------ |
| Planning    | Composer     | Focused | Route clarity  | Route‑first flow   |
| Post Trip   | Preview      | Hopeful | No visibility  | Feed amplification |
| New Join    | Chat         | Excited | Coordination   | Group chat         |
| During Trip | While Riding | Engaged | Chaos          | Status clarity     |
| After Trip  | Memory       | Happy   | Forget sharing | Prompted creation  |

---

### Persona 3: Explorer

**Goal**: Discover places via people

| Step        | Screen       | Emotion   | Pain Point   | UX Response           |
| ----------- | ------------ | --------- | ------------ | --------------------- |
| Browsing    | Search       | Curious   | Where to go? | Trending Destinations |
| Inspiration | Memory       | Inspired  | Can I join?  | Linked trip details   |
| Decision    | Trip Detail  | Excited   | Trust        | Social proof          |
| Ride        | While Riding | Present   | Safety       | Manual control        |
| Reflection  | Memory       | Nostalgic | Lost moments | Community sharing     |

---

## 15. Emotional Flow Summary

* Entry → Orientation
* Discovery → Curiosity
* Decision → Trust
* Action → Control
* Completion → Reflection

---

## 16. Design Handoff Notes (Important)

* Each screen = one Figma frame
* Use **variants** for states (joined, empty, error)
* Bottom nav persistent
* Microcopy guides emotion
* Avoid feature stacking

---

## 17. Final UX Statement

Hitcher’s UX is behaviour‑driven, not screen‑driven. The flows respect how people **move, feel, hesitate, and trust** — turning travel into shared experience.
