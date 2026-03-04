# Hitchr V2 Builder Playbook
**Complete Instructions for Cursor AI to Build the Working Prototype**

---

## Mission Brief

You are building **Hitchr V2** - a high-fidelity interactive HTML/CSS/JavaScript prototype that demonstrates a social coordination platform for movement in India.

**Target Audience**: Gen Z Indians (college students, young professionals, explorers)  
**Core Value**: Make travel social-first, intent-based, and ambient  
**Vibe**: Street-smart movement. Modern Indian authenticity. Not another generic startup.

---

## What You're Building

### Output
A single HTML file (`hitchr-prototype-v2.html`) that includes:
- Complete CSS (embedded `<style>`)
- Complete JavaScript (embedded `<script>`)
- 6 interactive scenarios demonstrating core flows
- Day/Night theme auto-switching
- Micro-interactions and animations
- Modern Indian street-culture aesthetic

### Technical Constraints
- **No external dependencies** (no React, no frameworks)
- **Mobile-first** (max-width: 430px container)
- **Performant** (smooth 60fps animations)
- **Self-contained** (runs offline, no API calls)

---

## Design System

### Color Palette

#### Day Theme (6 AM - 6 PM)
```css
/* Base */
--bg-primary: #FFFEF9;        /* Warm off-white */
--bg-secondary: #F5F1E8;      /* Chai cream */
--text-primary: #2D2A26;      /* Charcoal */
--text-secondary: #6B6661;    /* Warm gray */

/* Accents */
--accent-primary: #FF6B35;    /* Sunset orange */
--accent-secondary: #FFD23F;  /* Mustard yellow */
--accent-tertiary: #4A90E2;   /* Sky blue */
--trust-green: #52C41A;       /* Movement green */
--trust-blue: #1890FF;        /* Coordination blue */

/* Backgrounds */
--coral-50: #FFF5F2;
--coral-500: #FF6B35;
--mustard-50: #FFF9E6;
--mustard-500: #FFD23F;
```

#### Night Theme (6 PM - 6 AM)
```css
/* Base */
--bg-primary: #1A1A1D;        /* Charcoal */
--bg-secondary: #2E2E32;      /* Dark gray */
--text-primary: #F5F5F7;      /* Off-white */
--text-secondary: #A8A8AD;    /* Light gray */

/* Accents */
--accent-primary: #FF006E;    /* Neon pink */
--accent-secondary: #00F5FF;  /* Cyan */
--accent-tertiary: #7B2CBF;   /* Purple */
--trust-green: #39FF14;       /* Neon green */
--trust-blue: #00D9FF;        /* Electric blue */

/* Backgrounds */
--coral-50: #2D1A23;
--coral-500: #FF006E;
--mustard-50: #2D2A1F;
--mustard-500: #FFD700;
```

### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-family-display: "Georgia", "Times New Roman", serif; /* For Hinglish accents */

--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-md: 1.125rem;   /* 18px */
--font-size-lg: 1.25rem;    /* 20px */
--font-size-xl: 1.5rem;     /* 24px */
--font-size-2xl: 2rem;      /* 32px */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing
```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-float: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-heavy: 0 8px 32px rgba(0, 0, 0, 0.16);
```

### Animations
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.3); opacity: 0; }
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## Architecture

### Screen Structure
```html
<div class="app-container"> <!-- max-width: 430px, centered -->
  <div class="scenario active" id="scenario-home">
    <header class="app-header">...</header>
    <div class="scroll-content">
      <!-- Content here -->
    </div>
    <nav class="bottom-nav">...</nav>
  </div>
  
  <div class="scenario" id="scenario-composer">...</div>
  <div class="scenario" id="scenario-map">...</div>
  <div class="scenario" id="scenario-communities">...</div>
  <div class="scenario" id="scenario-profile">...</div>
  <div class="scenario" id="scenario-riding">...</div>
</div>
```

### JavaScript State Management
```javascript
let appState = {
  theme: 'day', // auto-detect based on time
  activeScenario: 'home',
  user: {
    name: 'Priya Kumar',
    avatar: '...',
    badges: ['campus-hero', 'verified-student'],
    journeys: 32
  }
};

function switchScenario(scenarioId) {
  document.querySelectorAll('.scenario').forEach(s => s.classList.remove('active'));
  document.getElementById(`scenario-${scenarioId}`).classList.add('active');
  appState.activeScenario = scenarioId;
}

function detectTheme() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'day' : 'night';
}

// Initialize theme
document.documentElement.setAttribute('data-theme', detectTheme());
```

---

## The 6 Scenarios

### Scenario 1: Home Feed (Social Discovery)

**Purpose**: Show how users browse ambient movement and discover coordination opportunities.

**Components**:
1. **Header**
   - Logo: "hitchr" (lowercase, left)
   - Search icon (top-right, opens search modal)
   - Notification bell (top-right)

2. **Live Map Preview** (collapsed, top of feed)
   - Mini map showing 3-4 live user markers
   - "25 people moving near you" label
   - Tap to expand → switches to Map scenario

3. **Movement Ribbon** (horizontal scroll)
   - Destination clusters: "North Ridge (12)", "Downtown (8)", "Beach (5)"
   - Shows trending destinations with live counts
   - Tap destination → filters feed to that route

4. **Feed Cards** (scrollable)
   - **Section Header: "Live Now"** (pinned, bold)
     - Live movement cards (2-3 examples)
     - User avatar, name, badge
     - Route visual (A→B with animated line)
     - "Hit" button (primary CTA)
   
   - **Section Header: "Trips Being Planned"** (pinned, bold)
     - Planning cards (2-3 examples)
     - Date range, open slots
     - "I'm Interested" button
   
   - **NO Memories Section** (per product rationale)

5. **Floating Action Button** (+)
   - Center-bottom, above bottom nav
   - Opens Journey Composer

6. **Bottom Navigation**
   - Home (active) | Communities | [+] Composer | Map | Profile

**Interactions**:
- Scroll feed smoothly
- Tap "Hit" → opens Hit Modal (bottom sheet)
- Tap Search → opens Search Overlay
- Tap Map Preview → switches to Map scenario
- Tap [+] → switches to Composer scenario

**Hinglish Elements**:
- Empty state: "Abhi koi nahi, check kar thodi der baad"
- Live badge: "Live hai" (instead of "Live Now")
- CTA: "Chal, bro!" on planning cards

---

### Scenario 2: Journey Composer (Content Creation)

**Purpose**: Show route-first content creation with 3 journey types.

**Flow**:
1. **Header**
   - Back button (returns to previous scenario)
   - Title: "Where are you going?"

2. **Step 1: Choose Journey Type**
   - Three large cards:
     - **Live Now** 🔴 "I'm moving right now"
     - **Planning a Trip** 📅 "Future travel"
     - **Share a Memory** 📸 "Past journey"
   - User taps one → proceeds to Step 2

3. **Step 2: Compose**
   - **Route Input** (required)
     - Origin field (autocomplete placeholder)
     - Animated arrow/connector
     - Destination field (autocomplete placeholder)
   
   - **Caption** (optional)
     - Textarea: "What's the vibe?"
   
   - **Media Upload** (optional)
     - Photo picker (show placeholder thumbnails)
   
   - **Additional Fields** (based on type)
     - Live: "Who can see this?" (Public / Communities / Close Connections)
     - Planning: Date picker, "Open slots" counter
     - Memory: Date traveled
   
   - **Post Button** (bottom, disabled until route filled)

**Interactions**:
- Route fields animate route line as you type
- Tapping Post → shows success animation → returns to Home with new post at top

**Visual Details**:
- Route visual is PROMINENT (large, colorful gradient line)
- Tactile feel (shadows, depth on input fields)
- "Post" button pulses when ready

---

### Scenario 3: Map Tab (Spatial Intelligence)

**Purpose**: Show visual movement intelligence with Map/List toggle.

**Components**:
1. **Header**
   - **Map/List Toggle** (prominent, top-center)
     - Two buttons: [Map] [List]
     - Active button highlighted (coral background)
   - Filter button (top-right, opens filter modal)

2. **Map View** (default)
   - Illustrated map background (not actual Google Maps)
   - SVG route paths (animated, gradient strokes)
   - Destination clusters (circles with counts)
     - "North Ridge (12)" - large
     - "Downtown (8)" - medium
     - "Beach (5)" - small
   - Current location marker (pulsing blue dot)
   - Live user markers (small avatars moving along routes)
   
   - **Bottom Info Card** (floating)
     - "Live Movement" stats
     - "12 Your Direction | 3 Near You | 2 Connections"

3. **List View** (toggle to see)
   - Scrollable feed of movement items
   - Each item:
     - User avatar, name, badge
     - Route: "Priya Kumar → North Ridge"
     - Distance: "12 min away"
     - "Hit" button
   - Grouped by proximity: "Very Close", "Nearby", "Same Destination"

4. **Bottom Navigation**
   - Map tab is active

**Interactions**:
- Toggle Map↔List (smooth transition)
- Tap cluster on map → expands into list of people going there
- Tap list item → opens user mini-profile modal

**Visual Details**:
- Map uses pastel gradient background (not realistic map)
- Route paths are artistic (curved, gradient strokes)
- Clusters have pulse animation

---

### Scenario 4: Communities Tab

**Purpose**: Show dual community model (Location + Interest).

**Components**:
1. **Header**
   - Title: "Communities"
   - Search icon (search communities)

2. **My Communities** Section
   - Grid of community cards (2 columns)
   - Each card:
     - Community icon/illustration
     - Name: "DU - North Campus"
     - Member count: "450 members"
     - Activity: "12 active trips"
   
   - **Location Communities** (first 2-3)
     - Auto-joined based on user profile
     - Badge: "Your Hood"
   
   - **Interest Communities** (next 2-3)
     - User-joined
     - Badge: destination icon

3. **Discover Communities** Section
   - Scrollable horizontal cards
   - Suggested based on user activity
   - "Join" button on each

4. **Trip Clusters** (when you tap a community)
   - Opens community page
   - Shows: Upcoming trips (5 planned this month)
   - Past trips: 32 members have been here
   - Feed of community posts

5. **Bottom Navigation**
   - Communities tab active

**Interactions**:
- Tap community → opens community page
- See trip clusters (upcoming + past)
- Join/Leave community button

**Visual Details**:
- Community icons use illustrations (not photos)
- Warm, inviting colors
- Active trip count pulses

---

### Scenario 5: Profile Tab

**Purpose**: Show user identity, badges, and journey history.

**Components**:
1. **Header**
   - Settings icon (top-right)

2. **Profile Hero**
   - Large avatar
   - Name: "Priya Kumar"
   - Badges row:
     - Campus Hero ⭐
     - Verified Student 🎓
     - Night Owl 🦉
   - Stats row:
     - 32 Journeys | 12 Connections | 4 Communities

3. **Journey History**
   - Timeline view (vertical)
   - Each journey:
     - Date
     - Route visual (A→B)
     - Destination name
     - Photos (if memory)
   - Filter: All | Live | Planned | Memories

4. **Achievements** Section
   - Badge showcase
   - Progress bars for next badges
   - "Raaste ka Raja: 18 more journeys to unlock"

5. **Bottom Navigation**
   - Profile tab active

**Interactions**:
- Tap badge → shows badge details modal
- Tap journey → opens journey detail view
- Scroll timeline smoothly

**Visual Details**:
- Badges are colorful, illustrated icons
- Timeline has connecting line (vertical route)
- Achievement progress bars animate

---

### Scenario 6: While Riding (Active Journey)

**Purpose**: Show minimal, safety-first UI during active movement.

**Components**:
1. **Header** (minimal)
   - Back button
   - "Live" badge (green, pulsing)

2. **Map** (full-screen)
   - Current location (large, pulsing marker)
   - Active route path (thick, gradient)
   - Destination marker (end point)

3. **Journey Status Card** (bottom, floating)
   - Route summary:
     - Origin → Destination
     - ETA: "15 min"
     - Distance remaining: "2.3 km"
   
   - **Safety Ribbon**:
     - "3 close connections can see your location"
     - Emergency SOS button (red, small)
     - Check-in prompt: "Feeling safe? Tap to confirm"

4. **End Ride Button** (prominent)
   - Large button: "End Ride"
   - Manual control (no auto-timer in demo mode)
   - Tap → "Journey Complete!" celebration modal

**Interactions**:
- Tap "End Ride" → shows completion modal
- Completion modal:
   - "Journey Complete! 🎉"
   - Stats: "2.3 km | 15 min"
   - "Share your experience?" (opens Memory composer)
   - "Done" button → returns to Home

**Visual Details**:
- Map is calming (muted colors, less UI chrome)
- Safety elements are clear but not alarming
- ETA and distance are LARGE, readable at a glance

---

## Search Overlay

**Triggered From**: Home screen header (search icon)

**Components**:
1. **Search Input**
   - Large, full-width
   - Placeholder: "Search places, people, trips..."
   - Live search (updates as you type)

2. **Results Tabs**
   - All | Places | People | Trips

3. **Results List**
   - **Places Results**:
     - Destination name
     - "12 people planning | 3 live now"
     - "18 memories"
   
   - **People Results**:
     - Avatar, name, badges
     - Latest journey
   
   - **Trips Results** (this is where Memories appear!)
     - Live posts
     - Planned trips
     - **Memory posts** (past journeys matching search)

4. **Quick Actions**
   - "Recent Searches" (top)
   - "Trending Destinations" (bottom, chips)

**Interaction**:
- Type "Spiti" → see results:
  - Spiti Valley (place)
  - Spiti Nomads (community)
  - 2 planning trips
  - 18 memory posts (past travelers)

**Why This Matters**: Memories are intent-driven (you search when you care), not passively pushed.

---

## Hit Modal (Bottom Sheet)

**Triggered From**: Tapping "Hit" button on any post

**Components**:
1. **Header**
   - Drag handle (top)
   - Title: "Connect with [Name]?"
   - Subtitle: "Hitchr is about meaningful connections. How would you like to interact?"

2. **Action Options** (3 large buttons)
   - **Send a message** 💬
     - Opens chat/DM
   
   - **Travel together next time** 🚗
     - Adds to "Interested" connections
   
   - **Just appreciate this journey** ⚡
     - Low-commitment "like" (sends notification)

**Interaction**:
- Tap option → modal closes → shows toast confirmation

**Visual Details**:
- Bottom sheet slides up smoothly
- Options are tactile (large, clear icons)
- Subtitle explains intent (not just buttons)

---

## Visual Identity Rules

### Illustrations
- **Hand-drawn style** (not vector-perfect)
- **Bold outlines** (2-3px stroke weight)
- **Limited color palette** (3-4 colors per illustration)
- **Textured fills** (not flat)

**Where to Use**:
- Empty states ("No trips planned yet" → illustration of road)
- Community icons (custom for each)
- Onboarding screens
- Badge icons

### Photography
- **Street photography aesthetic** (not stock photos)
- **Warm color grading** (slightly yellow/orange tint for day theme)
- **High contrast** (cinematic look for night theme)

**Where to Use**:
- User avatars (use Unsplash portraits)
- Memory post media
- Community cover images

### Typography Hierarchy
- **Headlines**: Bold, large (--font-size-2xl)
- **Section Headers**: Semibold, small caps
- **Body Text**: Regular, readable (--font-size-base)
- **Hinglish Accents**: Display font (Georgia), italic

### Layout Rhythm
- **Generous spacing** (don't cram)
- **Asymmetric grids** (not perfectly aligned)
- **Layered elements** (overlapping cards for depth)

---

## Micro-Interactions Checklist

### Required Animations
- ✅ Route line draws when composing post
- ✅ Pulse ring on live location markers
- ✅ Confetti burst on "Journey Complete"
- ✅ Badge unlock flies in from corner
- ✅ Bottom sheets slide up smoothly
- ✅ Cards scale in on feed scroll
- ✅ "Hit" button pulses when active
- ✅ Tab switch fades between scenarios

### Interaction Feedback
- ✅ Buttons have pressed state (scale down slightly)
- ✅ Success toast messages (green, top-right)
- ✅ Loading states (skeleton screens, not spinners)
- ✅ Error states (friendly, not alarming)

---

## Content & Copy

### Hinglish Microcopy Examples

**Home Feed**:
- Empty state: "Abhi koi nahi, check kar thodi der baad"
- Live badge: "Live hai"
- Planning CTA: "Chal, bro!"
- Discovery: "Raaste pe milenge"

**Journey Composer**:
- Placeholder: "Kaha ja rahe ho?"
- Caption hint: "Vibe kya hai?"
- Post button: "Share kar!"

**While Riding**:
- Safety check: "Sab theek hai?"
- Almost there: "Bas thodi door hai"
- Completion: "Pahunch gaye! 🎉"

**Badges**:
- Campus Hero: "Campus ka Hero"
- Night Owl: "Raat ka Badshah"
- Road King: "Raaste ka Raja"

### When NOT to Use Hinglish
- Error messages (clarity first)
- Safety instructions (serious tone)
- Legal/privacy text (plain English)

---

## Responsive Behavior

### Mobile (default, 375px - 430px)
- Full-screen cards
- Bottom sheet modals
- Thumb-reachable CTAs
- Single-column layouts

### Tablet (if needed, 600px+)
- Show two scenarios side-by-side (feed + map)
- Wider cards (max 600px)

### Desktop (if needed, 1024px+)
- Center app container (max-width: 430px)
- Show shadow/bezel around "phone"
- Optional: show multiple scenarios in tabs

---

## Performance Checklist

- ✅ Animations use `transform` and `opacity` (GPU-accelerated)
- ✅ No expensive repaints (avoid animating width/height)
- ✅ Debounce search input (don't filter on every keystroke)
- ✅ Lazy-load images (only load visible content)
- ✅ Use CSS containment for scrolling lists

---

## Accessibility Checklist

- ✅ All interactive elements have focus states
- ✅ Color contrast meets WCAG AA (4.5:1 for text)
- ✅ Icon buttons have aria-labels
- ✅ Modals have proper ARIA roles
- ✅ Tab navigation works (keyboard users)

---

## Testing Checklist

### Scenario Switching
- ✅ Home → Composer → Home (back button works)
- ✅ Home → Map → Home (bottom nav works)
- ✅ All 6 scenarios accessible via nav/buttons

### Interactions
- ✅ "Hit" button opens modal
- ✅ Search icon opens overlay
- ✅ Journey Composer posts successfully
- ✅ Map toggle switches Map↔List
- ✅ "End Ride" completes journey

### Theme Switching
- ✅ Auto-detects day/night based on time
- ✅ Manual override works (optional feature)
- ✅ All colors update correctly
- ✅ Illustrations adapt to theme (optional: night versions)

### Edge Cases
- ✅ Empty states show helpful messages
- ✅ Long text truncates gracefully
- ✅ No broken images (use Unsplash fallbacks)
- ✅ Works offline (no external API dependencies)

---

## File Structure

### Single HTML File Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hitchr - Social Coordination for Movement</title>
  <style>
    /* 1. CSS Variables (Day Theme) */
    /* 2. CSS Variables (Night Theme) */
    /* 3. Base Styles */
    /* 4. Layout Components */
    /* 5. Feed Components */
    /* 6. Composer Components */
    /* 7. Map Components */
    /* 8. Modals & Overlays */
    /* 9. Animations */
    /* 10. Utility Classes */
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Scenario 1: Home -->
    <!-- Scenario 2: Composer -->
    <!-- Scenario 3: Map -->
    <!-- Scenario 4: Communities -->
    <!-- Scenario 5: Profile -->
    <!-- Scenario 6: Riding -->
  </div>
  
  <script>
    // 1. State Management
    // 2. Theme Detection
    // 3. Scenario Switching
    // 4. Modal Handlers
    // 5. Journey Composer Logic
    // 6. Map Toggle Logic
    // 7. Search Logic
    // 8. Animation Triggers
    // 9. Initialize App
  </script>
</body>
</html>
```

---

## Build Order

### Phase 1: Foundation (30 min)
1. HTML structure (app container, 6 scenarios)
2. CSS variables (day theme)
3. Base styles (typography, spacing, layout)
4. Bottom navigation (working scenario switches)

### Phase 2: Core Scenarios (60 min)
5. Home Feed (header, feed cards, FAB)
6. Journey Composer (type selection, compose form)
7. Map Tab (map view, toggle, list view)

### Phase 3: Supporting Scenarios (30 min)
8. Communities Tab
9. Profile Tab
10. While Riding

### Phase 4: Interactions (30 min)
11. Search Overlay
12. Hit Modal
13. Journey Complete Modal

### Phase 5: Polish (30 min)
14. Night theme CSS variables
15. Theme auto-detection JavaScript
16. Micro-interactions (animations, transitions)
17. Hinglish microcopy updates

### Phase 6: Test (20 min)
18. Test all scenarios
19. Test all interactions
20. Fix any bugs

**Total Time**: ~3 hours

---

## Common Pitfalls to Avoid

### ❌ Don't Do This
- Using real map APIs (keep it illustrated/visual)
- Making it look like a generic startup app
- Using pure English everywhere (needs Hinglish flavor)
- Auto-timer on "While Riding" (manual End Ride button only)
- Showing Memories on Home feed (only in Search/Communities)
- Star ratings (use badges instead)

### ✅ Do This
- Use illustrated map backgrounds (SVG patterns, gradients)
- Add street-culture visual elements (textures, hand-drawn illustrations)
- Sprinkle Hinglish in CTAs and labels
- Manual "End Ride" button for demo control
- Keep Memories in Search results only
- Show badges and journey counts for trust

---

## Reference Files (Already Exist)

Read these for context (don't modify them):
1. `HITCHR_V2_PRODUCT_RATIONALE.md` - WHY decisions were made
2. `hitchr-final-prototype.html` - V1 prototype (use as base, but redesign)
3. `HITCHR_FEED_SPECIFICATION.md` - Feed architecture details
4. `HITCHR_SAFETY_PROTOCOL.md` - Safety feature specs
5. `HITCHR_COMMUNITIES_SPEC.md` - Community structure

---

## Success Criteria

### Visual
- ✅ Feels uniquely Indian (not Western minimal)
- ✅ Street-culture aesthetic (bold, textured, layered)
- ✅ Day/Night themes work seamlessly
- ✅ Illustrations and Hinglish add personality

### Functional
- ✅ All 6 scenarios accessible and working
- ✅ Journey Composer creates posts
- ✅ Map toggle switches Map↔List
- ✅ Search shows Memories (Home doesn't)
- ✅ "Hit" modal offers 3 interaction types
- ✅ "End Ride" manually completes journey

### Emotional
- ✅ Feels warm and human (not sterile)
- ✅ Micro-interactions delight without distracting
- ✅ Trust signals visible (badges, communities)
- ✅ Movement feels social, not transactional

---

## Final Checklist Before Delivery

- ✅ Single HTML file (`hitchr-prototype-v2.html`)
- ✅ Runs offline (no external dependencies)
- ✅ Mobile-responsive (max-width: 430px)
- ✅ Day/Night themes auto-switch based on time
- ✅ All 6 scenarios implemented and accessible
- ✅ Hinglish microcopy in appropriate places
- ✅ Illustrations/visual elements add street-culture vibe
- ✅ No Memories on Home feed (only in Search/Communities)
- ✅ Map List toggle works
- ✅ Manual "End Ride" button (no auto-timer)
- ✅ Smooth animations (60fps)
- ✅ Tested on Chrome/Safari mobile viewports

---

## You're Ready to Build!

**Output**: `hitchr-prototype-v2.html`  
**Time**: ~3 hours  
**Vibe**: Street-smart movement, modern Indian authenticity, Gen Z energy

Let's make Hitchr feel like it was **built for India, by India**.

Good luck! 🚀


