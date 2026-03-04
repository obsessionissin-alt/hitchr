# Two-User Vertical Slice — Testing Runbook

Complete step-by-step guide to validate the full Hitchr Campus ride flow between two distinct users on physical Android devices (or emulators).

---

## Prerequisites

| What | Details |
|------|---------|
| Backend | Python + FastAPI running at `http://<LAN_IP>:8001` |
| MongoDB | Local or Atlas — connection string in `backend/.env` |
| Flutter | SDK ≥ 3.x, `flutter run` working for target device(s) |
| Devices | Two Android devices/emulators, **or** one device with sign-out between users |

---

## 0. Start Backend & Seed

Before starting tests, ensure MongoDB is running and stays available across restarts:

```bash
docker start hitchr-mongo
# Optional one-time hardening:
docker update --restart unless-stopped hitchr-mongo
```

```bash
cd hitchr-campus/backend
pip install -r requirements.txt        # first time only
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

In a separate terminal, seed the database:

```bash
curl -X POST http://localhost:8001/api/seed-campus
```

Verify it worked:

```bash
curl http://localhost:8001/api/debug/overview
# Should return counts for users, routes, communities, etc.
```

---

## 1. User A — Onboard as Pilot

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Launch Flutter app on Device 1 | Onboarding screen appears |
| 1.2 | Enter name: **"Alice Pilot"**, college: **"Delhi University"** | User created, lands on Home |
| 1.3 | Tap **Profile** tab (bottom nav) | Profile screen with "Alice Pilot" |
| 1.4 | Tap **Pilot** toggle button | Role switches to Pilot (coral color) |
| 1.5 | Tap **Compose** tab | Route composer screen |
| 1.6 | Fill in: Origin: "North Campus", Dest: "CP Metro", Seats: 3 | Form fills correctly |
| 1.7 | Submit route | Route created, visible in Home feed |
| 1.8 | Open **Inbox** tab | "No pending requests" (expected — nobody joined yet) |
| 1.9 | **Tap Sign Out** in Profile | Confirmation dialog appears |
| 1.10 | Confirm Sign Out | Returns to Onboarding screen |

**Debug checkpoint:**
```bash
curl http://localhost:8001/api/debug/overview
# routes should be ≥ 1
```

---

## 2. User B — Onboard as Rider & Request to Join

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Launch app on Device 2 (or same device after sign-out) | Onboarding screen appears |
| 2.2 | Enter name: **"Bob Rider"**, college: **"BITS Pilani"** | User created, lands on Home |
| 2.3 | Verify role is **Rider** (default) | Rider mode shown in profile |
| 2.4 | Scroll Home feed | See Alice's route: "North Campus → CP Metro" |
| 2.5 | Tap Alice's route card | Route Detail screen opens |
| 2.6 | Verify map shows markers (or fallback with labels) | From/To points visible |
| 2.7 | Tap **"Request to Join"** | Snackbar: "Request sent!" |
| 2.8 | Button changes to **"Request Sent"** (disabled) | Cannot re-request |
| 2.9 | **Tap Sign Out** in Profile | Returns to Onboarding |

**Debug checkpoint:**
```bash
# Find Alice's route ID from the routes list
curl http://localhost:8001/api/routes | python3 -m json.tool

# Check join requests for that route
curl http://localhost:8001/api/debug/route/<ROUTE_ID>
# Should show total_join_requests: 1, rider_name: "Bob Rider"
```

---

## 3. User A — Accept Request & Start Ride

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Launch app, enter **"Alice Pilot"** + **"Delhi University"** | Restored as Alice (same user_id) |
| 3.2 | Switch to **Pilot** mode in Profile | Pilot toggle active |
| 3.3 | Open **Inbox** tab | See Bob's request: "Bob Rider — BITS Pilani" |
| 3.4 | Tap ✅ (Accept) on Bob's request | Snackbar: "Bob Rider is joining!" |
| 3.5 | Inbox should clear (no more pending) | Request accepted, ride created |
| 3.6 | Go to **Ride History** in Profile | See new ride: status "waiting" |
| 3.7 | Tap the ride | Riding screen opens |
| 3.8 | Verify map shows pickup/dropoff markers | Both waypoints visible |
| 3.9 | Tap **"Start Journey"** | Status changes to "active" / "In Transit" |

**Debug checkpoint:**
```bash
curl http://localhost:8001/api/debug/user/<ALICE_USER_ID>
# rides_as_pilot: 1, pending_inbox_requests: 0
```

---

## 4. User A — Complete Ride

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | On Riding screen, tap **"Complete Journey"** | Confirmation dialog |
| 4.2 | Confirm | Status changes to "completed" |
| 4.3 | Screen shows "Journey completed!" banner | Green check icon |

---

## 5. User B — View Completed Ride & Contribute

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Sign out Alice, sign in as **"Bob Rider"** + **"BITS Pilani"** | Restored as Bob |
| 5.2 | Go to **Ride History** | See completed ride |
| 5.3 | Tap the ride | Riding screen with "Completed" banner |
| 5.4 | Tap **"Leave a Contribution"** | Complete-ride/contribution screen |
| 5.5 | Enter amount (e.g. ₹50) and submit | Contribution recorded |
| 5.6 | Verify receipt | Contribution status = "paid" |

**Debug checkpoint:**
```bash
curl http://localhost:8001/api/debug/user/<BOB_USER_ID>
# rides_as_rider: 1
```

---

## 6. Final Validation Checklist

Run through 5 times to confirm consistency.

- [ ] User A creates account → sees onboarding
- [ ] User A toggles to Pilot mode
- [ ] User A creates a Live Route (composer)
- [ ] User A signs out successfully (all state cleared)
- [ ] User B creates account
- [ ] User B sees User A's route in Home feed
- [ ] User B requests to join
- [ ] User B signs out
- [ ] User A logs back in
- [ ] User A sees User B's request in Inbox
- [ ] User A accepts the request
- [ ] User A starts the ride
- [ ] User A completes the ride
- [ ] User B logs back in
- [ ] User B sees the completed ride
- [ ] User B submits contribution
- [ ] User B sees receipt/confirmation
- [ ] Map shows on Home with first route's waypoints (or fallback)
- [ ] Map shows on Route Detail with from/to markers
- [ ] Map shows on Riding screen with pickup/dropoff markers

### 5-run validation tracker

- [ ] Run 1/5 complete
- [ ] Run 2/5 complete
- [ ] Run 3/5 complete
- [ ] Run 4/5 complete
- [ ] Run 5/5 complete

---

## Troubleshooting

### Inbox is empty even after join request

1. Check the user is in **Pilot** mode (not Rider)
2. Verify you're signed in as the **correct user** (check Profile → name matches)
3. Check debug logs in Flutter console: look for `[Inbox]` lines
4. Hit the debug endpoint: `curl http://localhost:8001/api/debug/user/<USER_ID>`
5. Compare `pilot_id` on the route with the current user's ID

### Role toggle not working

1. Check Flutter console for `[HTTP →]` and `[HTTP ←]` log lines
2. Verify backend is reachable: `curl http://<BACKEND_IP>:8001/api/health`
3. On physical device, make sure Backend URL is set to your LAN IP (Settings gear in Profile)

### Map not showing

- Without Mapbox token: fallback placeholder with route labels should appear
- With token: check `[MiniMapView]` debug logs in console
- Verify `--dart-define=MAPBOX_ACCESS_TOKEN=pk.xxx` is passed during `flutter run`

### Sign-out doesn't clear state

- Check Flutter console for `[UserNotifier] logout:` and `[resetAllProviders]` lines
- If still seeing stale data, force-close and relaunch the app
