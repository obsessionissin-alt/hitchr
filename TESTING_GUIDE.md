# 🧪 HITCHR Testing Guide

## Prerequisites

1. **Backend running** on port 3000 (or configured port)
2. **PostgreSQL** with PostGIS extension enabled
3. **Redis** running (for OTP storage)
4. **Frontend** running via Expo

---

## Step 1: Run Database Migration

First, add the missing columns to `active_notifications` table:

```bash
node run-migration.js
```

Expected output:
```
🔄 Running migration: Add rider_location and expires_at to active_notifications...
✅ Added rider_location column
✅ Added expires_at column
✅ Created spatial index for rider_location
✅ Created index for expires_at
✅ Migration completed successfully!
```

---

## Step 2: Seed Mock Pilots

Create test pilots with locations:

```bash
node seed-mock-pilots.js
```

Expected output:
```
🌱 Starting to seed mock pilots...
✅ Created new pilot: Rohit Kumar
   📍 Location set: 28.6139, 77.2090
✅ Created new pilot: Priya Sharma
   📍 Location set: 28.6140, 77.2095
...
✅ Successfully seeded mock pilots!
```

---

## Step 3: Start Backend Server

```bash
node server.js
```

Expected output:
```
🚀 Starting HITCH Backend...
📦 Connecting to Redis...
🔌 Initializing Socket.io...
📍 Starting proximity detection service...
✅ Server running on port 3000
```

---

## Step 4: Start Frontend (Expo)

```bash
npm start
# or
expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

---

## Testing Flow

### 1. Authentication ✅
- [ ] Enter phone number (any 10 digits)
- [ ] Enter OTP: `123456`
- [ ] Should login successfully and see Map screen

### 2. Home Map Screen ✅
- [ ] Map should display with your location (blue dot)
- [ ] Should see pilot markers (amber circles with P1, P2, etc.)
- [ ] Token balance should show in top-right
- [ ] Search bar should show "🏁 Where are you going?"
- [ ] Should see "X Pilots Nearby" card at bottom
- [ ] Horizontal scrollable pilot list should work

### 3. Pilot Profile Modal ✅
- [ ] Tap on a pilot marker or pilot card
- [ ] Bottom sheet should slide up
- [ ] Should see:
  - Pilot avatar (initial)
  - Name and vehicle info
  - Rating
  - Distance indicator
  - Stats grid (Rides, Rating, KM, Tokens)
  - Badges row
  - "🔔 Notify Pilot" button
  - "View Full Profile" button

### 4. Notification Flow ✅
- [ ] Tap "🔔 Notify Pilot" button
- [ ] Should navigate to "Notification Sent" screen
- [ ] Should see:
  - Large bell icon
  - "Notification Sent!" heading
  - Pilot name in subtitle
  - Voice alert card
  - "What happens next?" info card
  - ETA card showing "2 mins"
  - Map preview placeholder
  - "Cancel Notification" button

---

## Common Issues & Fixes

### Issue: "Cannot find module './config/database'"
**Fix:** Check if `database.js` is in root or `config/` folder. Update require path accordingly.

### Issue: "PostGIS extension not found"
**Fix:** Install PostGIS extension:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: "No pilots showing on map"
**Fix:** 
1. Check if seed script ran successfully
2. Verify pilots are within 5km radius of your location
3. Check backend logs for errors

### Issue: "Map not rendering"
**Fix:**
- On iOS: Maps should work out of the box
- On Android: You may need Google Maps API key (add to `app.json`)
- On Web: Maps may not work, use device/emulator

### Issue: "Location permission denied"
**Fix:**
- iOS: Check Info.plist permissions
- Android: Check AndroidManifest.xml permissions
- Or use fallback location (Aligarh coordinates)

---

## API Testing (Optional)

### Test Nearby Pilots Endpoint:
```bash
curl -X GET "http://localhost:3000/api/v1/nearby/pilots?lat=28.6139&lng=77.2090&radius=5000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Notify Ride Endpoint:
```bash
curl -X POST "http://localhost:3000/api/v1/rides/notify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pilotId": "PILOT_UUID",
    "origin": { "lat": 28.6139, "lng": 77.2090 },
    "destination": { "lat": 28.6140, "lng": 77.2095 }
  }'
```

---

## Next Steps After Testing

Once testing is complete, we'll build:
- Screen 4: Proximity Confirmation
- Screen 5: Full Profile View  
- Screen 6: Enhanced User Profile
- Screen 7: Ride Live Tracking
- Screen 8: Ride Complete

---

## Notes

- **OTP**: Always use `123456` in development
- **Mock Data**: Pilots are seeded around Delhi (28.6139, 77.2090)
- **Location**: If permission denied, app uses fallback location
- **Tokens**: Using dummy "HITCHR tokens" for now
