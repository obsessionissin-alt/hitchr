# Hitchr V2 Prototype - Usage Guide

## How to Run the Prototype

### Method 1: Local Server (Recommended)
```bash
cd /home/internt-zato/Documents/hitchr
python3 -m http.server 8080
```
Then open: **http://localhost:8080/hitchr-prototype-v2.html**

### Method 2: Direct File
Open `hitchr-prototype-v2.html` directly in your browser.

---

## What's Included in V2

✅ **6 Interactive Scenarios**:
1. **Home Feed** - Browse live movement & planned trips (no memories on Home!)
2. **Journey Composer** - Choose journey type (Live/Planned/Memory)
3. **Map Tab** - Toggle between Map view & List view
4. **Communities** - Location + Interest-based communities
5. **Profile** - User stats, badges, journey history
6. **While Riding** - Active journey tracking with manual "End Ride"

✅ **Features**:
- Day/Night theme auto-switching (based on system time)
- Hinglish microcopy ("Chal, bro!", "Pahunch gaye!", etc.)
- Map/List toggle in Map tab
- Route-first content creation
- Hit modal with meaningful interaction options
- Journey Complete celebration modal
- Search overlay (Memories only in Search, not Home)
- Smooth micro-interactions & animations

---

## How to Navigate

### Bottom Navigation
- **Home** - Main feed (Live Now + Trips Being Planned)
- **Communities** - Your communities + Discover new ones
- **[+] Composer** (center button) - Create new journey post
- **Map** - Visual/List view of live movement
- **Profile** - Your stats, badges, journey history

### Special Scenarios
- **While Riding**: Click the Live Map preview on Home → tap a live user card → simulate starting a journey
  - Or manually call `switchScenario('riding')` in browser console
  - Then tap **"Pahunch gaye! End Ride"** to complete

### Interactive Elements
- **Search icon** (top-right on Home) → Opens Search overlay
- **Hit button** on posts → Opens connection modal
- **Map/List toggle** (Map tab header) → Switch views
- **Journey Type cards** (Composer) → Select Live/Planned/Memory

---

## Theme Switching

The prototype auto-detects your system time:
- **6 AM - 6 PM** = Day theme (warm, airy, pastels)
- **6 PM - 6 AM** = Night theme (dark, neon accents)

To manually test themes, run in browser console:
```javascript
// Switch to night theme
document.documentElement.setAttribute('data-theme', 'night');

// Switch to day theme
document.documentElement.setAttribute('data-theme', 'day');
```

---

## Key Differences from V1

### Removed
- ❌ Memories section on Home feed
- ❌ Auto-timer on "End Ride"
- ❌ Generic startup UI

### Added
- ✅ Map/List toggle in Map tab
- ✅ Hinglish microcopy throughout
- ✅ Day/Night dual themes
- ✅ Journey Complete modal
- ✅ While Riding scenario
- ✅ More polished Communities & Profile
- ✅ Street-culture-inspired color palette

### Improved
- ✨ Stronger section headers on feed
- ✨ Route-first visual emphasis
- ✨ Better badge visibility
- ✨ Manual "End Ride" control for demos

---

## Content Structure (As Per Product Rationale)

### Home Feed Shows:
- **Live Now** section → People currently moving
- **Trips Being Planned** section → Future trips with open slots
- **NO Memories** → Keeps it grounded, not Instagram-like

### Search Shows:
- Places, People, Communities
- **Live posts** matching search
- **Planned trips** matching search
- **Memory posts** matching search ← This is where Memories appear!

### Communities Show:
- Your location communities (DU, BITS, etc.)
- Your interest communities (Spiti, Goa, etc.)
- Upcoming trip clusters
- **Memory posts** from community members

---

## Hinglish Elements (Examples)

| English | Hinglish Used |
|---------|---------------|
| Live Now | "Live hai" |
| Planned Trips | "Plan hai" |
| Let's go! | "Chal, bro!" |
| Journey Complete! | "Pahunch gaye!" |
| Are you safe? | "Sab theek hai?" |
| Almost there | "Bas thodi door hai" |
| Campus Hero | "Campus ka Hero" |
| Night Owl | "Raat ka Badshah" |
| See you on the road | "Raaste pe milenge" |

---

## Micro-Interactions Implemented

- ✨ Pulse animations on live location markers
- ✨ Scale-in animations on feed cards
- ✨ Smooth slide-up modals
- ✨ Gradient route lines (coral → blue)
- ✨ Hover effects on cards & buttons
- ✨ Active state animations
- ✨ Confetti celebration on Journey Complete

---

## Testing Checklist

### Scenario Navigation
- [ ] Home → Composer → Home (works via bottom nav)
- [ ] Home → Map → Toggle List view → Toggle back to Map
- [ ] Home → Communities → Browse communities
- [ ] Home → Profile → View badges & history
- [ ] Map (any scenario) → Click "End Ride" → See celebration modal

### Interactions
- [ ] Tap Search icon → Search overlay opens
- [ ] Tap "Hit" button → Hit modal opens with 3 options
- [ ] Tap Journey Type in Composer → Alert shows (full form pending)
- [ ] Tap Map/List toggle → Views switch correctly
- [ ] Tap "Pahunch gaye! End Ride" → Journey Complete modal shows

### Theme
- [ ] Check time-based theme (day/night)
- [ ] Manually switch themes via console
- [ ] Verify all colors update correctly

---

## What's Pending (Future Enhancements)

These are NOT in V2 but can be added:

1. **Full Composer Form** - Currently just type selection, needs route inputs, caption, media
2. **Live Route Animation** - Animated drawing of route lines
3. **Actual Search Functionality** - Currently just shows static results
4. **Real Map Integration** - Currently illustrated/visual map
5. **Profile Editing** - Currently view-only
6. **Community Pages** - Click to see trip clusters & member posts
7. **Notification System** - Badge has icon, no functionality yet

---

## Troubleshooting

**Q: Theme not switching automatically?**  
A: Refresh the page at 6 AM or 6 PM, or manually set via console.

**Q: Can't access While Riding scenario?**  
A: Run in console: `switchScenario('riding')`

**Q: Map/List toggle not working?**  
A: Make sure you're on the Map tab first (4th tab in bottom nav).

**Q: Want to see Memories?**  
A: Click Search icon → Search shows memory posts. They're NOT on Home feed by design.

---

## Next Steps for MVP Development

When you're ready to build the real MVP:

1. **Review V2 Prototype** → Confirm flows, UI, interactions
2. **Read Product Rationale Doc** → Understand WHY decisions were made
3. **Follow Builder Playbook** → Technical specs for implementation
4. **Use V2 as Design Reference** → Colors, spacing, components
5. **Integrate Backend** → Real data, auth, maps API, notifications
6. **Add Real Journey Composer** → Full form with route picker
7. **Implement Safety Features** → Live location sharing, SOS, check-ins
8. **Build Communities Logic** → Auto-suggest, trip clusters, feeds
9. **Add Gamification** → Badge unlocking, reputation scoring
10. **Polish & Test** → Emotional design, micro-interactions, performance

---

**Hitchr V2 is ready to demo!** 🚀

Show it to potential users, investors, or your team to validate the product vision before building the full MVP.


