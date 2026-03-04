// src/screens/EnhancedMapScreen.tsx
// Modern Indian Design - Bold, social, adventure-focused

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
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSimpleAuth } from '../store/SimpleAuthContext';
import { mockPilots } from '../data/mockData';
import PilotProfileModal from './PilotProfileModal';
import { theme } from '../constants/theme';

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
  destination?: string;
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
  const [destination, setDestination] = useState<string>('');
  const [showDestinationInput, setShowDestinationInput] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const getLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
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
      
      setLocationName(locationStr);
    } catch (error) {
      console.error('Failed to get location name:', error);
      setLocationName('Your Location');
    }
  };

  const initializeLocation = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        
        const userLoc = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        
        setUserLocation(userLoc);
        getLocationName(userLoc.lat, userLoc.lng);
        fetchPilots(userLoc.lat, userLoc.lng);
      } else {
        const defaultLoc = { lat: 12.9716, lng: 77.5946 };
        setUserLocation(defaultLoc);
        setLocationName('Bangalore, Karnataka');
        fetchPilots(defaultLoc.lat, defaultLoc.lng);
      }
    } catch (error) {
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
      
      const response = await fetch(
        `${API_URL}/pilots/nearby?lat=${userLat}&lng=${userLng}&radius=10000`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.pilots && data.pilots.length > 0) {
          const pilotsWithDistance = data.pilots.map((pilot: any) => ({
            ...pilot,
            distance: calculateDistance(userLat, userLng, pilot.latitude, pilot.longitude),
          }));
          setPilots(pilotsWithDistance);
        } else {
          const pilotsWithRealDistance = mockPilots.map(pilot => ({
            ...pilot,
            distance: calculateDistance(userLat, userLng, pilot.latitude, pilot.longitude),
          }));
          setPilots(pilotsWithRealDistance);
        }
      } else {
        const pilotsWithRealDistance = mockPilots.map(pilot => ({
          ...pilot,
          distance: calculateDistance(userLat, userLng, pilot.latitude, pilot.longitude),
        }));
        setPilots(pilotsWithRealDistance);
      }
    } catch (error) {
      const userLat = lat || userLocation?.lat || 12.9716;
      const userLng = lng || userLocation?.lng || 77.5946;
      const pilotsWithRealDistance = mockPilots.map(pilot => ({
        ...pilot,
        distance: calculateDistance(userLat, userLng, pilot.latitude, pilot.longitude),
      }));
      setPilots(pilotsWithRealDistance);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
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
    navigation.navigate('RideRequest', { pilot });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Finding travelers nearby...</Text>
          <Text style={styles.loadingSubtext}>Connecting you to the road</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandMark}>
            <View style={styles.logoMini}>
              <Text style={styles.logoMiniText}>H</Text>
            </View>
            <Text style={styles.brandText}>hitchr</Text>
          </View>
          
          <TouchableOpacity style={styles.tokenBadge}>
            <Text style={styles.tokenIcon}>🪙</Text>
            <Text style={styles.tokenValue}>{user?.token_balance || 120}</Text>
          </TouchableOpacity>
        </View>

        {/* Destination Search */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => setShowDestinationInput(true)}
          activeOpacity={0.9}
        >
          <View style={styles.searchFrom}>
            <Text style={styles.searchDot}>●</Text>
            <View>
              <Text style={styles.searchLabel}>From</Text>
              <Text style={styles.searchValue} numberOfLines={1}>
                {locationName}
              </Text>
            </View>
          </View>
          <View style={styles.searchDivider} />
          <View style={styles.searchTo}>
            <Text style={[styles.searchDot, styles.searchDotDestination]}>◉</Text>
            <View style={styles.searchToContent}>
              <Text style={styles.searchLabel}>To</Text>
              <Text style={[styles.searchValue, !destination && styles.searchPlaceholder]}>
                {destination || 'Where are you headed?'}
              </Text>
            </View>
            <Text style={styles.searchArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Visual Map Preview */}
      <View style={styles.mapPreview}>
        <View style={styles.mapCanvas}>
          {/* Stylized route visualization */}
          <View style={styles.routeLine} />
          
          {/* User marker */}
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner}>
              <Text style={styles.userMarkerText}>YOU</Text>
            </View>
            <View style={styles.userMarkerPulse} />
          </View>
          
          {/* Pilot markers */}
          {pilots.slice(0, 4).map((pilot, index) => (
            <TouchableOpacity
              key={pilot.id}
              style={[
                styles.pilotMarker,
                { 
                  top: `${25 + (index * 15)}%`, 
                  left: `${35 + (index * 12)}%`,
                },
              ]}
              onPress={() => handlePilotPress(pilot)}
            >
              <View style={styles.pilotMarkerBubble}>
                <Text style={styles.pilotMarkerEmoji}>{pilot.avatar}</Text>
              </View>
              <View style={styles.pilotMarkerLabel}>
                <Text style={styles.pilotMarkerDistance}>
                  {(pilot.distance / 1000).toFixed(1)}km
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Map overlay info */}
        <View style={styles.mapOverlay}>
          <View style={styles.mapStat}>
            <Text style={styles.mapStatValue}>{pilots.length}</Text>
            <Text style={styles.mapStatLabel}>travelers nearby</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🛺</Text>
          <Text style={styles.statText}>{pilots.length} pilots</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statText}>10km radius</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statText}>Live</Text>
        </View>
      </View>

      {/* Pilots List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pilots on the road</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {pilots.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛣️</Text>
            <Text style={styles.emptyTitle}>No pilots nearby</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or try a different location
            </Text>
          </View>
        ) : (
          pilots.map((pilot, index) => (
            <TouchableOpacity
              key={pilot.id}
              style={[styles.pilotCard, index === 0 && styles.pilotCardFirst]}
              onPress={() => handlePilotPress(pilot)}
              activeOpacity={0.9}
            >
              <View style={styles.pilotHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{pilot.avatar}</Text>
                  </View>
                  {pilot.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.pilotInfo}>
                  <View style={styles.pilotNameRow}>
                    <Text style={styles.pilotName}>{pilot.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {pilot.rating}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.pilotVehicle}>
                    {pilot.vehicle.type} • {pilot.vehicle.plate}
                  </Text>
                  
                  <View style={styles.pilotStats}>
                    <Text style={styles.pilotStatText}>{pilot.totalRides} rides</Text>
                    <Text style={styles.pilotStatDot}>•</Text>
                    <Text style={styles.pilotStatText}>{Math.round(pilot.totalKm)} km</Text>
                  </View>
                </View>
              </View>

              {/* Badges */}
              {pilot.badges && pilot.badges.length > 0 && (
                <View style={styles.badgesRow}>
                  {pilot.badges.slice(0, 3).map((badge, i) => (
                    <View key={i} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                  {pilot.badges.length > 3 && (
                    <View style={[styles.badge, styles.badgeMore]}>
                      <Text style={styles.badgeMoreText}>+{pilot.badges.length - 3}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Row */}
              <View style={styles.actionRow}>
                <View style={styles.distanceBadge}>
                  <View style={styles.distanceDot} />
                  <Text style={styles.distanceText}>
                    {(pilot.distance / 1000).toFixed(1)} km away
                  </Text>
                  <Text style={styles.etaText}>
                    ~{Math.ceil(pilot.distance / 500)} min
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.notifyButton}
                  onPress={() => handleNotifyPilot(pilot)}
                >
                  <Text style={styles.notifyButtonText}>Notify</Text>
                  <Text style={styles.notifyButtonIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Destination Input Modal */}
      <Modal
        visible={showDestinationInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestinationInput(false)}
      >
        <View style={styles.destinationModal}>
          <View style={styles.destinationContent}>
            <View style={styles.destinationHeader}>
              <Text style={styles.destinationTitle}>Where to?</Text>
              <TouchableOpacity 
                onPress={() => setShowDestinationInput(false)}
                style={styles.destinationClose}
              >
                <Text style={styles.destinationCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.destinationInput}
              placeholder="Enter your destination"
              placeholderTextColor={theme.colors.textTertiary}
              value={destination}
              onChangeText={setDestination}
              autoFocus
            />
            
            <View style={styles.quickDestinations}>
              <Text style={styles.quickTitle}>Popular destinations</Text>
              {['Bangalore Airport', 'MG Road', 'Koramangala', 'Electronic City'].map((place) => (
                <TouchableOpacity
                  key={place}
                  style={styles.quickItem}
                  onPress={() => {
                    setDestination(place);
                    setShowDestinationInput(false);
                  }}
                >
                  <Text style={styles.quickIcon}>📍</Text>
                  <Text style={styles.quickText}>{place}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.destinationButton}
              onPress={() => setShowDestinationInput(false)}
            >
              <Text style={styles.destinationButtonText}>Find Pilots</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  
  // Header
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMiniText: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textOnPrimary,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    gap: 4,
  },
  tokenIcon: {
    fontSize: 14,
  },
  tokenValue: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  
  // Search Bar
  searchBar: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  searchFrom: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  searchTo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  searchToContent: {
    flex: 1,
  },
  searchDot: {
    fontSize: 12,
    color: theme.colors.accent,
  },
  searchDotDestination: {
    color: theme.colors.secondary,
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  searchPlaceholder: {
    color: theme.colors.textTertiary,
  },
  searchDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  searchArrow: {
    fontSize: 18,
    color: theme.colors.secondary,
    fontWeight: '700',
  },
  
  // Map Preview
  mapPreview: {
    height: 180,
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    position: 'relative',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#E8F4E8', // Soft green map background
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    top: '45%',
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  userMarker: {
    position: 'absolute',
    top: '40%',
    left: '12%',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.rider,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  userMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.rider}30`,
  },
  pilotMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  pilotMarkerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  pilotMarkerEmoji: {
    fontSize: 18,
  },
  pilotMarkerLabel: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pilotMarkerDistance: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(27, 27, 27, 0.85)',
  },
  mapStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  mapStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  mapStatLabel: {
    fontSize: 13,
    color: theme.colors.textInverse,
    fontWeight: '500',
  },
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
  },
  
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  
  // Pilot Card
  pilotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  pilotCardFirst: {
    borderColor: theme.colors.primary,
    ...theme.shadows.glow,
  },
  pilotHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  pilotInfo: {
    flex: 1,
  },
  pilotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pilotName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  ratingBadge: {
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  pilotVehicle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  pilotStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pilotStatText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  pilotStatDot: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  
  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  badge: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  badgeMore: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  badgeMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textTertiary,
  },
  
  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.colors.accent}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  distanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  etaText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    gap: 6,
    ...theme.shadows.magenta,
  },
  notifyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  notifyButtonIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
  
  // Destination Modal
  destinationModal: {
    flex: 1,
    backgroundColor: 'rgba(27, 27, 27, 0.5)',
    justifyContent: 'flex-end',
  },
  destinationContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  destinationClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationCloseText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  destinationInput: {
    height: 56,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  quickDestinations: {
    marginBottom: theme.spacing.lg,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  quickIcon: {
    fontSize: 16,
  },
  quickText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  destinationButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  destinationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
});
