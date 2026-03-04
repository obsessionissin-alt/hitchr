module.exports = {
  expo: {
    name: "Hitchr",
    slug: "hitchr",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    extra: {
      MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "PLACEHOLDER",
      eas: {
        projectId: "5872e41a-9201-4a1f-a2b4-9e2c56cf975f"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hitchr.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Hitchr uses your location to show nearby pilots and riders.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Hitchr uses your location for ride tracking.",
        NSLocationAlwaysUsageDescription: "Hitchr uses your location for continuous ride tracking.",
        UIBackgroundModes: ["location"]
      }
    },
    android: {
      package: "com.hitchr.app",
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/icon.png"
    },
    plugins: [
      "expo-dev-client",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Hitchr uses your location to show nearby pilots and riders.",
          locationAlwaysPermission: "Hitchr uses your location for ride tracking.",
          locationWhenInUsePermission: "Hitchr uses your location to find nearby rides.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox",
          RNMapboxMapsDownloadToken: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || process.env.MAPBOX_DOWNLOAD_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
        }
      ],
[
          "expo-build-properties",
          {
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              minSdkVersion: 24,
              buildToolsVersion: "35.0.0",
              kotlinVersion: "2.0.0"
            },
            ios: {
              deploymentTarget: "15.1"
            }
          }
        ]
    ]
  }
};
