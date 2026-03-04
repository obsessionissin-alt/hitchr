# Campus MVP v0 - Implementation Status

## 🎯 Goal
Build Campus MVP v0 that passes the 10.1 checklist from curr_context.md

## ✅ Backend Status: **COMPLETE**

### What's Been Built:
- ✅ Complete Campus MVP backend (`/app/backend/server.py`)
- ✅ User management with college email/invite code auth
- ✅ Campus verified badges
- ✅ Dual role system (Rider ↔ Pilot toggle)
- ✅ Route posts (Pilot creates A→B journeys)
- ✅ Join request system (Rider → Pilot approval flow)
- ✅ Ride instances with states (Posted → Waiting → Active → Complete)
- ✅ Post-ride contribution (suggested/reduce/custom/waive)
- ✅ Payment simulation with 90% success rate
- ✅ Seed endpoint (`/api/seed-campus`) with sample data

### Backend Endpoints:
```
POST   /api/users - Create user with college email or invite code
GET    /api/users/{user_id} - Get user details
PATCH  /api/users/{user_id}/role - Toggle Rider ↔ Pilot

POST   /api/routes - Create route post (Pilot)
GET    /api/routes - Get all route posts (with filters)
GET    /api/routes/{route_id} - Get route details
GET    /api/routes/pilot/{pilot_id} - Get pilot's routes
PATCH  /api/routes/{route_id}/status - Update route status

POST   /api/join-requests - Create join request (Rider)
GET    /api/join-requests/route/{route_id} - Get requests for route
GET    /api/join-requests/rider/{rider_id} - Get rider's requests
PATCH  /api/join-requests/{request_id}/respond - Accept/Decline

GET    /api/rides/rider/{rider_id} - Get rider's ride instances
GET    /api/rides/pilot/{pilot_id} - Get pilot's ride instances
GET    /api/rides/{ride_id} - Get ride instance details
PATCH  /api/rides/{ride_id}/start - Start ride
PATCH  /api/rides/{ride_id}/complete - Complete ride

POST   /api/contributions - Submit contribution (with payment simulation)

POST   /api/seed-campus - Seed demo data
```

### Test Results:
```bash
✅ Backend starts successfully
✅ Seed data creates 3 users + 2 routes
✅ All endpoints responding
✅ Health check: "Hitchr Campus MVP v0 - Travel Together 🚗"
```

---

## ⚠️ Frontend Status: **NEEDS PROTOTYPE-PARITY UI/UX REBUILD**

### Current State:
The current frontend works functionally but feels too generic/corporate. We need to rebuild the UI/UX to match the final prototype (`hitchr-final-prototype.html`) with a campus-student-first experience:
- Small map preview embedded above the home feed
- Search bar to enter destination and browse route/post tabs: **Nearby / Popular / Saved**
- Minimal, mindful bottom navigation (no clutter)
- Softer, lighter visual system aligned with the prototype palette and typography

### What Needs to Be Built (10.1 Checklist):

#### 🔴 **A) Setup & Run**
- [x] Backend runs with one command
- [x] Seed data works
- [ ] Frontend integrates with campus backend

#### 🔴 **B) Onboarding & Trust**
- [ ] College email OR invite code signup
- [ ] User profile with campus info
- [ ] Campus Verified badge displayed everywhere
- [ ] No heavy KYC

#### 🔴 **C) Rider POV - Discovery**
- [ ] Home/Feed with "Live Now" routes from pilots
- [ ] Pull-to-refresh
- [ ] Show: pilot, A→B or A->C, time, seats, trust signals
- [ ] Filter/search by destination
- [ ] "Coming your way" directional/route matching

#### 🟠 **C2) Rider "Memory Post"**
- [ ] Riders can create a "Memory Post" to share their experience or thoughts after a ride
- [ ] Memory post appears in: (a) post-ride flow, (b) ride history/profile
- [ ] Posts can include: text, emoji, videos, images
- [ ] Optional: restrict to 1 per ride, can edit/delete
- [ ] Pilot and all ride members can view post
> **Note:** Memory Posts will not only appear in the post-ride flow and ride history/profile, but will also be visible in the user's profile page for future reference. These posts are important: they can be surfaced when users browse profiles, search for relevant memories (by post or by place), or interact with the "Popular" feed/section—providing both riders and pilots the opportunity to share their experience and highlight trusted interactions. The same memory post feature applies to pilots as well, ensuring both perspectives are captured and showcased.


#### 🔴 **D) Pilot POV - Create & Manage** ⭐ **KEY DIFFERENCE**
- [ ] **Rider ↔ Pilot toggle** (mode switcher)
- [ ] Create route post form:
  - From (A)
  - To (B)
  - Time window
  - Seats available
  - Optional note
- [ ] See active posts and status

#### 🔴 **E) Join Request & Seat Confirmation** ⭐ **KEY DIFFERENCE**
- [ ] Rider requests to join (not instant join)
- [ ] **Pilot "Requests" inbox** (new screen)
- [ ] Pilot Accept/Decline buttons
- [ ] Rider sees request outcome
- [ ] Seat count updates  

#### 🔴 **F) Ride State**
- [ ] States: Waiting → Active → Complete
- [ ] Pilot: Start Ride / Complete Ride buttons
- [ ] Rider sees state updates (polling every 3-5s)

#### 🔴 **G) Post-Ride Contribution**
- [x] Backend calculates correctly (A→B only)
- [ ] Frontend shows A→B→C explanation
- [ ] Suggest/Lower/Higher/Custom/Waive options
- [ ] Pilot sees contribution status

#### 🔴 **H) Multi-leg UI**
- [ ] Show "Suggested plan: 2 legs" if needed
- [ ] Manual handoff: complete leg 1 → surface leg 2 options

#### 🔴 **I) Real-time Model** *map working*
- [ ] Pull-to-refresh on feed
- [ ] Optional polling on discovery (10-20s)
- [ ] Ride screen polling (3-5s while open)


#### 🔴 **J) Safety**
- [ ] Share ride button
- [ ] SOS/Get help (modal/phone)
- [ ] Report user button
- [ ] Notify your close connections(if needed)button. 
- [ ] Verified bagdes and communities,mutuals, number of connections

#### 🔴 **K) UX 3-second test**
- [ ] Clear value prop on load
- [ ] Safety signals visible
- [ ] Clear CTAs (Join Ride / Post Route)

#### 🔴 **L) Demo Script**
- [ ] 60-90s demo path works end-to-end

---

## 📝 Frontend Architecture Needed

### New Screens Required:

```
/app/frontend/app/
├── index.tsx (Onboarding with college email/invite code)
├── (tabs)/
│   ├── _layout.tsx (Tab navigation)
│   ├── home.tsx (Rider: Feed | Pilot: My Routes) 🔄 Mode-aware
│   ├── requests.tsx (Pilot: Join Requests Inbox) 🆕 NEW
│   ├── rides.tsx (My Active Rides)
│   └── profile.tsx (With Rider ↔ Pilot toggle)
├── create-route.tsx (Pilot: Post new route) 🆕 NEW
├── route/[id].tsx (Route details + Join Request button)
├── ride/[id].tsx (Ride instance with state tracking)
├── complete/[id].tsx (Contribution flow - already exists, needs minor tweaks)
```

### Key Components to Build:

1. **RoleSwitcher** - Toggle between Rider/Pilot modes
2. **RoutePostCard** - Shows pilot's route with seats, time, trust
3. **JoinRequestCard** - For pilot's inbox (Accept/Decline)
4. **CreateRouteForm** - Pilot creates A→B post
5. **RideStateTracker** - Shows Waiting/Active/Complete with actions
6. **ContributionFlow** - A→B→C explanation + payment (mostly exists)

### State Management Updates:

```typescript
// campusStore.ts
interface CampusStore {
  userRole: 'rider' | 'pilot';
  toggleRole: () => void;
  
  // Pilot mode
  myRoutes: RoutePost[];
  joinRequests: JoinRequest[];
  
  // Rider mode
  availableRoutes: RoutePost[];
  myRequests: JoinRequest[];
  
  // Both
  activeRides: RideInstance[];
}
```

---

## 🚀 Next Steps to Complete 10.1 Checklist

### Priority 1: Prototype-Parity Home UX (Highest Impact)
1. Redesign **home feed** to match prototype:
   - Embedded **mini map** preview at top
   - **Search bar** with destination input
   - Tabs: **Nearby / Popular / Saved**
2. Redesign **bottom navigation** to be minimal and intentional
3. Ensure feed cards match prototype layout and density

### Priority 2: Core Dual-Role Experience
4. Role switcher UI component (Rider ↔ Pilot)
5. Home adapts to role:
   - Rider: live routes + plans + memories
   - Pilot: active posts + join requests summary
6. Create live route form (Pilot)
7. Join request flow (Rider → Pilot inbox)

### Priority 3: Ride Flow (Vertical Slice)
8. Pilot requests inbox (Accept/Decline)
9. Ride state tracking (Waiting → Active → Complete)
10. Start/Complete buttons and real-time polling

### Priority 4: Contribution Flow
11. Post-ride contribution screen with A→B→C explanation
12. Suggest/Lower/Higher/Custom/Waive options
13. Receipt & contribution status for Pilot

### Priority 5: Safety + Trust + Test
14. Safety affordances (Share / SOS / Report) *share sos to close connections, that way user might not trust the pilot at moment but the close connections*
15. Campus trust signals (badges, mutuals, communities)
16. End-to-end demo script validation

---

## 🧪 How to Test (Once Frontend is Built)

### Demo Script (60-90s):
```
1. Seed data: curl -X POST http://localhost:8001/api/seed-campus
2. Open app → Onboarding → Enter college email
3. Switch to Pilot mode
4. Create route: Campus Gate → CP Metro, 3 seats
5. Switch to Rider mode (or use second browser/device)
6. See route in feed
7. Request to join
8. Switch back to Pilot
9. Open Requests inbox → Accept request
10. Switch to Rider → See "Waiting" status
11. As Pilot: Start Ride
12. As Rider: See "Active" status
13. As Pilot: Complete Ride
14. As Rider: Contribution screen → Pay/Waive
15. As Pilot: See contribution status
```

---

## 📦 What's Already Reusable

From the existing Hitchr prototype, these can be adapted:

✅ Theme & colors (`/app/frontend/constants/theme.ts`)
✅ Base UI components (cards, buttons, modals)
✅ Complete ride + contribution flow (`/app/frontend/app/complete-ride/[id].tsx`)
✅ API utilities (`/app/frontend/utils/api.ts` - needs update for campus endpoints)
✅ State management pattern (Zustand)

❌ Current feed/ride screens need significant rework for:
- Dual role system
- Join request approval flow
- Pilot-side create/manage UI
- Campus-specific trust signals

---

## 📐 Estimated Work

**Backend:** ✅ Complete (2-3 hours already spent)

**Frontend:** ⚠️ ~6-8 hours needed
- Onboarding with campus auth: 30min
- Role switcher + adapted home: 1hr
- Create route form: 1hr
- Requests inbox (Pilot): 1hr
- Join request flow (Rider): 1hr
- Ride state tracking: 1hr
- Testing & polish: 1-2hr
- Safety features: 30min
- Documentation: 30min

**Total:** 8-11 hours for complete Campus MVP v0

---

## 🎯 Current Blocker

**Need to decide:** Should I:
1. **Continue building the complete Campus MVP frontend now** (6-8 more hours)
2. **Provide detailed build guide + component specs** for you to review first
3. **Build just the critical path** (Pilot create → Rider join → Accept → Ride → Complete) as proof of concept

The backend is fully ready and tested. The frontend rebuild is the remaining work to pass 10.1 checklist.

**Recommendation:** Start with critical path (#3) to validate the flow, then expand to full features.

---

## Backend Test Commands

```bash
# Start fresh
sudo supervisorctl restart backend
sleep 3

# Seed campus data
curl -X POST http://localhost:8001/api/seed-campus

# Create a user
curl -X POST http://localhost:8001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "college": "Delhi University", "email": "test@du.ac.in"}'

# Get routes
curl http://localhost:8001/api/routes

# Create join request (save route_id and user_id from above)
curl -X POST http://localhost:8001/api/join-requests \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": "ROUTE_ID_HERE",
    "rider_id": "USER_ID_HERE",
    "rider_name": "Test User",
    "rider_college": "Delhi University",
    "pickup": {"lat": 28.69, "lng": 77.21, "address": "Campus", "name": "Main Gate"},
    "dropoff": {"lat": 28.61, "lng": 77.20, "address": "CP", "name": "CP Metro"}
  }'

# Pilot accepts request
curl -X PATCH "http://localhost:8001/api/join-requests/REQUEST_ID/respond?action=accept"

# Get ride instance
curl http://localhost:8001/api/rides/RIDE_ID

# Start ride
curl -X PATCH http://localhost:8001/api/rides/RIDE_ID/start

# Complete ride
curl -X PATCH http://localhost:8001/api/rides/RIDE_ID/complete

# Submit contribution
curl -X POST http://localhost:8001/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "RIDE_ID",
    "rider_id": "USER_ID",
    "amount": 40,
    "payment_method": "upi"
  }'
```

All endpoints are working! ✅
