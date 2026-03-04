# Hitchr Campus Backend

FastAPI + MongoDB backend for the Hitchr Campus Flutter app.

## Prerequisites

- Python 3.11+
- MongoDB (local or Docker)
- `.env` file (copy from `.env.example`)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run (for phone testing)

**Backend must bind to `0.0.0.0`** so your phone on the same Wi‑Fi can reach it.

```bash
# 1. Start MongoDB (if using Docker)
docker start hitchr-mongo

# 2. Start backend
.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Smoke Test (run after every backend change)

```bash
./scripts/smoke_test.sh
# Or with custom URL:
./scripts/smoke_test.sh http://YOUR_LAN_IP:8001/api
```

All endpoints must return 200. See `CAMPUS_BETA_TRACKER.md` for full checklist.

## Phone Testing

1. Find your LAN IP: `ip -4 addr | grep inet` (use the Wi‑Fi interface, e.g. `192.168.x.x`)
2. On phone browser, open: `http://<LAN_IP>:8001/api/routes` — must load
3. In the Flutter app: Profile → Settings → set Backend URL to `http://<LAN_IP>:8001/api`

## API Endpoints (frozen for testing)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check |
| GET | `/api/` | Root message |
| POST | `/api/seed-campus` | Seed demo data (clears existing) |
| POST | `/api/users` | Create user |
| GET | `/api/users/{id}` | Get user |
| PATCH | `/api/users/{id}/role?role=pilot` | Toggle role |
| GET | `/api/routes` | List routes |
| POST | `/api/routes` | Create route (Pilot) |
| GET | `/api/routes/{id}` | Get route |
| POST | `/api/join-requests` | Request to join |
| PATCH | `/api/join-requests/{id}/respond?action=accept` | Accept/decline |
| GET | `/api/rides/{id}` | Get ride |
| PATCH | `/api/rides/{id}/start` | Start ride |
| PATCH | `/api/rides/{id}/complete` | Complete ride |
| POST | `/api/contributions` | Submit contribution |
| GET | `/api/planned-trips` | List planned trips |
| GET | `/api/memories` | List memories |
| GET | `/api/communities` | List communities |
