# Mapbox Maps SDK
-keep class com.mapbox.** { *; }
-keep class com.mapbox.maps.** { *; }
-dontwarn com.mapbox.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
