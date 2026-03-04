// src/components/UniversalMap.native.tsx
// Native Mapbox implementation for iOS and Android

import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { StyleSheet, View, Platform, Text, Linking, TouchableOpacity } from 'react-native';
import type { UniversalMapProps, MapMarkerData } from './UniversalMap.types';
import { MAPBOX_ACCESS_TOKEN } from '../constants/config';

// Check if we have a valid token
const hasValidToken = Boolean(MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN.startsWith('pk.'));

// Default center (Bangalore, India)
const DEFAULT_CENTER = { latitude: 12.9716, longitude: 77.5946 };

// Try to import Mapbox - it may not be available in Expo Go
let Mapbox: any = null;
let MapView: any = null;
let Camera: any = null;
let MarkerView: any = null;
let UserLocation: any = null;
let isMapboxAvailable = false;

try {
  const mapboxModule = require('@rnmapbox/maps');
  Mapbox = mapboxModule.default;
  MapView = mapboxModule.MapView;
  Camera = mapboxModule.Camera;
  MarkerView = mapboxModule.MarkerView;
  UserLocation = mapboxModule.UserLocation;
  
  // Initialize Mapbox with access token only if valid
  if (hasValidToken && Mapbox) {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }
  
  isMapboxAvailable = true;
} catch (error) {
  console.log('Mapbox native module not available. Using fallback UI.');
  isMapboxAvailable = false;
}

// Memoized marker component to prevent unnecessary re-renders
const MapMarker = memo(({
  marker,
  onPress,
}: {
  marker: MapMarkerData;
  onPress?: (id: string) => void;
}) => {
  const handlePress = useCallback(() => {
    onPress?.(marker.id);
  }, [marker.id, onPress]);

  if (!MarkerView) return null;

  return (
    <MarkerView
      id={marker.id}
      coordinate={[marker.longitude, marker.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <TouchableOpacity
        style={[
          styles.markerContainer,
          { backgroundColor: marker.color || '#f97316' },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.markerText}>{marker.label || '•'}</Text>
      </TouchableOpacity>
    </MarkerView>
  );
});

// Fallback component when Mapbox isn't available
const MapFallback = memo(({ 
  style, 
  markers = [],
  reason = 'native_unavailable'
}: { 
  style?: any; 
  markers?: MapMarkerData[];
  reason?: 'native_unavailable' | 'no_token';
}) => {
  const handlePress = useCallback(() => {
    if (reason === 'native_unavailable') {
      Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/');
    } else {
      Linking.openURL('https://account.mapbox.com/access-tokens/');
    }
  }, [reason]);

  return (
    <View style={[styles.container, styles.fallbackContainer, style]}>
      <Text style={styles.fallbackEmoji}>🗺️</Text>
      <Text style={styles.fallbackTitle}>
        {reason === 'native_unavailable' 
          ? 'Development Build Required' 
          : 'Mapbox Token Required'}
      </Text>
      <Text style={styles.fallbackText}>
        {reason === 'native_unavailable'
          ? 'Mapbox maps require a development build. Expo Go does not support native map modules.'
          : 'Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.'}
      </Text>
      <TouchableOpacity style={styles.fallbackButton} onPress={handlePress}>
        <Text style={styles.fallbackButtonText}>
          {reason === 'native_unavailable' ? 'Learn More' : 'Get Token'}
        </Text>
      </TouchableOpacity>
      {markers.length > 0 && (
        <Text style={styles.fallbackMarkerCount}>
          {markers.length} markers ready to display
        </Text>
      )}
    </View>
  );
});

const UniversalMap: React.FC<UniversalMapProps> = ({
  style,
  center,
  zoom = 13,
  markers = [],
  routes = [],
  onMarkerPress,
  showUserLocation = true, // Enable by default
  onRegionChange,
}) => {
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [followUserLocation, setFollowUserLocation] = useState(true);

  // Show fallback UI if Mapbox native module isn't available
  if (!isMapboxAvailable) {
    return <MapFallback style={style} markers={markers} reason="native_unavailable" />;
  }

  // Show fallback UI if no valid token
  if (!hasValidToken) {
    return <MapFallback style={style} markers={markers} reason="no_token" />;
  }

  // Calculate center coordinates
  const mapCenter = center || DEFAULT_CENTER;
  const centerCoordinate: [number, number] = [
    mapCenter.longitude,
    mapCenter.latitude,
  ];

  // Handle marker press
  const handleMarkerPress = useCallback(
    (markerId: string) => {
      onMarkerPress?.(markerId);
    },
    [onMarkerPress]
  );

  // Recenter to user location
  const handleRecenter = useCallback(() => {
    if (cameraRef.current && center) {
      setFollowUserLocation(true);
      cameraRef.current.setCamera({
        centerCoordinate: [center.longitude, center.latitude],
        zoomLevel: zoom,
        animationDuration: 1000,
        animationMode: 'flyTo',
      });
    }
  }, [center, zoom]);

  // Animate to new center when it changes
  useEffect(() => {
    if (cameraRef.current && center && followUserLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [center.longitude, center.latitude],
        zoomLevel: zoom,
        animationDuration: 500,
      });
    }
  }, [center?.latitude, center?.longitude, zoom, followUserLocation]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox?.StyleURL?.Street || 'mapbox://styles/mapbox/streets-v12'}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
        compassEnabled={true}
        compassPosition={{ top: 80, right: 8 }}
        scaleBarEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={true}
        onTouchStart={() => setFollowUserLocation(false)}
      >
        {/* Camera control */}
        {Camera && (
          <Camera
            ref={cameraRef}
            zoomLevel={zoom}
            centerCoordinate={centerCoordinate}
            animationMode="flyTo"
            animationDuration={0}
          />
        )}

        {/* User location indicator with accuracy circle */}
        {showUserLocation && UserLocation && (
          <UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
            renderMode="native"
            minDisplacement={10}
            androidRenderMode="compass"
          />
        )}

        {/* Render markers */}
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            marker={marker}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Recenter Button */}
      <TouchableOpacity
        style={[
          styles.recenterButton,
          followUserLocation && styles.recenterButtonActive,
        ]}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Text style={styles.recenterIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  markerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recenterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recenterIcon: {
    fontSize: 20,
  },
  fallbackContainer: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  fallbackButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackMarkerCount: {
    marginTop: 16,
    fontSize: 13,
    color: '#94a3b8',
  },
});

export default memo(UniversalMap);
