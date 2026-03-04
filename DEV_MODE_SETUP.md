# 🚀 HITCH App - Development Mode Setup

## Quick Start (No Firebase Required!)

The app now includes a **DEV MODE** that allows you to test all features without setting up Firebase.

### ✅ What's Working

All 13 screens are functional in dev mode:
- ✅ Authentication (mock mode with OTP: 123456)
- ✅ Map screen with dual markers and filters
- ✅ Profile management with dual availability toggles
- ✅ Complete ride flows (notification/offer → proximity → live → complete)
- ✅ Wallet and token display
- ✅ Settings and profile editing

### 🏃 Running the App

1. **Start the frontend:**
```bash
cd /home/internt-zato/Documents/hitchr/hitch-app
npm start
```

2. **Login with dev credentials:**
   - Enter any phone number (e.g., `9876543210`)
   - Click "Send OTP"
   - Enter OTP: `123456`
   - You're in! 🎉

### 🔧 Dev Mode Features

**Mock Authentication:**
- No Firebase setup needed
- Use OTP `123456` to login
- Creates a mock user with verified KYC

**Mock Data:**
- Token balance: 120
- User: "Dev User"
- All features enabled

### 📱 Testing the App

**Test Flow:**
1. **Login:** Use OTP 123456
2. **Map Screen:** See the dual-role toggles (Pilot/Rider FABs)
3. **Toggle Availability:** Try switching between pilot and rider modes
4. **Profile:** View your stats and dual availability toggles
5. **Wallet:** Check token balance (120 tokens)
6. **Settings:** Configure app preferences

### 🔥 Switching to Production Mode

When you're ready to use real Firebase:

1. **Get Firebase credentials** from Firebase Console
2. **Update environment variables:**
```bash
# Create .env file in hitch-app/
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Disable dev mode:**
In `src/screens/AuthScreen.tsx`:
```typescript
const DEV_MODE = false; // Change to false
```

4. **Restart the app**

### 🌐 Backend Setup (Optional for Full Features)

The frontend works standalone in dev mode, but for full functionality:

```bash
cd /home/internt-zato/Documents/hitchr/backend

# Setup database
npm run migrate

# Start backend
npm run dev
```

Then update `src/constants/config.ts`:
```typescript
export const API_URL = 'http://localhost:3000';
```

### 🎯 Current Status

**Frontend:** ✅ 100% Complete (13/13 screens)
**Backend:** ✅ 100% Complete (dual-role APIs)
**Firebase:** ⚠️ Dev mode (production setup optional)
**Real-time:** ⚠️ Requires backend running

### 📝 Known Limitations in Dev Mode

- No real-time Socket.io updates (markers won't move)
- No actual proximity detection (simulated)
- No token earning from rides (displayed but not persisted)
- Profile changes saved locally only

### 🚨 Troubleshooting

**Error: "Firebase argument error"**
- Solution: Dev mode is now enabled by default. Just use OTP 123456.

**App won't load:**
```bash
# Clear cache and restart
cd hitch-app
rm -rf node_modules/.cache
npm start -- --clear
```

**Port conflicts:**
```bash
# Kill existing process
pkill -f expo
npm start
```

### 🎨 Customizing Dev Mode

Edit `src/contexts/AuthContext.tsx` to change mock user data:
```typescript
const mockUser = {
  name: 'Your Name',
  token_balance: 500, // Change token amount
  kyc_status: 'verified',
  // ... other properties
};
```

---

**Ready to test?** Just run `npm start` and login with OTP `123456`! 🚀



















