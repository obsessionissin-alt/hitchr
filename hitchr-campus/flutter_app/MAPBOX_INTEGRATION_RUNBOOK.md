# Mapbox Flutter Integration Runbook
**Last Updated:** February 2025  
**Target Platform:** Android (iOS to follow)

## Table of Contents
1. [Package Recommendation](#package-recommendation)
2. [Android Setup](#android-setup)
3. [Token Management (Local-Only)](#token-management-local-only)
4. [Minimal Implementation](#minimal-implementation)
5. [Known Pitfalls](#known-pitfalls)

---

## Package Recommendation

### Use: `mapbox_maps_flutter` (Official)

**Why:**
- ✅ **Official Mapbox package** - maintained by Mapbox team
- ✅ **Latest SDK** - based on Mapbox Maps SDK v11.18.0+
- ✅ **Active development** - current version 2.18.0+ (as of Feb 2025)
- ✅ **Verified publisher** - published by mapbox.com
- ✅ **Future-proof** - official support and roadmap alignment

**Avoid:** `mapbox_gl_flutter` (community-driven, older codebase)

**Requirements:**
- Flutter SDK 3.22.3+ / Dart SDK 3.4.4+
- Android SDK 21+ (minSdk)
- iOS 14+ (when implementing iOS)

---

## Android Setup

### Step 1: Add Dependency

Add to `pubspec.yaml`:

```yaml
dependencies:
  mapbox_maps_flutter: ^2.18.0
```

Then run:
```bash
flutter pub get
```

### Step 2: Update Android Gradle Configuration

#### 2a. Update `android/app/build.gradle.kts`

Ensure minimum SDK is 21+:

```kotlin
android {
    namespace = "com.hitchr.hitchr_campus"
    compileSdk = flutter.compileSdkVersion
    
    defaultConfig {
        applicationId = "com.hitchr.hitchr_campus"
        minSdk = 21  // Mapbox requires 21+
        targetSdk = flutter.targetSdkVersion
        // ... rest of config
    }
    
    // ... rest of config
}
```

#### 2b. Update `android/build.gradle.kts` (if needed)

Ensure repositories include Maven Central:

```kotlin
allprojects {
    repositories {
        google()
        mavenCentral()  // Required for Mapbox
        // ... other repos
    }
}
```

### Step 3: Android Manifest Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Location permissions (if using user location) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <!-- Internet permission (required for map tiles) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:label="hitchr_campus"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <!-- ... existing activity config ... -->
    </application>
</manifest>
```

### Step 4: ProGuard Rules (Release Builds)

Create `android/app/proguard-rules.pro`:

```proguard
# Mapbox Maps SDK
-keep class com.mapbox.** { *; }
-keep class com.mapbox.maps.** { *; }
-dontwarn com.mapbox.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
```

Then reference it in `android/app/build.gradle.kts`:

```kotlin
android {
    // ... existing config
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

---

## Token Management (Local-Only)

### Strategy 1: `local.properties` (Recommended for Android)

**Pros:** Simple, Android-native, already in `.gitignore`

1. Add token to `android/local.properties`:
```properties
sdk.dir=/path/to/android/sdk
flutter.sdk=/path/to/flutter/sdk
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsbXh4eHh4eHh4eHh4In0.xxxxxxxxxxxx
```

2. Read in `android/app/build.gradle.kts`:
```kotlin
// Read from local.properties
val localProperties = java.util.Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localProperties.load(java.io.FileInputStream(localPropertiesFile))
}

android {
    defaultConfig {
        // ... existing config
        
        // Set as build config field
        val mapboxToken = localProperties.getProperty("MAPBOX_ACCESS_TOKEN") ?: ""
        buildConfigField("String", "MAPBOX_ACCESS_TOKEN", "\"$mapboxToken\"")
    }
}
```

3. Access in Kotlin/Java code (if needed):
```kotlin
val token = BuildConfig.MAPBOX_ACCESS_TOKEN
```

4. **Important:** Ensure `android/local.properties` is in `.gitignore`:
```
# Already should be there, but verify:
android/local.properties
```

### Strategy 2: `--dart-define` (Cross-Platform)

**Pros:** Works for both Android and iOS, runtime configurable

1. Run with token:
```bash
flutter run --dart-define=MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsbXh4eHh4eHh4eHh4In0.xxxxxxxxxxxx
```

2. Access in Dart:
```dart
const mapboxToken = String.fromEnvironment('MAPBOX_TOKEN', defaultValue: '');
```

3. Set token before map initialization:
```dart
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set token from environment
  final token = const String.fromEnvironment('MAPBOX_TOKEN');
  if (token.isNotEmpty) {
    MapboxOptions.setAccessToken(token);
  }
  
  runApp(MyApp());
}
```

4. **For IDE runs:** Create launch configurations:
   - VS Code: `.vscode/launch.json`
   - Android Studio: Run configurations with `--dart-define=MAPBOX_TOKEN=...`

### Strategy 3: Resource File (Android-Only, Not Recommended)

**Note:** This requires committing the resource file structure (but not the token value). Less flexible.

Create `android/app/src/main/res/values/mapbox_access_token.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
  <string name="mapbox_access_token" translatable="false" tools:ignore="UnusedResources">
    YOUR_TOKEN_HERE
  </string>
</resources>
```

**Recommendation:** Use Strategy 1 (`local.properties`) for Android-first development, then add Strategy 2 for cross-platform support.

---

## Minimal Implementation

### 1. Initialize Mapbox (in `main.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set access token (from --dart-define or local.properties)
  const token = String.fromEnvironment('MAPBOX_TOKEN');
  if (token.isNotEmpty) {
    MapboxOptions.setAccessToken(token);
  }
  
  runApp(MyApp());
}
```

### 2. Replace `MiniMapView` Widget

Update `lib/widgets/hitchr_widgets.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../models/waypoint.dart';

class MiniMapView extends StatefulWidget {
  final double height;
  final Waypoint? fromPoint;
  final Waypoint? toPoint;
  
  const MiniMapView({
    super.key,
    this.height = 160,
    this.fromPoint,
    this.toPoint,
  });

  @override
  State<MiniMapView> createState() => _MiniMapViewState();
}

class _MiniMapViewState extends State<MiniMapView> {
  MapboxMap? mapboxMap;
  PointAnnotationManager? pointAnnotationManager;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(HRadius.lg),
        border: Border.all(color: HColors.gray200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(HRadius.lg),
        child: MapWidget(
          onMapCreated: _onMapCreated,
        ),
      ),
    );
  }

  void _onMapCreated(MapboxMap mapboxMap) {
    this.mapboxMap = mapboxMap;
    
    // Wait for map to load, then add markers and fit camera
    mapboxMap.mapboxMap.onMapLoaded.listen((_) {
      _addMarkers();
      _fitCamera();
    });
  }

  Future<void> _addMarkers() async {
    if (mapboxMap == null) return;
    
    // Create annotation manager
    pointAnnotationManager = await mapboxMap!.annotations.createPointAnnotationManager();
    
    final annotations = <PointAnnotationOptions>[];
    
    // Add "from" marker (red/coral)
    if (widget.fromPoint != null) {
      annotations.add(
        PointAnnotationOptions(
          geometry: Point(
            coordinates: Position(
              widget.fromPoint!.lng,
              widget.fromPoint!.lat,
            ),
          ),
          image: _createMarkerIcon(HColors.coral500, Icons.navigation),
          iconSize: 1.0,
        ),
      );
    }
    
    // Add "to" marker (blue)
    if (widget.toPoint != null) {
      annotations.add(
        PointAnnotationOptions(
          geometry: Point(
            coordinates: Position(
              widget.toPoint!.lng,
              widget.toPoint!.lat,
            ),
          ),
          image: _createMarkerIcon(HColors.trustBlue, Icons.place),
          iconSize: 1.0,
        ),
      );
    }
    
    if (annotations.isNotEmpty) {
      await pointAnnotationManager!.createMulti(annotations);
    }
  }

  Future<Uint8List> _createMarkerIcon(Color color, IconData icon) async {
    // Create a simple colored circle with icon
    // For production, use proper image assets or Mapbox's built-in markers
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final size = 40.0;
    
    // Draw circle
    final paint = Paint()..color = color;
    canvas.drawCircle(Offset(size / 2, size / 2), size / 2, paint);
    
    // Draw icon (simplified - use proper icon rendering)
    final iconPaint = Paint()..color = Colors.white;
    // ... icon drawing logic ...
    
    final picture = recorder.endRecording();
    final image = await picture.toImage(size.toInt(), size.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }

  Future<void> _fitCamera() async {
    if (mapboxMap == null) return;
    
    final points = <Position>[];
    if (widget.fromPoint != null) {
      points.add(Position(widget.fromPoint!.lng, widget.fromPoint!.lat));
    }
    if (widget.toPoint != null) {
      points.add(Position(widget.toPoint!.lng, widget.toPoint!.lat));
    }
    
    if (points.isEmpty) {
      // Default to a reasonable location (e.g., Delhi University area)
      await mapboxMap!.camera.flyTo(
        CameraOptions(
          center: Point(coordinates: Position(77.2090, 28.6139)),
          zoom: 12.0,
        ),
      );
      return;
    }
    
    // Calculate bounds
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    
    for (final point in points) {
      minLng = minLng < point.longitude ? minLng : point.longitude;
      maxLng = maxLng > point.longitude ? maxLng : point.longitude;
      minLat = minLat < point.latitude ? minLat : point.latitude;
      maxLat = maxLat > point.latitude ? maxLat : point.latitude;
    }
    
    // Add padding
    final padding = 0.1;
    final lngPadding = (maxLng - minLng) * padding;
    final latPadding = (maxLat - minLat) * padding;
    
    await mapboxMap!.camera.flyTo(
      CameraOptions(
        bounds: CoordinateBounds(
          southwest: Point(coordinates: Position(minLng - lngPadding, minLat - latPadding)),
          northeast: Point(coordinates: Position(maxLng + lngPadding, maxLat + latPadding)),
        ),
        padding: EdgeInsets.all(16),
      ),
    );
  }
}
```

**Note:** The marker icon creation above is simplified. For production:
- Use Mapbox's built-in marker images
- Or create proper image assets
- Or use a package like `flutter_svg` for vector markers

### 3. Update Screens to Pass Waypoints

Example for `route_detail_screen.dart`:

```dart
MiniMapView(
  height: 180,
  fromPoint: r.fromPoint,
  toPoint: r.toPoint,
),
```

### 4. Lightweight Styling

Set a custom style when creating the map:

```dart
MapWidget(
  onMapCreated: _onMapCreated,
  styleUri: MapboxStyles.MAPBOX_STREETS, // or MAPBOX_SATELLITE, MAPBOX_DARK, etc.
),
```

Or use a custom style URL:
```dart
styleUri: 'mapbox://styles/yourusername/yourstyleid',
```

---

## Known Pitfalls

### Android-Specific Issues

1. **Token Not Set Error**
   - **Symptom:** `MapboxException: Access token is not set`
   - **Fix:** Ensure token is set before `MapWidget` initialization
   - **Check:** Verify `MapboxOptions.setAccessToken()` is called in `main()`

2. **Build Failures on Linux**
   - **Symptom:** Gradle sync fails, missing dependencies
   - **Fix:** 
     - Ensure `mavenCentral()` is in repositories
     - Run `flutter clean && flutter pub get`
     - Invalidate Android Studio caches if using IDE

3. **ProGuard Obfuscation**
   - **Symptom:** Release builds crash or map doesn't render
   - **Fix:** Add ProGuard rules (see Step 4 in Android Setup)

4. **minSdk Version**
   - **Symptom:** App crashes on older Android devices
   - **Fix:** Ensure `minSdk = 21` in `build.gradle.kts`

5. **Internet Permission**
   - **Symptom:** Map tiles don't load
   - **Fix:** Verify `INTERNET` permission in `AndroidManifest.xml`

6. **Token in Version Control**
   - **Symptom:** Token accidentally committed to Git
   - **Fix:** 
     - Use `local.properties` (already gitignored)
     - Or use `--dart-define` (never committed)
     - Never hardcode tokens in source files

### Linux Development Issues

1. **Android SDK Path**
   - Ensure `android/local.properties` has correct `sdk.dir`
   - Verify `ANDROID_HOME` environment variable if needed

2. **Gradle Wrapper Permissions**
   - If gradle wrapper fails: `chmod +x android/gradlew`

3. **Emulator Performance**
   - Map rendering can be slow on Linux emulators
   - Test on physical device when possible
   - Use hardware acceleration: `flutter run --enable-software-rendering` (if needed)

### General Flutter Issues

1. **Hot Reload Not Working**
   - Map widgets often require full restart
   - Use `R` in terminal or "Restart" in IDE

2. **Memory Leaks**
   - Always dispose annotation managers:
   ```dart
   @override
   void dispose() {
     pointAnnotationManager?.deleteAll();
     super.dispose();
   }
   ```

3. **Initialization Order**
   - Set token before creating any `MapWidget`
   - Use `WidgetsFlutterBinding.ensureInitialized()` in `main()`

---

## Quick Checklist

- [ ] Add `mapbox_maps_flutter: ^2.18.0` to `pubspec.yaml`
- [ ] Run `flutter pub get`
- [ ] Set `minSdk = 21` in `android/app/build.gradle.kts`
- [ ] Add location permissions to `AndroidManifest.xml`
- [ ] Add ProGuard rules for release builds
- [ ] Add token to `android/local.properties` (or use `--dart-define`)
- [ ] Initialize `MapboxOptions.setAccessToken()` in `main()`
- [ ] Replace `MiniMapView` implementation
- [ ] Update screens to pass `fromPoint` and `toPoint`
- [ ] Test on Android device/emulator
- [ ] Verify token is NOT committed to Git

---

## Next Steps (iOS)

When ready for iOS:
1. Add token via `--dart-define` or Info.plist
2. Add location permissions to `Info.plist`
3. Set `platform :ios, '14.0'` in `Podfile`
4. Run `pod install` in `ios/` directory

---

## Resources

- [Official Mapbox Flutter Docs](https://docs.mapbox.com/flutter/maps/guides/)
- [Package: mapbox_maps_flutter](https://pub.dev/packages/mapbox_maps_flutter)
- [Android Setup Guide](https://docs.mapbox.com/android/maps/guides/install)
- [Flutter Map Examples](https://github.com/mapbox/mapbox-maps-flutter/tree/main/example)

---

**Remember:** Never commit your Mapbox access token to version control!
