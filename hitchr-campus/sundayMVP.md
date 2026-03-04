HITCHR INTERCEPTION SYSTEM – MVP INJECTION (SUNDAY DEPLOY)

We are evolving Hitchr from route-posting to real-time corridor interception.

This must be implemented WITHOUT breaking existing RoutePost or RideInstance systems.

We are ADDING a parallel system called Live Interception.

This is a 3-day MVP implementation.

Do NOT refactor existing route logic.
Do NOT delete any route-related models.
Add new models and endpoints only.

🎯 PRODUCT MODEL (MVP SCOPE)

Campus scale.
Max radar radius: 500 meters.
Pilot location update interval: 3 seconds.
No broadcast logic.
No hybrid allocation.
No multi-rider arbitration.

Simple one-to-one intercept.

Rider chooses pilot.
Pilot accepts.
Ride starts.

🧱 BACKEND – NEW MODELS

Create new Mongo collection: live_sessions

Fields:

_id

pilot_id (string)

seats_available (int)

is_live (bool)

location (GeoJSON Point: { type: "Point", coordinates: [lng, lat] })

heading (float, degrees)

speed_kmh (float)

last_updated_at (datetime)

created_at (datetime)

Indexes:

2dsphere index on location

TTL index on last_updated_at (expire after 15 seconds)

Create new collection: intercept_requests

Fields:

_id

rider_id

pilot_id

status ("pending", "accepted", "expired")

created_at

expires_at (created_at + 15 seconds)

Index:

TTL on expires_at

🔌 BACKEND – NEW ENDPOINTS
1️⃣ Start Live

POST /live/start

Body:

pilot_id

seats_available

Creates or updates LiveSession:

is_live = true

created_at = now

2️⃣ Stop Live

POST /live/stop

Body:

pilot_id

Sets is_live = false and deletes session.

3️⃣ Location Update

POST /live/location-update

Body:

pilot_id

lat

lng

Server:

Update location (GeoJSON)

Calculate speed_kmh from last update

Calculate heading from previous coordinate

Update last_updated_at

No heavy computation.
Keep it simple.

4️⃣ Radar Query

GET /live/radar?lat=..&lng=..

Logic:

Geo query within 500 meters

is_live = true

seats_available > 0

Filter by heading alignment:

Accept pilots within ±45° of corridor direction

Return minimal payload:

[
{
pilot_id,
lat,
lng,
heading,
seats_available
}
]

Do NOT return sensitive user data.

5️⃣ Intercept Request

POST /live/request

Body:

rider_id

pilot_id

Logic:

Check pilot has active LiveSession

Check seats_available > 0

Create intercept_request (status = pending, expires in 15s)

Send WebSocket notification to pilot:
{
type: "intercept_request",
rider_id,
message: "Rider ahead"
}

Return success.

6️⃣ Accept Intercept

POST /live/accept

Body:

pilot_id

rider_id

Logic:

Find pending intercept_request

Mark status = accepted

Decrement LiveSession.seats_available by 1

Notify rider via WebSocket:
{ type: "intercept_accepted" }

📱 FLUTTER – NEW RADAR TAB

Add new bottom navigation tab: “Radar”

When opened:

Get current rider location.

Call /live/radar every 3 seconds.

Update pilot markers (do NOT rebuild map, update markers only).

Show heading arrow on marker.

Show seats badge.

When rider taps marker:

Show bottom sheet:
Pilot ID
Distance
Seats
“Intercept” button

On intercept:

Call /live/request

Show “Waiting for pilot…”

Listen to WebSocket for:

intercept_accepted

intercept_expired

🏍 PILOT SIDE – LIVE MODE

Add Live Toggle in profile or home.

When ON:

Call /live/start

Start sending location every 3 seconds.

When OFF:

Call /live/stop

Stop location stream.

On receiving WebSocket:
type: intercept_request

Show:

Full width banner:
“Rider ahead”
Accept button

If Accept:

Call /live/accept

No navigation required.
No map changes required.

🚫 DO NOT IMPLEMENT

Broadcast to multiple pilots

Fallback logic

Complex projection math

Multi-rider arbitration

Payment changes

Route system refactor

Background location permission

Redis or scaling infra

This is campus MVP only.

🧠 IMPLEMENTATION NOTES

Use existing FastAPI structure.

Reuse NotificationHub for WebSocket.

Do not break existing APIs.

Keep code modular.

Keep logic isolated in new service file if possible.

SUCCESS CRITERIA FOR SUNDAY

Pilot toggles live.

Rider sees moving pilot within 500m.

Rider taps pilot and requests intercept.

Pilot receives vibration + banner.

Pilot taps accept.

Rider gets accepted notification.

Seat decremented.

If this works end-to-end → deploy.

End of specification.   