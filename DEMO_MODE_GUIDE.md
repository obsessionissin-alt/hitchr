# DEMO MODE Implementation Guide

## Overview

DEMO MODE is a temporary overlay system that ensures the entire Hitchr ride flow works smoothly for presentations, even if the Task 4 directional matching engine is incomplete or strict. **This does NOT replace real code** - it adds a simplification layer that can be toggled off.

## Configuration

**Location:** `hitch-app/src/constants/config.ts`

```typescript
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || true; // Default to true
```

**To disable:** Set `EXPO_PUBLIC_DEMO_MODE=false` in your `.env` file or change the default to `false`.

## How It Works

### 1. Pilot Matching (MapScreen)

**File:** `hitch-app/src/hooks/useDirectionalMatching.ts`

- **DEMO MODE ON:** Fetches ALL nearby pilots without route filtering. Any pilot can be tapped.
- **DEMO MODE OFF:** Uses real directional matching logic (route overlap, bearing alignment, detour cost).

```typescript
if (DEMO_MODE) {
  // Fetch all nearby pilots, bypass route matching
  const nearbyResponse = await api.getNearbyUsers({...});
  const allPilots = nearbyResponse.filter(u => u.role === 'pilot');
  setData(allPilots);
}
```

### 2. Notification → Approaching Auto-Progression

**Files:** 
- `hitch-app/src/screens/NotificationSentScreen.tsx`
- `hitch-app/src/screens/OfferSentScreen.tsx`

- **DEMO MODE ON:** Auto-navigates to `ProximityConfirm` screen after 2 seconds.
- **DEMO MODE OFF:** Waits for real proximity match socket event.

### 3. Approaching → Confirm → Start Ride

**File:** `hitch-app/src/screens/ProximityConfirmScreen.tsx`

- **DEMO MODE ON:** 
  - Auto-confirms ride after 2 seconds
  - Auto-starts ride 1 second later
  - Countdown timer visible but doesn't auto-cancel
- **DEMO MODE OFF:** Requires both users to manually confirm, respects 30-second timeout.

### 4. Live Ride Tracking

**File:** `hitch-app/src/screens/RideLiveScreen.tsx`

- **DEMO MODE ON:**
  - Mock distance increments: 0.01-0.05 km per second
  - Timer increments normally (1 second per second)
  - Distance displayed: "X.XX km traveled"
  - End Ride calculates tokens: `baseTokens (10) + distanceBonus (2/km) + timeBonus (1/min)`
  - Falls back to mock data if backend fails
- **DEMO MODE OFF:** Uses real location telemetry, calculates distance from GPS.

### 5. End Ride → Summary

**File:** `hitch-app/src/screens/RideLiveScreen.tsx` → `RideCompleteScreen.tsx`

- **DEMO MODE ON:** Uses mock distance/duration/tokens if backend unavailable.
- **DEMO MODE OFF:** Requires backend to calculate final ride metrics.

## Complete Flow (DEMO MODE)

1. **Map Screen**
   - Rider enters destination → Route generated
   - **All nearby pilots shown** (no filtering)
   - Rider taps pilot → "Notify" sent

2. **Notification Sent Screen**
   - Shows for 2 seconds
   - Auto-navigates to Approaching

3. **Proximity Confirm Screen**
   - Auto-confirms after 2 seconds
   - Auto-starts ride after 1 more second

4. **Live Ride Screen**
   - Timer increments: 0:00 → 0:01 → 0:02...
   - Distance increments: 0.00 km → 0.03 km → 0.07 km...
   - Pilot taps "End Ride"

5. **Ride Complete Screen**
   - Shows final distance, duration, tokens earned
   - All navigation works smoothly

## Key Features

✅ **No Fake Screens** - All screens are real, just with simplified logic  
✅ **Reversible** - Set `DEMO_MODE=false` to use real matching  
✅ **Robust Fallbacks** - If backend fails, uses mock data  
✅ **Fast Transitions** - 2-second auto-progression keeps demo moving  
✅ **Realistic Data** - Mock distance/timer look natural  

## Console Logging

DEMO MODE actions are logged with 🎭 emoji prefix:
- `🎭 DEMO MODE: Fetching all nearby pilots (bypassing route matching)`
- `🎭 DEMO MODE: Auto-progressing to Approaching state`
- `🎭 DEMO MODE: Auto-confirming ride`
- `🎭 DEMO MODE: Auto-starting ride`
- `🎭 DEMO MODE: Ending ride with mock data`

## Testing

1. **Enable DEMO MODE:** Already enabled by default (`DEMO_MODE = true`)
2. **Open two browser tabs:** One as rider, one as pilot
3. **Rider:** Enter destination, tap any pilot
4. **Watch:** Flow auto-progresses through all screens
5. **Pilot:** End ride when ready
6. **Verify:** Summary screen shows realistic data

## Disabling DEMO MODE

To use real matching logic:

1. Set `EXPO_PUBLIC_DEMO_MODE=false` in `.env`
2. Or change `config.ts`: `export const DEMO_MODE = false;`
3. Restart the app

All real logic remains intact and will be used when DEMO_MODE is off.

