import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';
import { useSimpleAuth } from '../store/SimpleAuthContext';
import { mockPilots } from '../data/mockData';
import PilotProfileModal from './PilotProfileModal';

const API_URL = 'http://localhost:3000/api/v1';

interface Pilot {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalRides: number;
  totalKm: number;
  tokens: number;
  latitude: number;
  longitude: number;
  distance: number;
  vehicle: {
    type: string;
    model: string;
    plate: string;
  };
  badges: string[];
  verified: boolean;
  achievements?: any[];
  reviews?: any[];
}

export default function EnhancedMapScreen({ navigation }: any) {
  const { user } = useSimpleAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationName, setLocationName] = useState<string>('Getting location...');

  useEffect(() => {
    initializeLocation();
  }, []);

  const getLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      // Extract readable location
      const city = data.address?.city || data.address?.town || data.address?.village;
      const state = data.address?.state;
      const country = data.address?.country;
      
      let locationStr = '';
      if (city && state) {
        locationStr = `${city}, ${state}`;
      } else if (city) {
        locationStr = city;
      } else if (state) {
        locationStr = state;
      } else if (country) {
        locationStr = country;
      } else {
        locationStr = 'Your Location';
      }
      
      console.log('📍 Location name:', locationStr);
      setLocationName(locationStr);
    } catch (error) {
      console.error('Failed to get location name:', error);
      setLocationName('Your Location');
    }
  };

  const initializeLocation = async () => {
    try {
      console.log('🌍 Requesting location permission...');
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        console.log('✅ Location permission granted, getting current position...');
        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        
        const userLoc = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        
        console.log('📍 User location:', userLoc);
        setUserLocation(userLoc);
        getLocationName(userLoc.lat, userLoc.lng);
        fetchPilots(userLoc.lat, userLoc.lng);
      } else {
        console.log('❌ Location permission denied, using default location');
        // Fallback to Bangalore
        const defaultLoc = { lat: 12.9716, lng: 77.5946 };
        setUserLocation(defaultLoc);
        setLocationName('Bangalore, Karnataka');
        fetchPilots(defaultLoc.lat, defaultLoc.lng);
        Alert.alert(
          'Location Permission',
          'Please enable location to see pilots near you.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Location error:', error);
      // Fallback to default
      const defaultLoc = { lat: 12.9716, lng: 77.5946 };
      setUserLocation(defaultLoc);
      setLocationName('Bangalore, Karnataka');
      fetchPilots(defaultLoc.lat, defaultLoc.lng);
    }
  };

  const fetchPilots = async (lat?: number, lng?: number) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const userLat = lat || userLocation?.lat || 12.9716;
      const userLng = lng || userLocation?.lng || 77.5946;
      
      console.log('🔍 Fetching pilots near:', userLat, userLng);
      
      const response = await fetch(
        `${API_URL}/pilots/nearby?lat=${userLat}&lng=${userLng}&radius=10000`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Got pilots from API:', data.pilots?.length || 0);
        
        if (data.pilots && data.pilots.length > 0) {
          // Calculate real distances
          const pilotsWithDistance = data.pilots.map((pilot: any) => ({
            ...pilot,
            distance: calculateDistance(
              userLat,
              userLng,
              pilot.latitude,
              pilot.longitude
            ),
          }));
          setPilots(pilotsWithDistance);
        } else {
          console.log('⚠️ No pilots from API, using mock data with real distances');
          // Use mock data but calculate real distances
          const pilotsWithRealDistance = mockPilots.map(pilot => ({
            ...pilot,
            distance: calculateDistance(
              userLat,
              userLng,
              pilot.latitude,
              pilot.longitude
            ),
          }));
          setPilots(pilotsWithRealDistance);
        }
      } else {
        console.log('⚠️ API error, using mock data');
        const pilotsWithRealDistance = mockPilots.map(pilot => ({
          ...pilot,
          distance: calculateDistance(
            userLat,
            userLng,
            pilot.latitude,
            pilot.longitude
          ),
        }));
        setPilots(pilotsWithRealDistance);
      }
    } catch (error) {
      console.log('❌ Error fetching pilots, using mock data:', error);
      const userLat = lat || userLocation?.lat || 12.9716;
      const userLng = lng || userLocation?.lng || 77.5946;
      const pilotsWithRealDistance = mockPilots.map(pilot => ({
        ...pilot,
        distance: calculateDistance(
          userLat,
          userLng,
          pilot.latitude,
          pilot.longitude
        ),
      }));
      setPilots(pilotsWithRealDistance);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeLocation();
  };

  const handlePilotPress = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setShowModal(true);
  };

  const handleNotifyPilot = (pilot: Pilot) => {
    setShowModal(false);
    // Navigate to ride request screen
    navigation.navigate('RideRequest', { pilot });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading pilots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>📍</Text>
          <Text style={styles.searchPlaceholder}>Where are you going?</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenIcon}>🪙</Text>
          <Text style={styles.tokenValue}>{user?.token_balance || 120}</Text>
        </View>
      </View>

      {/* Map Visualization */}
      {userLocation && (
        <View style={styles.mapContainer}>
          <View style={styles.mapView}>
            <Text style={styles.mapTitle}>📍 Map View</Text>
            <Text style={styles.mapCoords}>
              {locationName}
            </Text>
            <View style={styles.mapCanvas}>
              {/* User marker */}
              <View style={styles.userMarker}>
                <Text style={styles.markerText}>YOU</Text>
              </View>
              {/* Pilot markers */}
              {pilots.slice(0, 3).map((pilot, index) => (
                <View
                  key={pilot.id}
                  style={[
                    styles.pilotMarker,
                    { top: `${30 + index * 20}%`, left: `${40 + index * 15}%` },
                  ]}
                >
                  <Text style={styles.pilotMarkerText}>{pilot.avatar}</Text>
                  <Text style={styles.pilotMarkerDistance}>
                    {(pilot.distance / 1000).toFixed(1)}km
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* User Location & Pilots Count */}
      <View style={styles.countCard}>
        <View>
          <Text style={styles.countTitle}>{pilots.length} Pilots Nearby</Text>
          {!locationPermission && (
            <Text style={styles.warningText}>⚠️ Enable location for accurate results</Text>
          )}
        </View>
        <Text style={styles.hintText}>👆 Tap any pilot to view profile</Text>
      </View>

      {/* Pilots List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pilots.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No pilots nearby</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          pilots.map((pilot) => (
            <TouchableOpacity
              key={pilot.id}
              style={styles.pilotCard}
              onPress={() => handlePilotPress(pilot)}
            >
              <View style={styles.pilotHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{pilot.avatar}</Text>
                </View>
                <View style={styles.pilotInfo}>
                  <Text style={styles.pilotName}>{pilot.name}</Text>
                  <Text style={styles.pilotVehicle}>
                    {pilot.vehicle.type} • {pilot.vehicle.plate}
                  </Text>
                  <View style={styles.pilotMeta}>
                    <Text style={styles.pilotRating}>⭐ {pilot.rating}</Text>
                    <Text style={styles.pilotSeparator}>•</Text>
                    <Text style={styles.pilotRides}>{pilot.totalRides} rides</Text>
                    <Text style={styles.pilotSeparator}>•</Text>
                    <Text style={styles.pilotDistance}>
                      {(pilot.distance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                </View>
              </View>
              
              {pilot.badges && pilot.badges.length > 0 && (
                <View style={styles.badgesContainer}>
                  {pilot.badges.slice(0, 2).map((badge, index) => (
                    <View key={index} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                  {pilot.badges.length > 2 && (
                    <View style={[styles.badge, styles.badgeMore]}>
                      <Text style={styles.badgeText}>+{pilot.badges.length - 2}</Text>
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.quickActions}>
                <View style={styles.proximityBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.proximityText}>
                    {(pilot.distance / 1000).toFixed(1)} km • ~{Math.ceil(pilot.distance / 500)} mins
                  </Text>
                </View>
                <TouchableOpacity style={styles.notifyButton}>
                  <Text style={styles.notifyButtonText}>View Profile →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Pilot Profile Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        {selectedPilot && (
          <PilotProfileModal
            pilot={selectedPilot}
            onClose={() => setShowModal(false)}
            onNotify={() => handleNotifyPilot(selectedPilot)}
            onViewFull={() => {
              setShowModal(false);
              navigation.navigate('PilotFullProfile', { pilot: selectedPilot });
            }}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  tokenIcon: {
    fontSize: 16,
  },
  tokenValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  countTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  countSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#64748B',
  },
  mapContainer: {
    margin: 12,
    marginTop: 0,
  },
  mapView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  mapCoords: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  mapCanvas: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  userMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 50,
    height: 50,
    marginLeft: -25,
    marginTop: -25,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pilotMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  pilotMarkerText: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F59E0B',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 29,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  pilotMarkerDistance: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  pilotCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    marginTop: 6,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pilotHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pilotInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  pilotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  pilotVehicle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  pilotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pilotRating: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  pilotSeparator: {
    fontSize: 13,
    color: '#CBD5E1',
    marginHorizontal: 6,
  },
  pilotRides: {
    fontSize: 13,
    color: '#64748B',
  },
  pilotDistance: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeMore: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proximityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  proximityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  notifyButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  notifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

