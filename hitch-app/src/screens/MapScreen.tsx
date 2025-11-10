// src/screens/MapScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from 'react-native';
// Type definitions for map components
type RegionType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Import map components (will be null on web due to Metro config)
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/MapComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import locationService from '../services/location';
import socketService from '../services/socket';

interface Pilot {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalRides: number;
  latitude: number;
  longitude: number;
  distance: number;
  vehicle?: {
    type: string;
    model: string;
  };
}

export default function MapScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<RegionType | null>(null);
  const [showList, setShowList] = useState(Platform.OS === 'web'); // Always show list on web
  const mapRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request location permission and get current location
  useEffect(() => {
    initializeLocation();
  }, []);

  // Set up Socket.io listeners for real-time updates
  useEffect(() => {
    if (!socketService.isConnected()) {
      return;
    }

    // Listen for proximity matches
    socketService.on('proximity_match', (data: any) => {
      console.log('Proximity match detected:', data);
      Alert.alert(
        'Pilot Nearby!',
        `${data.pilotName || 'A pilot'} is within range. Confirm to start ride?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              // Navigate to confirmation screen or auto-confirm
              if (data.rideId) {
                navigation.navigate('RideActive', {
                  rideId: data.rideId,
                  pilotId: data.pilotId,
                  pilotName: data.pilotName,
                });
              }
            },
          },
        ]
      );
    });

    // Listen for pilot location updates
    socketService.on('pilot_location_update', (data: any) => {
      setPilots((prevPilots) =>
        prevPilots.map((pilot) =>
          pilot.id === data.pilotId
            ? { ...pilot, latitude: data.latitude, longitude: data.longitude }
            : pilot
        )
      );
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.off('proximity_match');
      socketService.off('pilot_location_update');
    };
  }, [navigation]);

  const initializeLocation = async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      setLocationPermission(hasPermission);

      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          const loc = { lat: location.latitude, lng: location.longitude };
          setUserLocation(loc);
          setMapRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          fetchNearbyPilots(loc.lat, loc.lng);
        } else {
          // Fallback to default location
          const defaultLoc = { lat: 27.8974, lng: 78.0880 };
          setUserLocation(defaultLoc);
          setMapRegion({
            latitude: defaultLoc.lat,
            longitude: defaultLoc.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
        }
      } else {
        // No permission - use default location
        const defaultLoc = { lat: 27.8974, lng: 78.0880 };
        setUserLocation(defaultLoc);
        setMapRegion({
          latitude: defaultLoc.lat,
          longitude: defaultLoc.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
        Alert.alert(
          'Location Permission',
          'Please enable location services to see pilots near you.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Location initialization error:', error);
      const defaultLoc = { lat: 27.8974, lng: 78.0880 };
      setUserLocation(defaultLoc);
      setMapRegion({
        latitude: defaultLoc.lat,
        longitude: defaultLoc.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
    }
  };

  const fetchNearbyPilots = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const pilots = await api.getNearbyPilots(lat, lng, 5000);
      setPilots(pilots || []);
      
      // Animate list appearance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web', // Native driver not supported on web
      }).start();
    } catch (error: any) {
      console.error('Error fetching pilots:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to fetch nearby pilots. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => userLocation && fetchNearbyPilots(userLocation.lat, userLocation.lng) },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      // Try to get fresh location
      const location = await locationService.getCurrentLocation();
      if (location) {
        const loc = { lat: location.latitude, lng: location.longitude };
        setUserLocation(loc);
        if (Platform.OS !== 'web' && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
        fetchNearbyPilots(loc.lat, loc.lng);
      } else {
        fetchNearbyPilots(userLocation.lat, userLocation.lng);
      }
    }
  };

  const focusOnPilot = (pilot: Pilot) => {
    if (Platform.OS !== 'web' && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pilot.latitude,
        longitude: pilot.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
    setSelectedPilot(pilot.id);
    // On web, scroll to pilot in list
    if (Platform.OS === 'web') {
      setShowList(true);
    }
  };

  const handleRequestRide = async (pilotId: string) => {
    if (!userLocation) {
      Alert.alert('Error', 'Location not available. Please enable location services.');
      return;
    }

    try {
      setLoading(true);
      // For now, use current location as origin and a nearby point as destination
      // In real app, user would select destination
      const destinationLat = userLocation.lat + 0.01;
      const destinationLng = userLocation.lng + 0.01;
      
      const response = await api.notifyRide({
        pilotId,
        originLat: userLocation.lat,
        originLng: userLocation.lng,
        destinationLat,
        destinationLng,
        destinationAddress: 'Destination',
      });
      
      if (response.success) {
        // Navigate to pending screen
        navigation.navigate('RidePending', {
          rideId: response.ride.id,
          pilotId,
          pilotName: pilots.find(p => p.id === pilotId)?.name,
        });
      }
    } catch (error: any) {
      console.error('Error requesting ride:', error);
      Alert.alert(
        'Request Failed',
        error.message || 'Failed to request ride. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (pilot: Pilot) => {
    navigation.navigate('PilotProfile', { pilot });
  };

  if (loading && pilots.length === 0 && !userLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubtext}>Finding nearby pilots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Ionicons name="wallet" size={20} color="#F59E0B" />
          <Text style={styles.tokenText}>{user?.token_balance || 0}</Text>
        </View>
      </View>

      {/* Map View */}
      {mapRegion && (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            // Web fallback - show list view instead of map
            <View style={styles.webMapPlaceholder}>
              <View style={styles.webMapHeader}>
                <Ionicons name="map-outline" size={48} color="#CBD5E1" />
                <Text style={styles.webMapTitle}>Map View</Text>
                <Text style={styles.webMapSubtitle}>
                  Interactive map available on mobile devices
                </Text>
                {userLocation && (
                  <View style={styles.webLocationInfo}>
                    <Ionicons name="location" size={16} color="#3B82F6" />
                    <Text style={styles.webLocationText}>
                      Your Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            Platform.OS !== 'web' && MapView && (
              <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={mapRegion}
                showsUserLocation={locationPermission}
                showsMyLocationButton={false}
                showsCompass={true}
                toolbarEnabled={false}
                onRegionChangeComplete={setMapRegion}
              >
                {/* User Location Marker */}
                {userLocation && Marker && (
                  <Marker
                    coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
                    title="Your Location"
                    pinColor="#3B82F6"
                  >
                    <View style={styles.userMarker}>
                      <View style={styles.userMarkerInner} />
                    </View>
                  </Marker>
                )}

                {/* Pilot Markers */}
                {Marker && pilots.map((pilot) => (
                  <Marker
                    key={pilot.id}
                    coordinate={{ latitude: pilot.latitude, longitude: pilot.longitude }}
                    title={pilot.name}
                    description={`⭐ ${pilot.rating?.toFixed(1) || '4.8'} • ${(pilot.distance / 1000).toFixed(1)} km`}
                    onPress={() => focusOnPilot(pilot)}
                  >
                    <Animated.View
                      style={[
                        styles.pilotMarker,
                        selectedPilot === pilot.id && styles.pilotMarkerSelected,
                      ]}
                    >
                      <Ionicons name="car" size={24} color="#FFFFFF" />
                      {selectedPilot === pilot.id && (
                        <View style={styles.selectedRing} />
                      )}
                    </Animated.View>
                  </Marker>
                ))}
              </MapView>
            )
          )}

          {/* Map Controls */}
          {Platform.OS !== 'web' && (
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons name="refresh" size={20} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={() => {
                  if (userLocation && mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: userLocation.lat,
                      longitude: userLocation.lng,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }, 1000);
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapControlButton, showList && styles.mapControlButtonActive]}
                onPress={() => setShowList(!showList)}
              >
                <Ionicons name={showList ? "map" : "list"} size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Web: Always show list toggle */}
          {Platform.OS === 'web' && (
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons name="refresh" size={20} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapControlButton, showList && styles.mapControlButtonActive]}
                onPress={() => setShowList(!showList)}
              >
                <Ionicons name={showList ? "eye-off" : "list"} size={20} color="#0F172A" />
                <Text style={styles.mapControlText}>{showList ? 'Hide' : 'Show'} List</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Location Info Badge */}
          {userLocation && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={16} color="#3B82F6" />
              <Text style={styles.locationBadgeText}>
                {locationPermission ? 'Live Location' : 'Default Location'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Pilots List - Always visible on web, toggleable on mobile */}
      {(Platform.OS === 'web' || showList) && (
        <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              {pilots.length} Pilot{pilots.length !== 1 ? 's' : ''} Nearby
            </Text>
            <TouchableOpacity onPress={() => setShowList(false)}>
              <Ionicons name="chevron-down" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.pilotsScrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {pilots.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No pilots nearby</Text>
                <Text style={styles.emptySubtext}>Try refreshing or check back later</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <Ionicons name="refresh" size={18} color="#F59E0B" />
                  <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              pilots.map((pilot) => (
                <TouchableOpacity
                  key={pilot.id}
                  style={[
                    styles.pilotCard,
                    selectedPilot === pilot.id && styles.pilotCardSelected,
                  ]}
                  onPress={() => focusOnPilot(pilot)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pilotHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {pilot.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.pilotInfo}>
                      <Text style={styles.pilotName}>{pilot.name}</Text>
                      <View style={styles.pilotMeta}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.pilotRating}>{pilot.rating?.toFixed(1) || '4.8'}</Text>
                        <Text style={styles.pilotSeparator}>•</Text>
                        <Text style={styles.pilotRides}>{pilot.totalRides || 0} rides</Text>
                        {pilot.distance && (
                          <>
                            <Text style={styles.pilotSeparator}>•</Text>
                            <Text style={styles.pilotDistance}>{(pilot.distance / 1000).toFixed(1)} km</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.pilotActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewProfileButton]}
                      onPress={() => handleViewProfile(pilot)}
                    >
                      <Ionicons name="person-outline" size={18} color="#3B82F6" />
                      <Text style={styles.viewProfileText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.requestButton,
                        selectedPilot === pilot.id && styles.requestButtonSelected,
                      ]}
                      onPress={() => {
                        if (selectedPilot === pilot.id) {
                          handleRequestRide(pilot.id);
                        } else {
                          setSelectedPilot(pilot.id);
                          focusOnPilot(pilot);
                        }
                      }}
                    >
                      <Ionicons 
                        name={selectedPilot === pilot.id ? "checkmark-circle" : "car"} 
                        size={18} 
                        color="white" 
                      />
                      <Text style={styles.requestButtonText}>
                        {selectedPilot === pilot.id ? 'Confirm' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mapControlButtonActive: {
    backgroundColor: '#F59E0B',
  },
  locationBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pilotMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pilotMarkerSelected: {
    backgroundColor: '#10B981',
    transform: [{ scale: 1.2 }],
  },
  selectedRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  pilotsScrollView: {
    maxHeight: 400,
  },
  pilotCardSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  pilotCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pilotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pilotInfo: {
    flex: 1,
  },
  pilotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pilotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pilotRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FBBF24',
  },
  pilotSeparator: {
    fontSize: 13,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  pilotRides: {
    fontSize: 13,
    color: '#64748B',
  },
  pilotDistance: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  pilotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewProfileButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  requestButton: {
    backgroundColor: '#F59E0B',
  },
  requestButtonSelected: {
    backgroundColor: '#10B981',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  webMapPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapHeader: {
    alignItems: 'center',
    padding: 32,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  webMapSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  webLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  webLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  mapControlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 4,
  },
});