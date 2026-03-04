# HITCH - Complete Production Development Specification

## Executive Summary

This document provides the complete technical specification for building HITCH as a production-ready mobile application with 13 fully functional screens. The focus is on creating a bidirectional, dual-role platform where users can simultaneously be both riders and pilots, with real-time proximity matching, token economics, and comprehensive gamification.

---

## 1. Core Architecture Philosophy

### 1.1 Dual-Role Foundation
The entire application is built around the principle that **users are not locked into a single role**. Every architectural decision must support:
- Simultaneous availability as both pilot and rider
- Seamless role switching without data loss
- Unified profile system with role-specific attributes
- Single user_locations table tracking all users regardless of active role
- Backend queries that filter by availability flags, not role enums

### 1.2 State Management Strategy
Use a centralized state management approach where:
- **AuthContext**: Manages authentication state, JWT tokens, and user session
- **UserContext**: Holds complete user profile including both role states, stats, and badges
- **RideContext**: Tracks current active ride, ride history, and ride-related state
- **SocketContext**: Manages WebSocket connection, reconnection logic, and event distribution
- **MapContext**: Handles map state, nearby users (both pilots and riders), filters, and user location

All contexts must persist critical data to AsyncStorage and rehydrate on app launch.

### 1.3 Real-Time Communication Model
Socket.io handles all real-time events with these principles:
- User connects once on app launch, authenticates with JWT
- Location updates broadcast based on availability states (pilot: every 3s, rider: every 10s)
- Ride state changes emit to specific ride rooms (both participants)
- Proximity detection runs server-side every 2 seconds
- Client handles socket disconnection gracefully with exponential backoff reconnection

---

## 2. Database Schema Design

### 2.1 Users Table (Core Entity)
```
users:
- id (UUID, primary key)
- phone (VARCHAR, unique, indexed)
- name (VARCHAR)
- email (VARCHAR, optional)
- avatar_url (TEXT, nullable)
- kyc_status (ENUM: pending, verified, rejected)
- is_pilot_available (BOOLEAN, default false) ← CRITICAL
- is_rider_available (BOOLEAN, default false) ← CRITICAL
- pilot_vehicle_type (VARCHAR, nullable)
- pilot_plate_number (VARCHAR, nullable)
- token_balance (INTEGER, default 0)
- total_rides_as_pilot (INTEGER, default 0)
- total_rides_as_rider (INTEGER, default 0)
- total_km (DECIMAL, default 0)
- rating (DECIMAL, default 0)
- rating_count (INTEGER, default 0)
- streak_days (INTEGER, default 0)
- last_ride_date (DATE, nullable)
- fcm_token (TEXT, for push notifications)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

INDEXES:
- phone (unique)
- is_pilot_available + is_rider_available (composite for filtering)
```

**Why this design**: Eliminates forced role selection. Both availability flags can be true simultaneously. Stats are tracked separately per role but accumulated in a single profile.

### 2.2 User Locations Table (Real-Time Tracking)
```
user_locations:
- user_id (UUID, FK to users, primary key)
- location (GEOGRAPHY POINT, PostGIS type)
- heading (DECIMAL, direction in degrees)
- speed (DECIMAL, km/h)
- is_pilot_available (BOOLEAN, denormalized from users)
- is_rider_available (BOOLEAN, denormalized from users)
- last_updated (TIMESTAMP)

INDEXES:
- GIST index on location for ST_DWithin queries
- Composite index on (is_pilot_available, is_rider_available, last_updated)
```

**Why this design**: Separate table optimized for high-frequency updates. PostGIS enables efficient proximity queries. Denormalized availability flags allow filtering without joins.

### 2.3 Rides Table (Transaction Log)
```
rides:
- id (UUID, primary key)
- rider_id (UUID, FK to users)
- pilot_id (UUID, FK to users)
- origin (GEOGRAPHY POINT)
- origin_address (TEXT, reverse geocoded)
- destination (GEOGRAPHY POINT)
- destination_address (TEXT)
- distance_meters (INTEGER, calculated on completion)
- status (ENUM: notified, offered, pending_confirm, confirmed, active, completed, cancelled)
- initiated_by (ENUM: rider, pilot) ← Track who started
- tokens_awarded_to_rider (INTEGER)
- tokens_awarded_to_pilot (INTEGER)
- ride_hash (VARCHAR, for fraud detection)
- rider_confirmed_at (TIMESTAMP, nullable)
- pilot_confirmed_at (TIMESTAMP, nullable)
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
- created_at (TIMESTAMP)

INDEXES:
- rider_id (for history queries)
- pilot_id (for history queries)
- status (for active ride queries)
- created_at (for recent rides)
```

**Why this design**: Status enum covers both flows (rider→pilot and pilot→rider). Separate confirmation timestamps enable "waiting for other person" state. Token amounts tracked separately for each participant.

### 2.4 Active Notifications Table (Temporary State)
```
active_notifications:
- id (UUID, primary key)
- ride_id (UUID, FK to rides)
- initiator_id (UUID, FK to users)
- recipient_id (UUID, FK to users)
- initiator_location (GEOGRAPHY POINT)
- notification_type (ENUM: notify_pilot, offer_ride)
- status (ENUM: pending, proximity_detected, expired)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)

INDEXES:
- status + expires_at (for cleanup queries)
- ride_id (for lookup)
```

**Why this design**: Temporary table for proximity detection process. Cleaned up after ride confirmed or expires. Enables server-side proximity checking without polling rides table.

### 2.5 Token Transactions Table (Audit Trail)
```
tokens:
- id (UUID, primary key)
- user_id (UUID, FK to users)
- amount (INTEGER, can be negative)
- type (ENUM: earn, spend, bonus, refund)
- category (VARCHAR: ride, distance_bonus, streak, plate, redemption)
- source (TEXT, description)
- ride_id (UUID, FK to rides, nullable)
- metadata (JSONB, for additional context)
- created_at (TIMESTAMP)

INDEXES:
- user_id + created_at (for transaction history)
- category (for analytics)
```

### 2.6 Telemetry Table (Fraud Detection)
```
telemetry:
- id (UUID, primary key)
- ride_id (UUID, FK to rides)
- user_id (UUID, who sent this point)
- location (GEOGRAPHY POINT)
- accuracy (DECIMAL, GPS accuracy in meters)
- speed (DECIMAL, km/h)
- heading (DECIMAL, degrees)
- recorded_at (TIMESTAMP, client timestamp)
- received_at (TIMESTAMP, server timestamp)

INDEXES:
- ride_id + recorded_at (for verification queries)
- Partition by ride_id for performance
```

**Why this design**: High-volume table. Partition by ride for efficient querying. Compare rider and pilot telemetry for fraud detection.

### 2.7 RTO Plates Table (Gamification)
```
rto_plates:
- id (UUID, primary key)
- user_id (UUID, FK to users)
- rto_code (VARCHAR, e.g., "KA-01", "MH-12")
- state (VARCHAR, e.g., "Karnataka", "Maharashtra")
- district (VARCHAR, e.g., "Bangalore", "Mumbai")
- collected_at (TIMESTAMP)
- ride_id (UUID, FK to rides)

INDEXES:
- user_id + rto_code (unique, prevent duplicates)
- user_id + collected_at (for recent plates)
```

### 2.8 Badges Table (User Achievements)
```
user_badges:
- id (UUID, primary key)
- user_id (UUID, FK to users)
- badge_type (VARCHAR: top_pilot, explorer, century_club, plate_hunter, safe_driver)
- earned_at (TIMESTAMP)
- metadata (JSONB, e.g., progress for incomplete badges)

INDEXES:
- user_id (for profile queries)
```

---

## 3. API Architecture

### 3.1 API Design Principles
- **RESTful with versioning**: All endpoints prefixed with `/api/v1`
- **JWT authentication**: Required for all protected endpoints via middleware
- **Request validation**: Use Joi schemas for all input validation
- **Error standardization**: Consistent error response format with codes
- **Rate limiting**: IP-based and user-based rate limits on sensitive endpoints
- **Idempotency**: Support idempotency keys for ride creation and token operations

### 3.2 Authentication Endpoints

**POST /api/v1/auth/verify-token**
- Body: `{ firebaseToken: string }`
- Logic: Verify Firebase token, create user if new, generate JWT
- Returns: `{ accessToken, refreshToken, user, isNewUser }`
- Notes: If new user, user starts with both availability flags false

**POST /api/v1/auth/refresh**
- Body: `{ refreshToken: string }`
- Returns: `{ accessToken, refreshToken }`

### 3.3 User Management Endpoints

**GET /api/v1/users/me**
- Returns complete user profile with stats, availability states, badges
- Includes: ride counts per role, token balance, collected plates count, streak info

**PATCH /api/v1/users/me**
- Body: `{ name?, avatar_url?, pilot_vehicle_type?, pilot_plate_number? }`
- Updates user profile (NOT availability states - separate endpoint)

**PATCH /api/v1/users/me/availability**
- Body: `{ isPilotAvailable: boolean, isRiderAvailable: boolean, location?: { lat, lng } }`
- Updates availability flags and optionally location
- Validation: If setting pilot available, check kyc_status = verified
- Side effect: If going available, insert/update user_locations table
- Returns: Updated user object

**GET /api/v1/users/:id**
- Returns public profile of another user
- Filters sensitive data (phone, fcm_token)

### 3.4 Location & Discovery Endpoints

**GET /api/v1/nearby/pilots**
- Query: `?lat={latitude}&lng={longitude}&radius={meters}`
- Returns: Array of pilots where is_pilot_available = true within radius
- Uses PostGIS ST_DWithin for efficient spatial query
- Each pilot includes: id, name, location, distance, rating, vehicle, avatar_url, stats
- Sort by distance ascending
- Limit: 50 results

**GET /api/v1/nearby/riders**
- Query: `?lat={latitude}&lng={longitude}&radius={meters}`
- Returns: Array of riders where is_rider_available = true within radius
- Each rider includes: id, name, location, distance, rating, destination (if set), avatar_url, stats
- Sort by distance ascending
- Limit: 50 results

**POST /api/v1/location/update**
- Body: `{ lat, lng, heading?, speed?, isPilotAvailable, isRiderAvailable }`
- Upserts user_locations table
- Called frequently: every 3s if pilot available, every 10s if rider available
- Includes rate limiting per user to prevent abuse

### 3.5 Ride Flow Endpoints

**POST /api/v1/rides/notify** (Rider → Pilot flow)
- Body: `{ riderId, pilotId, origin: { lat, lng }, destination: { lat, lng } }`
- Creates ride with status=notified, initiated_by=rider
- Inserts into active_notifications
- Emits socket event to pilot: `ride:notification`
- Returns: `{ rideId, status: 'notified' }`

**POST /api/v1/rides/offer** (Pilot → Rider flow)
- Body: `{ pilotId, riderId, origin: { lat, lng }, destination: { lat, lng } }`
- Creates ride with status=offered, initiated_by=pilot
- Inserts into active_notifications
- Emits socket event to rider: `ride:offer-received`
- Returns: `{ rideId, status: 'offered' }`

**PATCH /api/v1/rides/:id/confirm**
- Body: `{ userId }`
- Updates rider_confirmed_at or pilot_confirmed_at based on userId
- If both confirmed: update status=confirmed, emit `ride:both-confirmed` to both users
- Returns: `{ confirmed: true, waitingForOther: boolean, status }`

**PATCH /api/v1/rides/:id/start**
- Only callable by pilot
- Updates status=active, started_at=now
- Emits `ride:started` to both

**POST /api/v1/rides/:id/telemetry**
- Body: `{ points: [{ lat, lng, speed, accuracy, timestamp }] }`
- Batch insert telemetry points
- Called every 5 seconds during active ride by both participants
- Background job validates telemetry for fraud

**PATCH /api/v1/rides/:id/end**
- Body: `{ endLocation: { lat, lng } }`
- Calculates distance using haversine on origin/destination
- Calculates tokens for both participants (see token economics section)
- Updates ride status=completed, ended_at=now
- Creates token transactions for both users
- Updates user stats (total_rides, total_km, streak)
- Checks for RTO plate collection
- Emits `ride:completed` to both with token amounts
- Returns: `{ tokensAwarded: { rider, pilot }, distance, plate? }`

**PATCH /api/v1/rides/:id/cancel**
- Updates status=cancelled
- Cleans up active_notifications
- Emits `ride:cancelled` to other participant

**GET /api/v1/rides/:id**
- Returns complete ride details
- Includes both user profiles, telemetry summary, status

**GET /api/v1/rides/history**
- Query: `?limit={}&offset={}&role={rider|pilot|both}`
- Returns paginated ride history for current user
- Filters by role if specified

### 3.6 Token & Wallet Endpoints

**GET /api/v1/tokens/me**
- Returns: `{ balance, recentTransactions: [] }`
- Transactions include: amount, type, category, source, created_at

**GET /api/v1/tokens/transactions**
- Query: `?limit={}&offset={}&category={}`
- Returns paginated transaction history with filters

**GET /api/v1/rewards**
- Returns available rewards catalog
- Filters: category, min_cost, max_cost

**POST /api/v1/rewards/:id/redeem**
- Body: `{ userId, rewardId }`
- Validates token balance
- Creates redemption record
- Generates voucher code
- Deducts tokens, creates transaction
- Returns: `{ voucherCode, qrData, expiresAt }`

### 3.7 Gamification Endpoints

**POST /api/v1/plates/collect**
- Body: `{ rideId, rtoCode }`
- Validates ride completed in that RTO region
- Checks uniqueness
- Awards bonus tokens (5) if new plate
- Returns: `{ collected: boolean, isNew: boolean, tokensAwarded? }`

**GET /api/v1/plates/me**
- Returns user's collected plates
- Grouped by state with counts

**GET /api/v1/leaderboards**
- Query: `?type={rides|tokens|plates|rating}&region={}&timeframe={week|month|all}`
- Returns top 100 users for leaderboard type
- Includes rank, user info, metric value

**GET /api/v1/badges/me**
- Returns user's earned badges with progress toward next badges

---

## 4. Socket.io Real-Time Events

### 4.1 Connection & Authentication
```
Client connects: socket.connect()
Client authenticates: socket.emit('authenticate', { token: JWT })
Server validates JWT, attaches userId to socket
Server subscribes user to personal room: socket.join(`user:${userId}`)
```

### 4.2 Location Broadcasting

**Client → Server: `user:location-update`**
```json
{
  "userId": "uuid",
  "lat": 12.9716,
  "lng": 77.5946,
  "heading": 90,
  "speed": 45,
  "isPilotAvailable": true,
  "isRiderAvailable": false,
  "timestamp": "ISO8601"
}
```
Server updates user_locations table, broadcasts to nearby users in range

**Server → Client: `pilot:location-update`** (if pilot available)
**Server → Client: `rider:location-update`** (if rider available)
Sent to users within 5km radius who have relevant filters active

### 4.3 Ride Initiation Events

**Server → Client: `ride:notification`** (Rider notified Pilot)
```json
{
  "rideId": "uuid",
  "rider": { "id", "name", "rating", "avatar_url" },
  "origin": { "lat", "lng" },
  "destination": { "lat", "lng" },
  "distance": 850
}
```

**Server → Client: `ride:offer-received`** (Pilot offered ride to Rider)
```json
{
  "rideId": "uuid",
  "pilot": { "id", "name", "rating", "vehicle", "plate", "avatar_url" },
  "origin": { "lat", "lng" },
  "destination": { "lat", "lng" },
  "eta": "3 mins"
}
```

### 4.4 Proximity Matching Events

**Server → Both: `ride:proximity-match`**
Triggered when proximity detection service finds both users within 20 meters
```json
{
  "rideId": "uuid",
  "distance": 15,
  "pilot": { "id", "name", "vehicle" },
  "rider": { "id", "name" }
}
```

**Server → Both: `ride:both-confirmed`**
After both users call confirm endpoint
```json
{
  "rideId": "uuid",
  "status": "confirmed",
  "pilot": { "id", "name" },
  "rider": { "id", "name" }
}
```

### 4.5 Ride Status Events

**Server → Both: `ride:started`**
**Server → Both: `ride:status-update`** (generic status changes)
**Server → Both: `ride:completed`**
```json
{
  "rideId": "uuid",
  "distance": 8500,
  "duration": 24,
  "tokensAwarded": {
    "rider": 10,
    "pilot": 15
  },
  "plate": { "rtoCode": "KA-01", "isNew": true }
}
```

**Server → Other: `ride:cancelled`**
```json
{
  "rideId": "uuid",
  "cancelledBy": "userId",
  "reason": "user_declined"
}
```

---

## 5. Token Economics Implementation

### 5.1 Token Calculation Logic

**Base Tokens:**
- Rider: 10 tokens per ride (always)
- Pilot: 15 tokens per ride (always)
- Ratio: 60% to rider, 40% additional to pilot

**Distance Bonus:**
- If distance > 10 km: +5 tokens to BOTH

**Streak Bonus:**
- Check user's last_ride_date
- If consecutive days (no gap > 1 day):
  - 3-day streak: +5 tokens
  - 5-day streak: +10 tokens
  - 7-day streak: +15 tokens
- Resets if gap > 1 day

**Subscription Multiplier:**
- If user has active subscription: multiply total by 1.25x
- Applied after all bonuses calculated

**Calculation Formula:**
```
riderTokens = 10 + distanceBonus + streakBonus
pilotTokens = 15 + distanceBonus + streakBonus

if (subscription) {
  riderTokens *= 1.25
  pilotTokens *= 1.25
}

riderTokens = floor(riderTokens)
pilotTokens = floor(pilotTokens)
```

### 5.2 Token Transaction Recording
Every token change creates a record in tokens table:
- Positive amount for earnings
- Negative amount for spending
- Category tags for filtering
- Source description for audit
- Linked to ride_id when applicable

---

## 6. Proximity Detection Service (Critical)

### 6.1 Background Service Architecture
Run as separate Node.js process or job:
- Interval: Every 2 seconds
- Query active_notifications where status='pending' and expires_at > now
- For each notification:
  1. Get current locations of both users from user_locations
  2. Calculate distance using Haversine formula
  3. If distance <= 20 meters:
     - Update notification status='proximity_detected'
     - Emit `ride:proximity-match` to both users
     - Update ride status='pending_confirm'
  4. If distance > 50 meters (moved away):
     - Cancel notification
     - Emit cancellation event

### 6.2 Haversine Distance Function
```
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // returns meters
}
```

### 6.3 Notification Expiry
Background cleanup job:
- Runs every 30 seconds
- Deletes active_notifications where expires_at < now
- Updates related rides to status='expired'

---

## 7. Frontend Architecture

### 7.1 Technology Stack
- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation 6 (native stack + bottom tabs)
- **State Management**: React Context API + AsyncStorage persistence
- **Maps**: @rnmapbox/maps (free, no API credit card required)
- **Real-time**: socket.io-client
- **HTTP**: Axios with interceptors
- **Location**: expo-location
- **Auth**: Firebase SDK (phone auth)
- **Storage**: @react-native-async-storage/async-storage
- **Notifications**: expo-notifications

### 7.2 Project Structure
```
/src
  /contexts
    AuthContext.tsx
    UserContext.tsx
    RideContext.tsx
    SocketContext.tsx
    MapContext.tsx
  /screens
    AuthScreen.tsx
    MapScreen.tsx
    ProfileModalScreen.tsx
    NotificationSentScreen.tsx
    OfferSentScreen.tsx
    ProximityConfirmScreen.tsx
    RideLiveScreen.tsx
    RideCompleteScreen.tsx
    ProfileScreen.tsx
    EditProfileScreen.tsx
    WalletScreen.tsx
    RewardsScreen.tsx
    SettingsScreen.tsx
  /components
    /map
      PilotMarker.tsx
      RiderMarker.tsx
      UserMarker.tsx
      FilterPills.tsx
    /ride
      RideStatusCard.tsx
      ProximityIndicator.tsx
    /profile
      StatBox.tsx
      BadgeChip.tsx
      AvailabilityToggle.tsx
    /wallet
      TokenBalance.tsx
      TransactionItem.tsx
    /common
      Button.tsx
      Card.tsx
      Input.tsx
      Avatar.tsx
      LoadingSpinner.tsx
  /services
    api.ts
    socket.ts
    location.ts
    firebase.ts
  /hooks
    useLocation.ts
    useNearbyUsers.ts
    useRideStatus.ts
    useSocket.ts
  /navigation
    AppNavigator.tsx
    AuthNavigator.tsx
    MainNavigator.tsx
  /constants
    theme.ts
    config.ts
  /types
    index.ts
  /utils
    distance.ts
    validators.ts
    formatters.ts
```

### 7.3 Context Provider Hierarchy
```tsx
<AuthProvider>
  <UserProvider>
    <SocketProvider>
      <RideProvider>
        <MapProvider>
          <NavigationContainer>
            {user ? <MainNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </MapProvider>
      </RideProvider>
    </SocketProvider>
  </UserProvider>
</AuthProvider>
```

### 7.4 State Persistence Strategy
**AsyncStorage Keys:**
- `@hitch:auth_token` - JWT access token
- `@hitch:refresh_token` - Refresh token
- `@hitch:user_profile` - Cached user object
- `@hitch:map_filters` - Last used filter preferences
- `@hitch:availability_state` - Last availability settings

**Rehydration on App Launch:**
1. Read auth tokens from storage
2. If tokens exist, verify with backend
3. If valid, fetch fresh user profile
4. Restore map filters and availability from cache
5. Connect socket with valid token

---

## 8. Screen Implementation Details

### 8.1 MapScreen (Most Complex)

**State Management:**
```typescript
- userLocation: { lat, lng } | null
- nearbyPilots: Pilot[]
- nearbyRiders: Rider[]
- activeFilters: { showPilots: boolean, showRiders: boolean }
- userAvailability: { isPilot: boolean, isRider: boolean }
- isLoadingLocation: boolean
- isLoadingNearby: boolean
```

**Data Flow:**
1. On mount: Request location permissions
2. Get current location, center map
3. Fetch nearby pilots and riders (separate API calls)
4. Start location watch (updates every 3s)
5. If user availability ON, broadcast location via socket
6. Listen for real-time location updates via socket
7. Update markers on map dynamically
8. Re-fetch nearby users every 10 seconds as backup

**Filter Logic:**
- Default: Both pilots and riders visible
- Tap filter pill: Toggle visibility
- Cannot disable both filters (show alert)
- Filtered markers update instantly
- Bottom sheet list reflects active filters

**Availability Toggle:**
- Two FAB buttons stacked vertically
- Pilot FAB: Amber when active, gray when inactive
- Rider FAB: Blue when active, gray when inactive
- On toggle: API call to update availability
- If pilot toggle ON: Check KYC verified first
- If toggle succeeds: Update UserContext
- Start/stop location broadcasting based on state

**Marker Interaction:**
- Tap pilot marker → Navigate to ProfileModalScreen with { person: pilot, type: 'pilot' }
- Tap rider marker → Navigate to ProfileModalScreen with { person: rider, type: 'rider' }
- Markers show distance labels calculated from user location

### 8.2 ProfileModalScreen (Adaptive)

**Conditional Rendering Based on Type:**
```typescript
if (type === 'pilot') {
  // Rider is viewing a pilot
  show: vehicle info, pilot badges
  CTA: "🔔 Notify Pilot"
  onPress: POST /rides/notify → Navigate to NotificationSentScreen
}

if (type === 'rider') {
  // Pilot is viewing a rider
  show: destination if available, rider badges
  CTA: "🚗 Offer Ride to {name}"
  onPress: POST /rides/offer → Navigate to OfferSentScreen
}
```

**Validation Before Action:**
- Check current user's availability matches action (rider can notify if any availability, pilot must have pilot availability)
- Check target user still available (not stale data)
- Check KYC if pilot offering ride
- Show appropriate error modals

### 8.3 NotificationSentScreen / OfferSentScreen

**Socket Listener Setup:**
```typescript
useEffect(() => {
  socket.on('ride:proximity-match', handleProximityMatch);
  socket.on('ride:offer-accepted', handleOfferAccepted);
  socket.on('ride:offer-declined', handleOfferDeclined);
  socket.on('ride:cancelled', handleCancelled);
  
  return () => {
    socket.off('ride:proximity-match');
    socket.off('ride:offer-accepted');
    socket.off('ride:offer-declined');
    socket.off('ride:cancelled');
  };
}, [rideId]);
```

**Timeout Logic:**
- Set 5-minute timer on mount
- If no proximity match: Show "No response" alert, navigate to Map
- Clear timer on proximity match or cancellation

**Distance Tracking:**
- Fetch other user's location every 10 seconds
- Calculate and display distance
- Show "Almost there!" when < 50m

### 8.4 ProximityConfirmScreen (Critical)

**Dual Confirmation State:**
```typescript
- isConfirming: boolean (local user confirming)
- otherUserConfirmed: boolean (from socket or API poll)
- countdown: number (30 seconds)
```

**Real-Time Distance Updates:**
- Get both users' locations every 2 seconds
- Calculate distance
- If distance > 50m: Auto-cancel with alert

**Confirmation Flow:**
1. User taps "✓ Confirm Ride"
2. Call API: PATCH /rides/:id/confirm
3. Response indicates if waiting for other
4. Listen for socket event: `ride:both-confirmed`
5. On both confirmed: Navigate to RideLiveScreen

**Countdown Timer:**
- Start at 30 seconds
- Display prominently
- Red color when < 10s
- At 0: Auto-cancel ride

### 8.5 RideLiveScreen

**Telemetry Transmission:**
```typescript
setInterval(() => {
  const location = await Location.getCurrentPositionAsync();
  telemetryBatch.push({
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    speed: location.coords.speed,
    accuracy: location.coords.accuracy,
    timestamp: new Date().toISOString()
  });
  
  if (telemetryBatch.length >= 10) {
    await api.rides.sendTelemetry(rideId, telemetryBatch);
    telemetryBatch = [];
  }
}, 5000);
```

**Map Updates:**
- Show route line from origin to destination
- User marker (blue)
- Other user marker (amber for pilot, blue for rider)
- Update other user's position from socket events
- Show ETA calculated from remaining distance and current speed

**Controls:**
- Call button: Open dialer with other user's phone
- Share button: Generate live tracking link
- SOS button: Trigger emergency alert (red, prominent)
- End Ride button: Only visible to pilot

### 8.6 RideCompleteScreen

**Token Animation:**
- Animate token icon with scale + rotation
- Count up animation from 0 to earned amount
- Show breakdown: Base + Bonuses
- Confetti effect (lightweight) on mount

**Plate Collection:**
- If new plate: Show card with RTO code
- Animate slide-in from bottom
- "Collect" button adds to user's collection
- Haptic feedback on collect

**Rating Flow:**
- 5 stars (tappable)
- Quick tags: Safe, Friendly, Punctual, Clean
- Submit button calls rating API
- Rating updates other user's profile

### 8.7 ProfileScreen

From here you put your brains for completing. 
