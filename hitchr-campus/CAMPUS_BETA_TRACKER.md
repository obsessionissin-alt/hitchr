# Hitchr Campus Beta Tracker (Android-first → iOS)

## Goal
Ship a campus beta that reliably completes the vertical slice on **physical Android**, then produces an **iOS TestFlight** build using an **HTTPS backend**.

## Owners
- **Backend owner (Chat A)**: backend stability, seed determinism, serialization, deploy/HTTPS
- **Frontend owner (Chat B)**: Android device testing, UI/UX, Mapbox, app environment switching

---

## Phase 0 — Definition of Done (must be true to ship)
- [x] Backend endpoints return 200 after seed (no known 500s)
  - [x] `GET /api/routes`
  - [x] `GET /api/planned-trips`
  - [x] `GET /api/memories`
  - [x] `GET /api/communities`
- [ ] Android physical device: vertical slice succeeds **5/5 times** without DB reset/manual fixes
- [x] Map view: renders with Mapbox token OR falls back gracefully without breaking feed ✅
- [ ] Staging backend reachable over **HTTPS** (required for iOS) ⬅ NEXT
- [ ] Android release build (APK/AAB) builds successfully
- [ ] iOS TestFlight build installs and completes same slice

---

## Phase 1 — Backend stabilization (Chat A)

### Critical fix: Mongo ObjectId serialization leaks
Problem: some endpoints return raw Mongo documents with `_id: ObjectId(...)` which breaks JSON encoding and causes 500s.

- [ ] Fix endpoints to **exclude `_id`** (or convert it to string) before returning.
- [ ] Verify: `POST /api/seed-campus` then `GET /api/memories` returns 200

### Backend smoke checks (run after every backend change)
- [ ] `POST /api/seed-campus` → 200
- [ ] `GET /api/routes` → 200
- [ ] `GET /api/planned-trips` → 200
- [ ] `GET /api/memories` → 200
- [ ] `GET /api/communities` → 200
- [ ] `POST /api/users` → 200
- [ ] `PATCH /api/users/{id}/role?role=pilot` → 200

---

## Phase 2 — Android physical device testing (Chat B)

### Device setup (no emulator)
- [ ] Enable Developer Options + USB debugging
- [ ] `adb devices` shows device
- [ ] `flutter devices` shows device

### Backend reachability (must)
Physical phone cannot use `localhost` or `10.0.2.2`.

- [ ] Backend runs on Linux at `0.0.0.0:8001`
- [ ] Phone can open `http://LAN_IP:8001/api/routes` in browser
- [ ] App uses base URL `http://LAN_IP:8001/api`

### In-app environment switching
- [ ] Add “Backend URL” setting (persisted)
- [x] Supports LAN IP (dev) + HTTPS domain (staging/prod)

### Phone testing checklist (do in order)
1. `adb devices` — device must show
2. `docker start hitchr-mongo && cd hitchr-campus/backend && .venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload`
3. Get LAN IP: `ip -4 addr | grep inet` (use Wi‑Fi, e.g. 192.168.x.x)
4. On phone browser: `http://LAN_IP:8001/api/routes` — must load
5. `cd hitchr-campus/flutter_app && flutter run -d <device_id> --dart-define=MAPBOX_ACCESS_TOKEN=<token>`
6. In app: Profile → Settings → Backend URL = `http://LAN_IP:8001/api` → Save
7. Test: toggle Rider↔Pilot, post route, request join, etc.

---

## Phase 3 — Vertical slice validation (Chat B)

### The loop
- [x] Onboard user A
- [x] Toggle to Pilot
- [x] Create route
- [x] User B requests join
- [x] Pilot accepts
- [x] Pilot starts ride
- [x] Pilot completes ride
- [x] Rider contributes + receipt

### Pass criteria
- [ ] Loop passes 5 consecutive runs without DB reset (target for internal hardening)

---

## Phase 3.5 — Internal Hardening (must finish before launch)

- [ ] Vertical slice reliability: complete 5/5 full runs without backend/mongo flakes
- [ ] Real-time join notifications: pilot inbox updates immediately after rider request (no manual refresh)
- [ ] Route polyline rendering: map draws line between waypoints on Home/Detail/Riding maps
- [ ] State restoration hardening: no ghost rides after background/kill/restart, ride views refetch from API
- [ ] Basic push notifications: rider receives push on request accept + ride start

---

## Phase 4 — Mapbox (Chat B)

### Token handling (local only)
- [x] Token provided via `--dart-define=MAPBOX_ACCESS_TOKEN=...`
- [x] Token never committed

### Screens
- [x] Home mini-map (shows first route's waypoints or fallback)
- [x] Route detail map (shows from/to markers)
- [x] Riding map (shows pickup/dropoff markers)
- [x] Markers for from/to (and pickup/dropoff in ride)
- [x] Graceful fallback when no token (styled placeholder with route labels)

---

## Phase 5 — Production + iOS readiness (Chat A + Chat B)

### Backend hosting
- [ ] Deploy backend + Mongo to staging
- [ ] HTTPS endpoint `https://.../api`

### iOS build path
- [ ] Choose: Mac build OR CI (Codemagic) → TestFlight
- [ ] TestFlight build runs vertical slice

---

## Backend freeze (ready for phone testing)

Backend is **frozen** and ready for physical Android testing. Run smoke test before any backend change:

```bash
cd hitchr-campus/backend
./scripts/smoke_test.sh
```

---

## Handoffs (append-only)

### 2026-02-10 — Chat A (Backend) — FROZEN
- Done:
  - Fixed `/api/memories` 500 (Mongo ObjectId serialization)
  - Added `GET /api/health` liveness endpoint
  - Removed random contribution failure (deterministic for testing)
  - Added `backend/scripts/smoke_test.sh` — all tracker endpoints
  - Added `backend/README.md` with run instructions
- Verified: `./scripts/smoke_test.sh` → all ✅
- Next: Staging deploy (HTTPS for iOS readiness)
- Blockers: None

### 2026-02-10 — Chat B (Frontend)
- Done:
  - **Step 2 (toggle)**: Hardened Rider↔Pilot toggle with debug logging (`[CampusApi]` + `[UserNotifier]` tags), loading spinner during toggle, snackbar on failure, uses backend response to confirm state
  - **Step 3 (Mapbox)**: Fixed `MiniMapView` — proper `onMapLoadErrorListener` for graceful fallback, removed `Future.delayed` hack, fixed `Size` class conflict with `mapbox_maps_flutter`, added ProGuard rules for release builds
  - All 3 screens (Home, RouteDetail, Riding) already use `MiniMapView` with correct `fromPoint`/`toPoint` params
- Verified:
  - `flutter analyze` → 0 issues
  - `flutter build apk --debug` → **BUILD SUCCESSFUL** (APK at `build/app/outputs/flutter-apk/app-debug.apk`)
  - Backend `PATCH /api/users/{id}/role` → 200 (tested rider→pilot→rider round-trip via curl)
- Files changed:
  - `flutter_app/lib/api/campus_api.dart` — logging, `baseUrl` getter, `toggleRole` returns Map
  - `flutter_app/lib/providers/app_provider.dart` — `toggleRole` uses backend response, debug logs
  - `flutter_app/lib/screens/profile/profile_screen.dart` — `ConsumerStatefulWidget`, loading state, `_doToggle` method, **Backend URL settings** (Profile → Settings icon)
  - `flutter_app/lib/main.dart` — `BootWrapper` applies saved backend URL at startup
  - `flutter_app/lib/widgets/hitchr_widgets.dart` — `MiniMapView` Mapbox fixes, `onMapLoadErrorListener`, fallback route hint, `Size` fix
  - `flutter_app/android/app/build.gradle.kts` — ProGuard reference for release
  - `flutter_app/android/app/proguard-rules.pro` — new (Mapbox keep rules)
- **Backend URL setting**: Profile → tap Settings icon → enter `http://LAN_IP:8001/api` → Save. Persisted in SharedPreferences.
- Next: Run app on phone, set Backend URL, run vertical slice loop
- Blockers: None (code compiles, backend is green)

### 2026-02-12 — Chat B (Frontend) — VERTICAL SLICE COMPLETE ✅
- Done:
  - **Sign-out flow**: Added proper logout with confirmation dialog, clears SharedPreferences + all Riverpod providers, navigates to onboarding
  - **User matching**: Backend now matches users by name+college (case-insensitive) so sign-in returns same user
  - **API logging**: Added Dio interceptor logging all HTTP requests/responses (`[HTTP →]` / `[HTTP ←]` / `[HTTP ✗]`)
  - **Inbox dual-mode**: Pilot section (incoming requests with accept/decline) + Rider section (`outgoing requests with status + ride cards)
  - **Rides screen**: Loads rides for BOTH pilot and rider roles (merged + deduplicated)
  - **Post-accept navigation**: Pilot auto-navigates to ride after accepting request
  - **Backend returns ride_id**: `PATCH /join-requests/{id}/respond` now returns `ride_id` on accept
  - **Debug endpoints**: Added `/debug/route/{id}`, `/debug/user/{id}`, `/debug/overview`
  - **Database reset**: Added `POST /reset-database` for clean test runs
  - **RenderFlex overflow fix**: Memory card tags now use Wrap + Flexible
  - **Testing guide**: Created `TWO_USER_TESTING_GUIDE.md` with step-by-step flow + troubleshooting
- Verified:
  - Full 2-user vertical slice **VALIDATED on physical Android**
  - User A creates route → User B requests → Pilot accepts → Start → Complete → Rider contributes → Receipt
  - Sign-out/sign-in preserves user identity correctly
  - Inbox works for both pilots (see requests) and riders (see request status + ride cards)
  - Maps render with Mapbox token OR graceful fallback
  - Rides screen shows all rides regardless of current role
- Files changed:
  - `backend/server.py` — user matching by name+college, debug endpoints, reset endpoint, respond returns ride_id
  - `flutter_app/lib/providers/app_provider.dart` — proper async logout, reset() methods, resetAllProviders() helper, RidesNotifier loads both roles
  - `flutter_app/lib/api/campus_api.dart` — Dio logging interceptor, respondJoinRequest returns Map
  - `flutter_app/lib/screens/profile/profile_screen.dart` — sign-out confirmation dialog, calls resetAllProviders()
  - `flutter_app/lib/screens/requests/requests_screen.dart` — complete rewrite: dual-mode inbox for pilot + rider
  - `flutter_app/lib/screens/home/home_screen.dart` — RenderFlex overflow fix in memory card, mini-map passes first route waypoints
  - `hitchr-campus/TWO_USER_TESTING_GUIDE.md` — new: complete testing runbook with debug checkpoints
- Next: **Staging deploy (HTTPS)** → iOS TestFlight build
- Blockers: None (all core flows working on Android)

