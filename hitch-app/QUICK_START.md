# 🚀 Hitchr Local Build - Quick Start

## ⚡ Prerequisites Install (One-time setup)

### Linux (Android)
```bash
# 1. Install Java
sudo apt install openjdk-17-jdk

# 2. Download Android Studio from:
# https://developer.android.com/studio

# 3. In Android Studio SDK Manager, install:
#    - Android SDK Platform 34
#    - Build Tools 34.0.0
#    - NDK 26.1.10909125
#    - Android Emulator

# 4. Add to ~/.bashrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.bashrc
```

### macOS (iOS)
```bash
# 1. Install Xcode from Mac App Store
xcode-select --install

# 2. Install CocoaPods
brew install cocoapods
```

---

## 🏗️ Build & Run

```bash
cd hitch-app

# First time only: Install dependencies
npm install

# Android (requires Java + Android Studio)
npm run dev:android

# iOS (macOS only, requires Xcode)
npm run dev:ios

# Start Metro bundler (in separate terminal)
npm run start:dev-client
```

---

## 📝 Environment Variables

Create `.env` in `hitch-app/`:

```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.YOUR_MAPBOX_PUBLIC_TOKEN
MAPBOX_DOWNLOAD_TOKEN=sk.YOUR_MAPBOX_SECRET_TOKEN
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
EXPO_PUBLIC_DEV_MODE=true
```

---

## 🔄 Common Commands

```bash
# Clean rebuild (fixes most issues)
npm run dev:clean
npm run dev:android

# Install iOS pods (macOS only, after changes)
npm run pods

# Regenerate native directories
npm run prebuild:clean

# Start Metro bundler
npm start
```

---

## 🐛 Quick Fixes

**"JAVA_HOME not set"**
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

**"SDK location not found"**
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

**"Port 8081 in use"**
```bash
lsof -ti:8081 | xargs kill -9
```

**"Gradle build failed"**
```bash
cd android && ./gradlew clean && cd ..
npm run dev:clean
```

---

## 📚 Full Documentation

- **Complete Setup Guide**: `LOCAL_BUILD_GUIDE.md`
- **Configuration Summary**: `SETUP_COMPLETE.md`
- **EAS Cloud Builds**: `BUILD_INSTRUCTIONS.md`

---

## ✅ Verification

After build succeeds:
- [ ] App launches
- [ ] Map renders
- [ ] Location dot appears
- [ ] Map interactions work

---

**Build Times**:
- First build: 5-20 minutes (downloads dependencies)
- Subsequent builds: 1-5 minutes
- No cloud queues! No waiting! 🎉
















