// src/screens/MapScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import locationService from '../services/location';
import PilotProfileModal from '../components/PilotProfileModal';

const { width, height } = Dimensions.get('window');

interface Pilot {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  latitude: number;
  longitude: number;
  distance: number;
  vehicle?: { type: string; model: string };
}

export default function MapScreen({ navigation }: any) {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Request location permission and get current location
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          const loc = { lat: location.latitude, lng: location.longitude };
          setUserLocation(loc);
          fetchNearbyPilots(loc.lat, loc.lng);
        } else {
          // Fallback to default location (Aligarh)
          const defaultLoc = { lat: 28.6139, lng: 77.2090 };
          setUserLocation(defaultLoc);
          fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
        }
      } else {
        // Fallback if permission denied
        const defaultLoc = { lat: 28.6139, lng: 77.2090 };
        setUserLocation(defaultLoc);
        fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
        Alert.alert('Location Permission', 'Please enable location to find nearby pilots');
      }
    } catch (error) {
      console.error('Location initialization error:', error);
      const defaultLoc = { lat: 28.6139, lng: 77.2090 };
      setUserLocation(defaultLoc);
      fetchNearbyPilots(defaultLoc.lat, defaultLoc.lng);
    }
  };

  const fetchNearbyPilots = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const response = await api.getNearbyPilots(lat, lng, 5000); // 5km radius
      setPilots(response.pilots || []);
    } catch (error) {
      console.error('Error fetching pilots:', error);
      setPilots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (userLocation) {
      setRefreshing(true);
      fetchNearbyPilots(userLocation.lat, userLocation.lng);
    }
  };

  const handlePilotPress = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setShowProfileModal(true);
    // Center map on pilot
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pilot.latitude,
        longitude: pilot.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleNotifyPilot = async () => {
    if (!selectedPilot || !userLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    setShowProfileModal(false);
    
    try {
      setLoading(true);
      // Mock destination (will be replaced with location picker)
      const mockDestination = {
        lat: userLocation.lat + 0.01,
        lng: userLocation.lng + 0.01,
      };

      const response = await api.notifyRide({
        pilotId: selectedPilot.id,
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: mockDestination,
      });

      if (response.success) {
        navigation.navigate('NotificationSent', {
          rideId: response.ride.id,
          pilotId: selectedPilot.id,
          pilotName: selectedPilot.name,
        });
      }
    } catch (error: any) {
      console.error('Error notifying pilot:', error);
      Alert.alert('Error', error.message || 'Failed to notify pilot');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    if (selectedPilot) {
      setShowProfileModal(false);
      navigation.navigate('PilotProfile', { pilot: selectedPilot });
    }
  };

  if (!userLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title="Your Location"
          pinColor={theme.colors.secondary}
        />

        {/* Pilot Markers */}
        {pilots.map((pilot, index) => (
          <Marker
            key={pilot.id}
            coordinate={{
              latitude: pilot.latitude,
              longitude: pilot.longitude,
            }}
            title={pilot.name}
            description={`${pilot.rating.toFixed(1)} ⭐ • ${pilot.distance}m away`}
            onPress={() => handlePilotPress(pilot)}
          >
            <View style={styles.pilotMarker}>
              <View style={styles.pilotMarkerInner}>
                <Text style={styles.pilotMarkerText}>P{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Bar - Token Balance */}
      <View style={styles.topBar}>
        <View style={styles.tokenBadge}>
          <Ionicons name="wallet" size={20} color={theme.colors.primary} />
          <Text style={styles.tokenText}>{user?.token_balance || 0}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="flag" size={20} color={theme.colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>🏁 Where are you going?</Text>
      </View>

      {/* Nearby Pilots Card */}
      {pilots.length > 0 && (
        <View style={styles.pilotsCard}>
          <View style={styles.pilotsCardHeader}>
            <Text style={styles.pilotsCardTitle}>
              {pilots.length} Pilot{pilots.length !== 1 ? 's' : ''} Nearby
            </Text>
            <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
              <Ionicons
                name="refresh"
                size={20}
                color={theme.colors.primary}
                style={{ opacity: refreshing ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pilotsList}
          >
            {pilots.map((pilot) => (
              <TouchableOpacity
                key={pilot.id}
                style={[
                  styles.pilotCard,
                  selectedPilot?.id === pilot.id && styles.pilotCardSelected,
                ]}
                onPress={() => handlePilotPress(pilot)}
              >
                <View style={styles.pilotCardAvatar}>
                  <Text style={styles.pilotCardAvatarText}>
                    {pilot.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pilotCardName} numberOfLines={1}>
                  {pilot.name}
                </Text>
                <View style={styles.pilotCardMeta}>
                  <Ionicons name="star" size={12} color={theme.colors.warning} />
                  <Text style={styles.pilotCardRating}>{pilot.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.pilotCardDistance}>
                  {(pilot.distance / 1000).toFixed(1)} km
                </Text>
                <TouchableOpacity
                  style={styles.pilotCardButton}
                  onPress={() => handlePilotPress(pilot)}
                >
                  <Ionicons name="person" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {!loading && pilots.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={styles.emptyText}>No pilots nearby</Text>
          <Text style={styles.emptySubtext}>Try refreshing or check back later</Text>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Finding nearby pilots...</Text>
        </View>
      )}

      {/* Pilot Profile Modal */}
      <PilotProfileModal
        visible={showProfileModal}
        pilot={selectedPilot}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedPilot(null);
        }}
        onNotify={handleNotifyPilot}
        onViewFullProfile={handleViewFullProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  map: {
    width: width,
    height: height,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...theme.shadows.md,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    ...theme.shadows.md,
    zIndex: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  pilotsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: 200,
    ...theme.shadows.xl,
  },
  pilotsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pilotsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  pilotsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pilotCard: {
    width: 120,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  pilotCardSelected: {
    backgroundColor: theme.colors.primaryLight + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pilotCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pilotCardAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  pilotCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  pilotCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pilotCardRating: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  pilotCardDistance: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  pilotCardButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  pilotMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  pilotMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotMarkerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.white,
  },
  emptyState: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
