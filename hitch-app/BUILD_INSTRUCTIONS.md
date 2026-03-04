# Hitchr Development Build Instructions

This guide explains how to build and run the Hitchr app using EAS (Expo Application Services) development builds with Mapbox support.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **EAS CLI** installed globally:
   ```bash
   npm install -g eas-cli
   ```
3. **Expo account** - Sign up at https://expo.dev
4. **Mapbox account** - Get your access token at https://account.mapbox.com/access-tokens/

## Environment Variables

Create a `.env` file in the `hitch-app` directory with the following variables:

```bash
# Required: Mapbox access tokens
# Use the same token for both values if you only have one
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
MAPBOX_DOWNLOAD_TOKEN=sk.your_mapbox_download_token_here

# Backend API
EXPO_PUBLIC_API_URL=http://your-backend-url:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://your-backend-url:3000

# Development Mode
EXPO_PUBLIC_DEV_MODE=true
```

## EAS Setup (First Time Only)

1. **Login to EAS:**
   ```bash
   eas login
   ```

2. **Configure EAS for this project:**
   ```bash
   eas build:configure
   ```
   This will link the project to your Expo account and create/update `eas.json`.

3. **Set up EAS Secrets (required for builds):**
   ```bash
   eas secret:create --name EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN --value pk.your_token_here
   eas secret:create --name MAPBOX_DOWNLOAD_TOKEN --value sk.your_download_token_here
   ```

---

## Building the Development APK (Android)

### Build Command:
```bash
eas build --profile development --platform android
```

Or use the npm script:
```bash
npm run build:android:dev
```

### What Happens:
- EAS will build an APK with development client capabilities
- The APK includes all native modules (Mapbox, etc.)
- Build typically takes 10-20 minutes

### Installing on Device:
1. After build completes, EAS provides a QR code
2. Scan with your Android device to download
3. Or download the APK directly from the EAS dashboard
4. Install by opening the downloaded APK file

---

## Building the Development IPA (iOS)

### Build Command:
```bash
eas build --profile development --platform ios
```

Or use the npm script:
```bash
npm run build:ios:dev
```

### Requirements:
- Apple Developer account (free tier works for development)
- Device must be registered with your Apple Developer account

### Installing on Device:
1. After build completes, EAS provides installation options
2. For registered devices: Use QR code or direct install
3. For Simulator: Download and drag to Simulator

---

## Running the App with Development Client

After installing the development build on your device:

### Start the Development Server:
```bash
npx expo start --dev-client
```

Or use the npm script:
```bash
npm run start:dev-client
```

### Connect Your Device:
1. Open the installed Hitchr app on your device
2. The app will automatically connect to the development server
3. Or scan the QR code shown in the terminal

---

## Build Profiles

| Profile | Purpose | Output |
|---------|---------|--------|
| `development` | Local testing with dev client | APK/IPA with debugging |
| `preview` | Internal testing/QA | APK/IPA without dev client |
| `production` | App store release | AAB (Android) / IPA (iOS) |

### Build Commands:

```bash
# Development builds
npm run build:android:dev
npm run build:ios:dev

# Preview builds (for internal testing)
npm run build:android:preview
npm run build:ios:preview

# Production builds (for app store)
npm run build:android:prod
npm run build:ios:prod
```

---

## Troubleshooting

### "Mapbox token not found" error
- Ensure `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in your environment
- For EAS builds, add it as an EAS secret

### Build fails with Gradle error (Android)
- Clear the build cache: `expo prebuild --clean`
- Ensure Java 17 is installed

### Build fails with CocoaPods error (iOS)
- Clear pods: `cd ios && pod deintegrate && pod install`
- Ensure Xcode Command Line Tools are installed

### App crashes on launch
- Check that all native modules are compatible with your Expo SDK version
- Review EAS build logs for native dependency issues

### Location not working
- Ensure location permissions are granted on the device
- Check that `expo-location` is properly configured

---

## Important Notes

1. **Expo Go is NOT supported** - This app requires a custom development build due to native Mapbox modules.

2. **Mapbox Token Security** - Never commit your Mapbox token to version control. Use EAS secrets for production builds.

3. **First Build Takes Longer** - The first EAS build caches dependencies, subsequent builds are faster.

4. **Native Changes Require Rebuild** - If you modify native code or add new native packages, you must create a new development build.

---

## Quick Reference

```bash
# Build and install development client
eas build --profile development --platform android

# Start development server
npx expo start --dev-client

# Clear native builds and regenerate
expo prebuild --clean
```

For more information, visit:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Mapbox React Native SDK](https://github.com/rnmapbox/maps)

