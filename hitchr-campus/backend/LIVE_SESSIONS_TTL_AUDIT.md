# Live Sessions TTL Audit

## 1. Exact Mongo Index Definitions for `live_sessions`

From [server.py](server.py) `_ensure_live_indexes()`:

```python
# live_sessions indexes
await db.live_sessions.create_index("pilot_id")
await db.live_sessions.create_index("is_live")
await db.live_sessions.create_index([("location", "2dsphere")])
await db.live_sessions.create_index(
    "last_updated_at",
    expireAfterSeconds=60,
    name="ttl_last_updated",
)
```

**Equivalent MongoDB shell commands:**

```javascript
db.live_sessions.createIndex({ "pilot_id": 1 })
db.live_sessions.createIndex({ "is_live": 1 })
db.live_sessions.createIndex({ "location": "2dsphere" })
db.live_sessions.createIndex(
  { "last_updated_at": 1 },
  { expireAfterSeconds: 60, name: "ttl_last_updated" }
)
```

**Verification:**
- **2dsphere on location:** Yes — `create_index([("location", "2dsphere")])`
- **TTL on last_updated_at with expireAfterSeconds=60:** Yes — `create_index("last_updated_at", expireAfterSeconds=60, name="ttl_last_updated")`

---

## 2. Where `last_updated_at` Is Updated

### On `/live/start` (creation)

```python
# server.py lines 1032-1039
now = datetime.utcnow()
doc = {
    "pilot_id": body.pilot_id,
    "seats_available": body.seats_available,
    "is_live": True,
    "location": {"type": "Point", "coordinates": [0.0, 0.0]},
    "heading": None,
    "speed_kmh": None,
    "last_updated_at": now,   # <-- set at creation
    "created_at": now,
}
```

### On `/live/location-update` (every call)

```python
# server.py lines 1081-1094
now = datetime.utcnow()
# ...
update: Dict[str, Any] = {
    "location": {"type": "Point", "coordinates": [body.lng, body.lat]},
    "last_updated_at": now,   # <-- updated on every location-update
}
# ...
await db.live_sessions.update_one(
    {"pilot_id": body.pilot_id},
    {"$set": update},
)
```

**Confirmed:** `last_updated_at` is set on start and updated on every `location-update` call.

---

## 3. Zombie Pilot Scenario

**Scenario:** Pilot starts live, does NOT send location updates.

| Step | Action | Result |
|------|--------|--------|
| T=0 | `POST /live/start` | Document created with `last_updated_at = T0` |
| T>0 | No `POST /live/location-update` calls | `last_updated_at` stays at T0 |
| T=60 | MongoDB TTL background task runs | Document deleted (last_updated_at is 60+ seconds old) |

**Conclusion:** Document auto-deletes after ~60 seconds. No zombie pilots.

---

## 4. Manual TTL Verification Steps

### Prerequisites
- MongoDB running
- Backend running (`uvicorn server:app --host 0.0.0.0 --port 8001`)
- `curl` or similar

### Option A: Use the verification script

```bash
cd hitchr-campus/backend
python3 scripts/verify_live_ttl.py
```

### Option B: Manual steps

1. **Seed a user (optional, or use any existing user ID):**
   ```bash
   curl -X POST http://localhost:8001/api/seed-campus
   # Note a pilot user_id from the response or use: curl http://localhost:8001/api/seed-campus
   ```

2. **Start live (no location updates):**
   ```bash
   curl -X POST http://localhost:8001/api/live/start \
     -H "Content-Type: application/json" \
     -d '{"pilot_id": "USER_ID_HERE", "seats_available": 2}'
   ```

3. **Verify document exists (within 0–60s):**
   ```bash
   # In mongo shell or mongosh:
   use hitchr_campus_db   # or your DB_NAME from .env
   db.live_sessions.find({ pilot_id: "USER_ID_HERE" })
   # Should return 1 document
   ```

4. **Wait 65–90 seconds** (MongoDB TTL runs every ~60 seconds).

5. **Verify document is gone:**
   ```bash
   db.live_sessions.find({ pilot_id: "USER_ID_HERE" })
   # Should return 0 documents
   ```

6. **Verify radar returns no ghosts:**
   ```bash
   curl "http://localhost:8001/api/live/radar?lat=28.69&lng=77.22&radius_km=5"
   # Should return [] (empty list)
   ```

### What we are verifying

| Check | Result |
|-------|--------|
| No zombie pilots | Document deleted when pilot stops updating |
| Mongo TTL actually works | Document disappears after ~60s |
| No stale radar ghosts | Radar returns empty after TTL cleanup |
