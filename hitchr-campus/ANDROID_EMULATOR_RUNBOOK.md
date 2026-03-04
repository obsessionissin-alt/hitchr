# Android Emulator Runbook & Role Toggle Debugging Guide

## 📱 Step-by-Step Android Emulator Runbook

### Prerequisites Check
```bash
# 1. Verify Flutter is installed
flutter --version

# 2. Verify Android SDK is configured
echo $ANDROID_HOME
# Should output: /home/YOUR_USER/Android/Sdk

# 3. Verify adb can see devices
adb devices
# Should show: List of devices attached (empty is OK if emulator not started)
```

### Step 1: Start MongoDB (Docker)
```bash
# Start MongoDB container
docker run -d --name hitchr-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=hitchr_campus \
  mongo:7

# Verify MongoDB is running
docker ps | grep mongo
# Should show: hitchr-mongo container running

# Test connection (optional)
docker exec -it hitchr-mongo mongosh --eval "db.version()"
```

### Step 2: Start FastAPI Backend
```bash
cd /home/internt-zato/Documents/hitchr/hitchr-campus/backend

# Create/activate virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create .env file if missing
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=hitchr_campus
EOF

# Start backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
# INFO:     Started reloader process
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

**✅ Checkpoint 1: Backend Health**
```bash
# In another terminal, test backend
curl http://localhost:8001/api/
# Should return: {"message": "Hitchr Campus MVP v0 - Travel Together 🚗"}

# Seed test data
curl -X POST http://localhost:8001/api/seed-campus
# Should return: {"message": "Campus seeded successfully"}
```

### Step 3: Start Android Emulator
```bash
# Option A: Start from Android Studio
# 1. Open Android Studio
# 2. Tools → Device Manager
# 3. Click ▶️ (Play) on an AVD (Android Virtual Device)
#    - Recommended: Pixel 5 API 34 (Android 14)
#    - Ensure it has Google Play Services if needed

# Option B: Start from command line (if AVD exists)
emulator -avd Pixel_5_API_34 &
# Replace "Pixel_5_API_34" with your AVD name
# List AVDs: emulator -list-avds

# Wait for emulator to boot (30-60 seconds)
# Check when ready:
adb devices
# Should show: emulator-5554    device
```

**✅ Checkpoint 2: Emulator Connectivity**
```bash
# Test network connectivity from emulator
adb shell ping -c 3 10.0.2.2
# Should show: 3 packets transmitted, 3 received

# Test backend reachability from emulator
adb shell curl http://10.0.2.2:8001/api/
# Should return JSON response (or connection refused if backend not running)
```

### Step 4: Run Flutter App
```bash
cd /home/internt-zato/Documents/hitchr/hitchr-campus/flutter_app

# Get dependencies (first time only)
flutter pub get

# Verify emulator is connected
flutter devices
# Should show: Android SDK built for x86_64 (mobile) • emulator-5554 • android-x86_64

# Run app
flutter run

# Expected flow:
# 1. Building APK (first time: 2-5 minutes)
# 2. Installing on emulator
# 3. Launching app
# 4. App opens to onboarding screen
```

**✅ Checkpoint 3: App Launch**
- App should open on emulator
- Should show onboarding screen (name + college input)
- No red error screens

### Step 5: Test API Connectivity
```bash
# In Flutter app:
# 1. Enter name: "Test User"
# 2. Enter college: "Delhi University"
# 3. Tap "Join"

# Expected:
# - App creates user via POST /api/users
# - Navigates to home screen
# - Shows feed (may be empty if no routes)

# If fails, check backend logs for incoming requests
```

**✅ Checkpoint 4: API Connection**
```bash
# Monitor backend logs for requests
# Should see:
# INFO:     127.0.0.1:XXXXX - "POST /api/users HTTP/1.1" 200 OK
# INFO:     127.0.0.1:XXXXX - "GET /api/routes HTTP/1.1" 200 OK
```

---

## 🔍 Role Toggle Debugging Guide

### Most Likely Failure Reasons (Ranked by Probability)

#### 1. **Backend Unreachable** (80% probability)
**Symptoms:**
- Toggle appears to do nothing
- No error message shown
- UI doesn't update

**Root Causes:**
- Backend not running on port 8001
- Wrong base URL (should be `http://10.0.2.2:8001/api` for emulator)
- Network connectivity issue from emulator to host

**How to Verify:**
```bash
# From host machine
curl http://localhost:8001/api/users/USER_ID
# Should return user JSON

# From emulator (via adb)
adb shell "curl http://10.0.2.2:8001/api/"
# Should return JSON (not connection refused)
```

#### 2. **Exception Swallowed / No Error Handling** (15% probability)
**Symptoms:**
- Toggle appears to work but role doesn't persist
- No visual feedback on failure

**Root Cause:**
Looking at `app_provider.dart:40-53`, the `toggleRole()` method:
- Calls `api.toggleRole()` but doesn't catch exceptions
- Updates local state optimistically before API call completes
- If API fails, local state is wrong but no error shown

**Code Issue:**
```dart
Future<void> toggleRole() async {
  if (state == null) return;
  final newRole = state!.role == 'pilot' ? 'rider' : 'pilot';
  await api.toggleRole(state!.id, newRole);  // ⚠️ No try-catch
  state = HitchrUser(...);  // ⚠️ Updates state even if API fails
}
```

#### 3. **UI Not Rebuilding** (3% probability)
**Symptoms:**
- Backend shows role updated
- API call succeeds
- UI still shows old role

**Root Cause:**
- Riverpod state not triggering rebuild
- Profile screen not watching `userProvider` correctly

**How to Verify:**
- Check `profile_screen.dart:14` - should use `ref.watch(userProvider)`
- Check Flutter logs for state updates

#### 4. **Endpoint Mismatch** (2% probability)
**Symptoms:**
- Backend logs show 404 or 405 errors
- API call fails with "not found"

**Root Cause:**
- URL path mismatch between Flutter and backend
- Query parameter format issue

**Expected:**
- Flutter: `PATCH /users/{userId}/role?role=pilot`
- Backend: `@api_router.patch("/users/{user_id}/role")` expects `role` query param

---

## 🛠️ Concrete Debug Steps

### Step 1: Enable Flutter Debug Logging
```bash
# Run Flutter with verbose logging
flutter run --verbose

# Or enable Dio logging in code (temporary):
# In campus_api.dart, add interceptor:
_dio.interceptors.add(LogInterceptor(
  requestBody: true,
  responseBody: true,
  error: true,
));
```

### Step 2: Check Backend Logs
```bash
# Watch backend logs in real-time
# Should see when toggle is tapped:
# INFO:     10.0.2.2:XXXXX - "PATCH /api/users/USER_ID/role?role=pilot HTTP/1.1" 200 OK
```

**What to Look For:**
- ✅ `200 OK` = API call succeeded
- ❌ `404 Not Found` = User ID wrong or endpoint path mismatch
- ❌ `400 Bad Request` = Invalid role value
- ❌ `Connection refused` = Backend not running or wrong URL
- ❌ `Timeout` = Backend slow or network issue

### Step 3: Verify Role Persisted in Backend
```bash
# Get user ID from app (check SharedPreferences or backend logs)
USER_ID="YOUR_USER_ID_HERE"

# Check current role
curl http://localhost:8001/api/users/$USER_ID | jq '.role'
# Should show: "pilot" or "rider"

# Manually toggle via API
curl -X PATCH "http://localhost:8001/api/users/$USER_ID/role?role=pilot"
# Should return updated user JSON with role: "pilot"

# Verify in MongoDB
docker exec -it hitchr-mongo mongosh hitchr_campus --eval "db.users.findOne({id: '$USER_ID'})"
# Should show role field updated
```

### Step 4: Test API Call Directly from Emulator
```bash
# Get user ID from app logs or backend
USER_ID="YOUR_USER_ID_HERE"

# Test toggle from emulator
adb shell "curl -X PATCH 'http://10.0.2.2:8001/api/users/$USER_ID/role?role=pilot'"

# Expected: JSON response with updated user
# If fails: Backend unreachable from emulator
```

### Step 5: Check Flutter State
```bash
# Add temporary debug print in toggleRole():
# In app_provider.dart, modify toggleRole():
Future<void> toggleRole() async {
  if (state == null) return;
  final newRole = state!.role == 'pilot' ? 'rider' : 'pilot';
  print('🔄 Toggling role: ${state!.role} → $newRole');
  try {
    await api.toggleRole(state!.id, newRole);
    print('✅ API call succeeded');
  } catch (e) {
    print('❌ API call failed: $e');
    return;  // Don't update state on failure
  }
  state = HitchrUser(...);
  print('✅ State updated to: ${state!.role}');
}
```

### Step 6: Monitor Network Traffic
```bash
# Use adb to capture network traffic
adb shell tcpdump -i any -s 0 -w /sdcard/capture.pcap port 8001

# In another terminal, trigger toggle
# Then stop capture and pull file
adb pull /sdcard/capture.pcap .
# Analyze with Wireshark or tcpdump
```

---

## 🎨 UX Feedback Suggestions (No Code Edits)

### Current State Analysis
Looking at `profile_screen.dart:79-111`:
- Toggle buttons have haptic feedback ✅
- Visual state changes (color) ✅
- **Missing:** Loading state, error feedback, success confirmation

### Suggested Improvements

#### 1. **Loading State During Toggle**
**Where:** `profile_screen.dart` role toggle section

**Change:**
- Add `_isToggling` boolean state
- Show loading indicator (CircularProgressIndicator) on active button
- Disable both buttons while toggle is in progress
- Prevent multiple simultaneous toggles

**Visual:**
```
[🔄 Loading...] [Pilot]
```
or
```
[Rider] [⏳ Toggling...]
```

#### 2. **Error Snackbar on Failure**
**Where:** `profile_screen.dart` `onTap` handlers

**Change:**
- Wrap `toggleRole()` call in try-catch
- Show SnackBar with error message on failure
- Include retry button in SnackBar

**Message Examples:**
- "Could not switch role. Check your connection."
- "Failed to update role. Please try again."
- "Network error. Tap to retry."

#### 3. **Success Confirmation**
**Where:** After successful toggle

**Change:**
- Show brief success indicator (checkmark icon or SnackBar)
- Optional: Haptic feedback on success (already has mediumImpact on tap)

**Visual:**
```
✅ Switched to Pilot mode
```

#### 4. **Optimistic Update with Rollback**
**Where:** `app_provider.dart` `toggleRole()`

**Change:**
- Update UI immediately (optimistic)
- If API fails, rollback to previous role
- Show error message explaining rollback

**Flow:**
1. User taps → UI updates immediately
2. API call in background
3. If success → keep new role
4. If failure → revert to old role + show error

#### 5. **Connection Status Indicator**
**Where:** Profile screen header or app bar

**Change:**
- Small indicator showing backend connectivity
- Green dot = connected
- Red dot = disconnected
- Helps user understand if toggle failures are network-related

#### 6. **Retry Mechanism**
**Where:** Error SnackBar

**Change:**
- Add "Retry" action button to error SnackBar
- Automatically retry failed toggle on tap
- Show loading state during retry

---

## 📋 Quick Debug Checklist

When role toggle doesn't work, check in this order:

- [ ] **Backend running?** → `curl http://localhost:8001/api/`
- [ ] **MongoDB running?** → `docker ps | grep mongo`
- [ ] **Emulator connected?** → `adb devices`
- [ ] **Backend reachable from emulator?** → `adb shell curl http://10.0.2.2:8001/api/`
- [ ] **User exists?** → `curl http://localhost:8001/api/users/USER_ID`
- [ ] **API call reaching backend?** → Check backend logs for PATCH request
- [ ] **API call succeeding?** → Check for 200 OK in backend logs
- [ ] **Role persisted?** → Check MongoDB or GET user endpoint
- [ ] **Flutter state updating?** → Check Flutter logs for state changes
- [ ] **UI rebuilding?** → Hot reload and check if UI reflects state

---

## 🔧 Quick Fixes

### Fix 1: Add Error Handling to toggleRole()
**File:** `lib/providers/app_provider.dart`

**Current:**
```dart
Future<void> toggleRole() async {
  if (state == null) return;
  final newRole = state!.role == 'pilot' ? 'rider' : 'pilot';
  await api.toggleRole(state!.id, newRole);
  state = HitchrUser(...);
}
```

**Should be:**
```dart
Future<void> toggleRole() async {
  if (state == null) return;
  final oldRole = state!.role;
  final newRole = oldRole == 'pilot' ? 'rider' : 'pilot';
  try {
    await api.toggleRole(state!.id, newRole);
    state = HitchrUser(...);  // Only update on success
  } catch (e) {
    // State remains unchanged (oldRole)
    rethrow;  // Let UI handle error display
  }
}
```

### Fix 2: Add Error Display in Profile Screen
**File:** `lib/screens/profile/profile_screen.dart`

**In onTap handlers (lines 79-111), wrap toggleRole():**
```dart
onTap: () async {
  if (user.role != 'rider') {
    HapticFeedback.mediumImpact();
    try {
      await ref.read(userProvider.notifier).toggleRole();
      // Optional: Show success snackbar
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to switch role: $e'),
          backgroundColor: HColors.error,
          action: SnackBarAction(
            label: 'Retry',
            onPressed: () async {
              try {
                await ref.read(userProvider.notifier).toggleRole();
              } catch (_) {}
            },
          ),
        ),
      );
    }
  }
},
```

---

## 📊 Expected Behavior Flow

### Successful Toggle:
1. User taps "Pilot" button (currently Rider)
2. Haptic feedback fires
3. API call: `PATCH /api/users/{id}/role?role=pilot`
4. Backend updates MongoDB
5. Backend returns 200 OK with updated user
6. Flutter updates `userProvider` state
7. UI rebuilds showing Pilot as active
8. Composer screen now allows "Live Now" posts

### Failed Toggle (Current):
1. User taps "Pilot" button
2. Haptic feedback fires
3. API call fails (network/backend error)
4. **BUG:** Flutter still updates local state optimistically
5. UI shows Pilot as active (incorrect)
6. Composer allows "Live Now" but backend rejects (role mismatch)
7. No error message shown to user

### Failed Toggle (With Fixes):
1. User taps "Pilot" button
2. Haptic feedback fires
3. Loading indicator shows
4. API call fails
5. State remains as Rider (correct)
6. Error SnackBar appears with retry option
7. User understands what went wrong

---

## 🎯 Testing the Vertical Slice

Once role toggle works, test full flow:

1. **Toggle to Pilot** → Verify UI updates, backend persists
2. **Open Composer** → Should allow "Live Now" mode
3. **Post Route** → Should succeed (role check passes)
4. **Toggle to Rider** → Verify UI updates
5. **Open Composer** → Should show warning, block "Live Now"
6. **View Feed** → Should see routes posted by pilots
7. **Request to Join** → Should create join request
8. **Toggle back to Pilot** → Should see join request in inbox

---

## 📝 Notes

- **Android Emulator IP:** Always use `10.0.2.2` to reach host machine's `localhost`
- **Backend Port:** Must be `8001` (matches Flutter API config)
- **MongoDB:** Must be accessible from backend (localhost:27017)
- **State Management:** Uses Riverpod, ensure `ref.watch()` for reactive updates
- **Error Handling:** Currently minimal - needs improvement for production

---

## 🚨 Common Issues & Solutions

### Issue: "Connection refused" from emulator
**Solution:** 
- Verify backend is bound to `0.0.0.0`, not just `127.0.0.1`
- Check firewall isn't blocking port 8001
- Verify emulator can reach host: `adb shell ping 10.0.2.2`

### Issue: Toggle works but role doesn't persist after app restart
**Solution:**
- Check `restoreSession()` in `app_provider.dart` - should fetch user from backend
- Verify `getUser()` API call returns updated role
- Check SharedPreferences isn't caching old role

### Issue: UI shows wrong role but backend has correct role
**Solution:**
- Force UI refresh: Hot reload or restart app
- Check if `userProvider` is being watched correctly
- Verify state update triggers rebuild

### Issue: Composer still blocks even after switching to Pilot
**Solution:**
- Check `composer_screen.dart:65` - uses `user.role != 'pilot'`
- Verify `userProvider` state is updated before opening composer
- May need to navigate away and back to composer screen

---

**Last Updated:** 2026-02-10
**Flutter App Path:** `/home/internt-zato/Documents/hitchr/hitchr-campus/flutter_app`
**Backend Path:** `/home/internt-zato/Documents/hitchr/hitchr-campus/backend`
