# Hitchr Local Development Build Guide

This guide will help you set up **fully local development builds** for both Android and iOS, bypassing Expo Go and EAS cloud queues entirely.

---

## 📋 Prerequisites

### General Requirements
- **Node.js**: v18+ (recommended v20+)
- **npm** or **yarn**: Latest version
- **Git**: Latest version
- **Expo CLI**: Installed globally or via npx

### Android Requirements
- **Java Development Kit (JDK)**: OpenJDK 17 (recommended) or 11
  ```bash
  # Ubuntu/Debian
  sudo apt install openjdk-17-jdk
  
  # macOS (using Homebrew)
  brew install openjdk@17
  
  # Verify installation
  java -version
  ```

- **Android Studio**: Latest stable version
  - Download from: https://developer.android.com/studio
  - Install the following via SDK Manager:
    - Android SDK Platform 34
    - Android SDK Build-Tools 34.0.0
    - Android SDK Command-line Tools
    - Android SDK Platform-Tools
    - Android Emulator
    - NDK 26.1.10909125

- **Environment Variables** (add to `~/.bashrc` or `~/.zshrc`):
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  ```

- **Physical Device** (recommended for testing):
  - Enable Developer Options
  - Enable USB Debugging
  - Connect via USB and authorize computer

### iOS Requirements (macOS only)
- **Xcode**: Latest stable version from Mac App Store
  - Install Command Line Tools:
    ```bash
    xcode-select --install
    ```
  
- **CocoaPods**: Ruby gem for iOS dependencies
  ```bash
  # Install via Homebrew (recommended)
  brew install cocoapods
  
  # Or via Ruby gem
  sudo gem install cocoapods
  
  # Verify installation
  pod --version
  ```

- **iOS Simulator** or **Physical iOS Device**:
  - Simulators are installed with Xcode
  - For physical devices, you'll need an Apple Developer account

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Mapbox tokens
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
MAPBOX_DOWNLOAD_TOKEN=sk.your_mapbox_download_token_here

# Backend API endpoints
EXPO_PUBLIC_API_URL=http://your-backend-url:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://your-backend-url:3000

# Development mode
EXPO_PUBLIC_DEV_MODE=true
```

### Getting Mapbox Tokens

1. **Public Access Token** (`pk...`):
   - Sign up at https://account.mapbox.com/
   - Go to "Access tokens"
   - Create or copy your default public token
   - Set as `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`

2. **Download Token** (`sk...`):
   - Go to "Access tokens"
   - Create a new **secret** token
   - Enable scope: **"Downloads: Read"**
   - Set as `MAPBOX_DOWNLOAD_TOKEN`
   - **⚠️ Keep this secret! Never commit to git.**

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd hitch-app
npm install
```

### 2. Generate Native Projects

```bash
# Generate both Android and iOS native directories
npx expo prebuild

# Or generate specific platform
npx expo prebuild --platform android
npx expo prebuild --platform ios
```

### 3. Install iOS Pods (macOS only)

```bash
npm run pods
# Or manually: cd ios && pod install && cd ..
```

---

## 🔨 Building and Running

### Android Development Build

#### Option 1: Using Physical Device (Recommended)
```bash
# 1. Connect your Android device via USB
# 2. Enable USB Debugging
# 3. Verify device is connected
adb devices

# 4. Build and run
npm run dev:android
# Or: expo run:android
```

#### Option 2: Using Android Emulator
```bash
# 1. Create an AVD in Android Studio (if not exists)
# 2. Start the emulator
# 3. Build and run
npm run dev:android
```

#### First Build
- First build will take 5-15 minutes (downloads dependencies)
- Subsequent builds are much faster (1-3 minutes)
- Gradle will download Mapbox Android SDK using your download token

### iOS Development Build (macOS only)

#### Option 1: Using Physical Device
```bash
# 1. Connect your iOS device via USB
# 2. Trust the computer on your device
# 3. Build and run
npm run dev:ios --device
```

#### Option 2: Using iOS Simulator
```bash
# Build and run on simulator
npm run dev:ios
# Or specify simulator: npm run dev:ios -- --simulator="iPhone 15 Pro"
```

#### First Build
- First build will take 10-20 minutes
- CocoaPods will download Mapbox iOS SDK
- Xcode will compile all native modules
- Subsequent builds are faster (2-5 minutes)

---

## 🔄 Development Workflow

### Starting the Metro Bundler

After building, start the dev server:

```bash
# Start with dev client
npm run start:dev-client

# Or standard start
npm start
```

### Making Code Changes

1. **JavaScript/TypeScript changes**: Hot reload automatically
2. **Native code or config changes**: Rebuild the app
   ```bash
   npm run dev:android  # For Android
   npm run dev:ios      # For iOS
   ```

### Clean Rebuild

If you encounter issues:

```bash
# Clean and regenerate native directories
npm run dev:clean

# Then rebuild
npm run dev:android  # or dev:ios
```

---

## 🗂️ Project Structure

```
hitch-app/
├── android/              # Native Android project (generated)
├── ios/                  # Native iOS project (generated)
├── src/                  # React Native source code
├── assets/               # App assets
├── app.config.js         # Expo configuration
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (create this)
└── LOCAL_BUILD_GUIDE.md  # This file
```

---

## 🔧 Available Scripts

```json
{
  "dev:android": "expo run:android",
  "dev:ios": "expo run:ios",
  "dev:clean": "rm -rf android ios && expo prebuild",
  "pods": "cd ios && pod install && cd ..",
  "prebuild": "expo prebuild",
  "prebuild:clean": "expo prebuild --clean",
  "start": "expo start",
  "start:dev-client": "expo start --dev-client"
}
```

---

## 🐛 Troubleshooting

### Android Issues

#### "SDK location not found"
```bash
# Create local.properties file in android/
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

#### "Could not find Mapbox SDK"
- Verify `MAPBOX_DOWNLOAD_TOKEN` is set in `.env`
- Check `android/gradle.properties` contains the token
- Token must have "Downloads: Read" scope

#### "Gradle build failed"
```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..

# Rebuild
npm run dev:android
```

#### ADB connection issues
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### iOS Issues

#### "CocoaPods not found"
```bash
# Install CocoaPods
sudo gem install cocoapods

# Update CocoaPods
pod repo update
```

#### "No Xcode project found"
```bash
# Regenerate iOS project
npx expo prebuild --platform ios

# Install pods
cd ios && pod install && cd ..
```

#### "Unable to boot simulator"
```bash
# List available simulators
xcrun simctl list devices

# Erase and reset simulator
xcrun simctl erase all
```

#### Code signing issues
- Open `ios/Hitchr.xcworkspace` in Xcode
- Select the project in left sidebar
- Go to "Signing & Capabilities"
- Select your team or enable "Automatically manage signing"

### General Issues

#### "Metro bundler port in use"
```bash
# Kill process using port 8081
lsof -ti:8081 | xargs kill -9

# Or specify different port
npm start -- --port 8082
```

#### "Module not found" errors
```bash
# Clear caches and reinstall
rm -rf node_modules
npm install
npm run dev:clean
```

#### Environment variables not loading
- Ensure `.env` is in project root
- Restart Metro bundler
- Verify no typos in variable names

---

## 🎯 Validation Checklist

After successful build, verify:

- [ ] App launches on device/simulator
- [ ] Mapbox map renders correctly
- [ ] User location dot appears (grant location permission)
- [ ] Map can pan, zoom, rotate
- [ ] Markers render on map
- [ ] No MapLibre references in code
- [ ] Location permissions are requested
- [ ] Background location works (for ride tracking)

---

## 📚 Additional Resources

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup?platform=android)
- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup?platform=ios)
- [Mapbox React Native SDK](https://github.com/rnmapbox/maps)
- [Android Studio Download](https://developer.android.com/studio)
- [Xcode (Mac App Store)](https://apps.apple.com/us/app/xcode/id497799835)

---

## 🔐 Security Notes

**Never commit sensitive tokens to git!**

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
android/gradle.properties  # If it contains MAPBOX_DOWNLOADS_TOKEN
ios/Podfile.properties.json
```

For production builds, use environment-specific `.env` files:
- `.env.development`
- `.env.staging`
- `.env.production`

---

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review Expo and React Native documentation
3. Search GitHub issues for `@rnmapbox/maps`
4. Check Android Studio / Xcode build logs
5. Contact the development team

---

**Happy Building! 🚀**
















