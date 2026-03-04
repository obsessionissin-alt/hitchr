# Hitchr Campus MVP

Community mobility for students. Travel together. साथ चलें।

## Architecture

- **Backend**: FastAPI + MongoDB
- **Frontend**: React Native (Expo) + TypeScript
- **Design**: Monday.com-inspired light theme

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB running on localhost:27017

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Seed data
curl -X POST http://localhost:8001/api/seed-campus
```

### Frontend Setup
```bash
cd frontend
npm install   # or yarn install

# For web preview (browser)
npx expo start --web

# For mobile (Android/iPhone) on same WiFi network
npx expo start
# Then scan the QR code with Expo Go app
```

### Environment Variables

**Backend** (`.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=hitchr_campus
```

**Frontend** (`.env`):
```
# For device testing: use your machine's LAN IP (not localhost)
# Find your IP: hostname -I (Linux) or ipconfig (Windows) or ifconfig (Mac)
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8001

# Example:
# EXPO_PUBLIC_API_URL=http://192.168.1.254:8001
```

### Testing on Physical Devices (Android/iPhone)

1. Ensure your phone and computer are on the **same WiFi network**
2. Find your computer's LAN IP:
   - Linux: `hostname -I | awk '{print $1}'`
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig` → look for IPv4 Address
3. Update `frontend/.env` with: `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8001`
4. Start backend: `cd backend && source .venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001`
5. Start frontend: `cd frontend && npx expo start`
6. Scan QR code with Expo Go (Android) or Camera app (iPhone)

## Features Implemented (v0.4)

### Core
- ✅ Campus email/invite onboarding
- ✅ Rider ↔ Pilot dual roles
- ✅ Live Now route posts
- ✅ Route discovery feed
- ✅ Join request system
- ✅ Premium light theme UI

### In Progress
- ⚠️ Planned trips composer
- ⚠️ Memory posts
- ⚠️ Communities tab
- ⚠️ Requests inbox (Pilot)
- ⚠️ Ride state tracking
- ⚠️ Post-ride contribution (A→B ₹5/km)

## API Endpoints

Base URL: `/api`

### Users
- `POST /users` - Create user
- `GET /users/{user_id}` - Get user
- `PATCH /users/{user_id}/role?role=pilot` - Toggle role

### Routes (Live Now)
- `GET /routes?status=posted` - Get available routes
- `POST /routes` - Create route (Pilot)
- `GET /routes/{route_id}` - Get route details

### Join Requests
- `POST /join-requests` - Request to join (Rider)
- `GET /join-requests/route/{route_id}` - Get requests for route
- `PATCH /join-requests/{request_id}/respond?action=accept` - Accept/decline

### Communities
- `GET /communities` - List communities
- `GET /communities/{id}/memories` - Community memories
- `GET /communities/{id}/planned-trips` - Community trips

### Data
- `POST /seed-campus` - Seed demo data

## Design System

Located in `frontend/constants/design.ts`:
- Light theme (Monday.com inspired)
- Coral primary (#FF6B4A)
- Trust green (#06D6A0)
- Generous spacing, soft shadows
- Route-first cards with navigation strips

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/               # Expo Router screens
│   ├── components/        # Reusable components
│   ├── constants/         # Design tokens
│   ├── store/             # Zustand state
│   ├── utils/             # API client
│   └── package.json
└── README.md
```

## Deployment

The app uses same-origin API calls by default. For deployed previews:
- Frontend and backend must be on the same domain
- API routes served under `/api/*`
- No CORS needed for same-origin

For separate deployments:
1. Deploy backend to your server
2. Set `EXPO_PUBLIC_API_URL=https://your-api.com` in frontend
3. Update backend CORS to allow your frontend domain

## Development Status

**Current**: ~40% complete  
**Next**: Complete Composer 3-modes, Communities tab, Requests inbox, Ride flow, Contribution

See GitHub Issues for detailed roadmap.

## License

MIT
