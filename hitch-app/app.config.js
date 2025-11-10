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
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hitchr.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Hitchr needs your location to find nearby rides and track your journey.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Hitchr needs your location to find nearby rides and track your journey."
      }
    },
    android: {
      package: "com.hitchr.app",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      // Inject CSS to ensure proper rendering on web
      favicon: "./assets/icon.png"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Hitchr to use your location to find nearby rides."
        }
      ]
    ]
  }
};

