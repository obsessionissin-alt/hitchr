# 🚀 Quick Start - Testing HITCHR

## Setup Steps (One-Time)

### 1. Run Database Migration
```bash
node run-migration.js
```

### 2. Seed Mock Pilots
```bash
node seed-mock-pilots.js
```

### 3. Start Backend
```bash
node server.js
```
Keep this terminal open - server should show:
```
✅ Server running on port 3000
📍 Starting proximity detection service...
```

### 4. Start Frontend (in another terminal)
```bash
npm start
# or
expo start
```

---

## Testing Checklist

### ✅ Authentication
- [ ] Enter any 10-digit phone number
- [ ] Enter OTP: `123456`
- [ ] Should see Map screen after login

### ✅ Home Map Screen
- [ ] Map displays with your location (blue dot)
- [ ] See pilot markers (amber circles P1, P2, etc.)
- [ ] Token balance shows in top-right corner
- [ ] "X Pilots Nearby" card at bottom
- [ ] Can scroll through pilot cards horizontally

### ✅ Pilot Profile Modal
- [ ] Tap pilot marker or card
- [ ] Bottom sheet slides up
- [ ] Shows: avatar, name, rating, distance, stats, badges
- [ ] "🔔 Notify Pilot" button works
- [ ] "View Full Profile" button works

### ✅ Notification Sent Screen
- [ ] After tapping "Notify Pilot", navigates to confirmation screen
- [ ] Shows: bell icon, "Notification Sent!" message
- [ ] Shows pilot name
- [ ] Shows "What happens next?" steps
- [ ] Shows ETA card
- [ ] "Cancel Notification" button works

---

## Troubleshooting

**No pilots showing?**
- Check if `seed-mock-pilots.js` ran successfully
- Verify your location is near Delhi (28.6139, 77.2090)
- Check backend logs for errors

**Map not loading?**
- On Android: May need Google Maps API key
- On iOS: Should work out of the box
- On Web: Use device/emulator instead

**API errors?**
- Verify backend is running on port 3000
- Check `.env` file has correct `DATABASE_URL` and `REDIS_URL`
- Check `EXPO_PUBLIC_API_URL` in frontend `.env`

**Location permission?**
- App will use fallback location if denied
- Check device settings for location permissions

---

## What's Working ✅

1. ✅ Complete authentication flow (Phone → OTP → Login)
2. ✅ Home Map with real-time pilot locations
3. ✅ Pilot Profile Modal (bottom sheet)
4. ✅ Notification Sent screen
5. ✅ Backend API endpoints
6. ✅ Proximity service (running in background)

---

## What's Next (After Testing)

Once you confirm everything works, we'll build:
- Screen 4: Proximity Confirmation
- Screen 5: Full Profile View
- Screen 6: Enhanced User Profile
- Screen 7: Ride Live Tracking
- Screen 8: Ride Complete

---

## Need Help?

Check `TESTING_GUIDE.md` for detailed instructions and API testing examples.
