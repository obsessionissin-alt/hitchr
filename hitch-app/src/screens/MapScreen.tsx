// src/screens/MapScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import UniversalMap from '../components/UniversalMap';
import type { MapMarkerData, MapRouteData } from '../components/UniversalMap.types';
import UserProfileModal from '../components/UserProfileModal';

// Hooks
import { useNearbyUsers, getPilots, getRiders } from '../hooks/useNearbyUsers';
import { useRouteGeneration } from '../hooks/useRouteGeneration';
import { useDirectionalMatching } from '../hooks/useDirectionalMatching';
import { useNotifySockets } from '../hooks/useNotifySockets';
import { useLiveLocation } from '../hooks/useLiveLocation';
import type { UserMarker } from '../types/userMarker';

// Contexts - only for location tracking and user profile
import { useMap } from '../contexts/MapContext';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { DEMO_MODE } from '../constants/config';

// Types
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';
import { DEFAULT_RADIUS } from '../constants/config';
import socket from '../lib/socket';
import { geocodePlaceCandidates, GeocodeCandidate } from '../services/routeService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  // Use MapContext only for location tracking
  const {
    userLocation,
    isLoadingLocation,
    startLocationTracking,
  } = useMap();

  const { profile, updateAvailability } = useUser();
  const { accessToken } = useAuth();
  const {
    sendNotify,
    acceptNotify,
    declineNotify,
    incomingNotify,
    statusUpdate,
  } = useNotifySockets();
  const { createNotification } = useRide();

  // Local filter state
  const [filters, setFilters] = useState({
    showPilots: true,
    showRiders: true,
    maxDistance: DEFAULT_RADIUS,
  });

  // Use the unified useNearbyUsers hook
  const {
    data: nearbyUsers,
    loading: isLoadingNearby,
    error: nearbyError,
    refresh: refreshNearbyUsers,
  } = useNearbyUsers({
    latitude: userLocation?.lat ?? null,
    longitude: userLocation?.lng ?? null,
    maxDistance: filters.maxDistance,
    showPilots: filters.showPilots,
    showRiders: filters.showRiders,
    autoRefresh: true,
  });

  // Derive pilots and riders from unified data
  const nearbyPilots = useMemo(() => getPilots(nearbyUsers), [nearbyUsers]);
  const nearbyRiders = useMemo(() => getRiders(nearbyUsers), [nearbyUsers]);

  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const riderOrigin = useMemo(
    () => (userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null),
    [userLocation]
  );

  const {
    route: riderRoute,
    destination: riderDestination,
    loading: isGeneratingRoute,
    error: routeError,
    generateRoute,
    clearRoute,
  } = useRouteGeneration({ origin: riderOrigin });

  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null);
  const [includeMocks, setIncludeMocks] = useState(true);
  const [searchResults, setSearchResults] = useState<GeocodeCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const riderRouteCoords = useMemo(
    () => riderRoute?.coordinates ?? [],
    [riderRoute]
  );

  const {
    data: matchedPilots,
    loading: isMatching,
    error: matchingError,
    refresh: refreshMatching,
  } = useDirectionalMatching({
    origin: riderOrigin,
    destination: riderDestination,
    routeCoordinates: riderRouteCoords,
    radius: filters.maxDistance,
    withMocks: includeMocks,
    autoRefresh: true,
  });

  const [isPilotAvailable, setIsPilotAvailable] = useState(profile?.isPilotAvailable || false);
  const [isRiderAvailable, setIsRiderAvailable] = useState(profile?.isRiderAvailable || false);
  const [selectedUser, setSelectedUser] = useState<UserMarker | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifyToast, setNotifyToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [notifySendingFor, setNotifySendingFor] = useState<string | null>(null);
  const [incomingPrompt, setIncomingPrompt] = useState<typeof incomingNotify>(null);
  const [isResponding, setIsResponding] = useState(false);
  const { lastLocation, error: liveLocationError } = useLiveLocation({
    enabled: true,
    isPilotAvailable,
    isRiderAvailable,
  });
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [showListPanel, setShowListPanel] = useState(true);

  // Initialize location tracking
  useEffect(() => {
    const initLocation = async () => {
      try {
        await startLocationTracking();
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Failed to get your location. Please enable location services.');
      }
    };

    initLocation();
  }, []);

  // Update map region when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [userLocation]);

  // Sync local state with profile
  useEffect(() => {
    if (profile) {
      setIsPilotAvailable(profile.isPilotAvailable);
      setIsRiderAvailable(profile.isRiderAvailable);
    }
  }, [profile]);

  useEffect(() => {
    if (incomingNotify && incomingNotify.toUserId === profile?.id) {
      setIncomingPrompt(incomingNotify);
      setNotifyToast({
        message: `Notify received from ${incomingNotify.marker?.name || 'Someone'}`,
        type: 'info',
      });
    }
  }, [incomingNotify, profile?.id]);

  useEffect(() => {
    if (statusUpdate && statusUpdate.toUserId === profile?.id) {
      const message =
        statusUpdate.status === 'declined'
          ? 'Request Declined'
          : 'Request Accepted';
      setNotifyToast({
        message,
        type: statusUpdate.status === 'declined' ? 'error' : 'success',
      });
    }
  }, [statusUpdate, profile?.id]);

  useEffect(() => {
    if (!notifyToast) return;
    const timer = setTimeout(() => setNotifyToast(null), 2800);
    return () => clearTimeout(timer);
  }, [notifyToast]);

  useEffect(() => {
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handlePilotToggle = async () => {
    try {
      const newValue = !isPilotAvailable;
      
      // Check KYC if enabling pilot mode
      if (newValue && profile?.kycStatus !== 'verified') {
        Alert.alert(
          'KYC Required',
          'You need to complete KYC verification to become available as a pilot.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Verify Now',
              onPress: () => navigation.navigate('EditProfile'),
            },
          ]
        );
        return;
      }

      await updateAvailability(newValue, isRiderAvailable, userLocation || undefined);
      setIsPilotAvailable(newValue);
      
      // Refresh nearby users after availability change
      refreshNearbyUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update availability');
    }
  };

  const handleRiderToggle = async () => {
    try {
      const newValue = !isRiderAvailable;
      await updateAvailability(isPilotAvailable, newValue, userLocation || undefined);
      setIsRiderAvailable(newValue);
      
      // Refresh nearby users after availability change
      refreshNearbyUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update availability');
    }
  };

  const handleMarkerPress = (user: UserMarker) => {
    setSelectedUser(user);
    setShowProfileModal(true);
    navigation.navigate('ProfileModal', { 
      person: user as any, 
      type: user.role 
    });
  };

  const toggleFilter = (filterType: 'pilots' | 'riders') => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'pilots') {
        // Don't allow disabling both
        if (!newFilters.showPilots && !newFilters.showRiders) return prev;
        newFilters.showPilots = !newFilters.showPilots;
      } else {
        if (!newFilters.showPilots && !newFilters.showRiders) return prev;
        newFilters.showRiders = !newFilters.showRiders;
      }

      return newFilters;
    });
  };

  const setMaxDistance = (distance: number) => {
    setFilters(prev => ({ ...prev, maxDistance: distance }));
  };

  const handleDestinationSubmit = async () => {
    if (!destinationQuery.trim()) {
      Alert.alert('Destination required', 'Please enter a destination.');
      return;
    }

    if (!riderOrigin) {
      Alert.alert('Location unavailable', 'Waiting for your current location.');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchResults([]);

      // Calculate map bounds from current map region
      const mapBounds = {
        minLat: mapRegion.latitude - mapRegion.latitudeDelta / 2,
        maxLat: mapRegion.latitude + mapRegion.latitudeDelta / 2,
        minLng: mapRegion.longitude - mapRegion.longitudeDelta / 2,
        maxLng: mapRegion.longitude + mapRegion.longitudeDelta / 2,
      };

      const candidates = await geocodePlaceCandidates(
        destinationQuery.trim(),
        riderOrigin,
        {
          countryCode: 'IN',
          radiusMeters: 30000,
          mapBounds,
          limit: 6,
        }
      );

      if (!candidates.length) {
        Alert.alert('Not found', 'No nearby results. Try a more specific place or zoom closer.');
        return;
      }

      // Auto-select if the best is within 5km or only one candidate
      if (candidates.length === 1 || candidates[0].distance <= 5000) {
        await handleSelectDestination(candidates[0]);
      } else {
        setSearchResults(candidates);
      }
    } catch (err: any) {
      console.error('❌ Destination error:', err);
      Alert.alert('Destination error', err?.message || 'Failed to set destination');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectDestination = async (candidate: GeocodeCandidate) => {
    const destPoint = { latitude: candidate.latitude, longitude: candidate.longitude };
    setDestinationLabel(candidate.name);
    setSearchResults([]);
    setDestinationQuery(candidate.name);

    const routeResult = await generateRoute(destPoint);
    if (routeResult) {
      refreshMatching();
    }
  };

  const handleClearDestination = () => {
    clearRoute();
    setDestinationLabel(null);
    setDestinationQuery('');
    setSearchResults([]);
  };

  const handleNotifyUser = async (targetUser: UserMarker) => {
    if (!profile?.id) {
      Alert.alert('Not signed in', 'You need to be logged in to notify users.');
      return;
    }

    if (!riderOrigin || !riderDestination) {
      Alert.alert('Destination required', 'Please set a destination before notifying a pilot.');
      return;
    }

    setNotifySendingFor(targetUser.id);
    try {
      // Create ride via API
      const ride = await createNotification(
        targetUser.id,
        { lat: riderOrigin.latitude, lng: riderOrigin.longitude },
        { lat: riderDestination.latitude, lng: riderDestination.longitude }
      );

      // Send socket notification
      await sendNotify({
        fromUserId: profile.id,
        toUserId: targetUser.id,
        marker: targetUser,
        rideRequestId: ride.id || `ride-${Date.now()}`,
      });

      // Navigate to NotificationSentScreen
      navigation.navigate('NotificationSent', {
        rideId: ride.id || `ride-${Date.now()}`,
        pilot: targetUser,
      });
    } catch (error: any) {
      setNotifyToast({ message: error.message || 'Failed to send notification', type: 'error' });
    } finally {
      setNotifySendingFor(null);
    }
  };

  const handleAcceptNotify = async () => {
    if (!incomingPrompt || !profile?.id) return;
    setIsResponding(true);
    try {
      await acceptNotify({
        ...incomingPrompt,
        fromUserId: profile.id,
        toUserId: incomingPrompt.fromUserId,
      });

      // Extract rideId from the notification payload
      const rideId = incomingPrompt.rideRequestId || `ride-${Date.now()}`;
      
      console.log('✅ Notify accepted, rideId:', rideId);
      
      // DEMO MODE: Navigate directly to ProximityConfirmScreen
      // In real mode, we'd wait for proximity match socket event
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Navigating to ProximityConfirm after accept');
        setIncomingPrompt(null);
        setIsResponding(false);
        // Small delay to ensure socket event completes
        setTimeout(() => {
          navigation.navigate('ProximityConfirm', { rideId });
        }, 500);
      } else {
        setNotifyToast({ message: 'Request Accepted', type: 'success' });
        setIncomingPrompt(null);
        setIsResponding(false);
        // In real mode, wait for proximity match socket event which will navigate
      }
    } catch (error: any) {
      console.error('Accept notify error:', error);
      setNotifyToast({ message: error.message || 'Failed to accept request', type: 'error' });
      setIsResponding(false);
    }
  };

  const handleDeclineNotify = async () => {
    if (!incomingPrompt || !profile?.id) return;
    setIsResponding(true);
    try {
      await declineNotify({
        ...incomingPrompt,
        fromUserId: profile.id,
        toUserId: incomingPrompt.fromUserId,
      });
      setNotifyToast({ message: 'Request Declined', type: 'error' });
    } catch (error: any) {
      setNotifyToast({ message: error.message || 'Failed to decline request', type: 'error' });
    } finally {
      setIncomingPrompt(null);
      setIsResponding(false);
    }
  };

  const visibleUsers: UserMarker[] = useMemo(() => {
    if (riderDestination) {
      return matchedPilots;
    }
    return nearbyUsers;
  }, [riderDestination, matchedPilots, nearbyUsers]);

  // Build markers from normalized UserMarker data
  const mapMarkers: MapMarkerData[] = useMemo(() => [
    ...(userLocation ? [{
      id: 'user-location',
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      color: '#10b981',
      label: 'Y',
      title: 'You',
    }] : []),
    ...(riderDestination ? [{
      id: 'destination',
      latitude: riderDestination.latitude,
      longitude: riderDestination.longitude,
      color: '#f97316',
      label: 'D',
      title: destinationLabel || 'Destination',
    }] : []),
    ...visibleUsers.map((user) => ({
      id: `${user.role}-${user.id}`,
      latitude: user.latitude,
      longitude: user.longitude,
      color: user.role === 'pilot' ? theme.colors.pilot : theme.colors.rider,
      label: user.role === 'pilot' ? 'P' : 'R',
      title: user.name,
    })),
  ], [userLocation, riderDestination, destinationLabel, visibleUsers]);

  const mapRoutes: MapRouteData[] = useMemo(() => {
    if (!riderRoute) return [];
    return [{
      id: 'rider-route',
      coordinates: riderRoute.coordinates,
      color: theme.colors.primary,
      width: 5,
    }];
  }, [riderRoute]);

  const mapCenter = {
    latitude: mapRegion.latitude,
    longitude: mapRegion.longitude,
  };

  const usernameLabel = profile?.name || 'Unknown';
  const tokenLabel = accessToken ? `${accessToken.slice(0, 10)}…` : 'none';
  const socketStatus = socket.connected ? 'connected' : 'disconnected';
  const selfId = profile?.id;
  const activePilotCount = riderDestination ? matchedPilots.length : nearbyPilots.length;
  const activeRiderCount = riderDestination ? 0 : nearbyRiders.length;
  const listUsers = useMemo(() => {
    const filtered = visibleUsers.filter((u) => {
      if (!includeMocks && u.is_mock) return false;
      return true;
    });
    return filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [visibleUsers, includeMocks]);

  const handleMapMarkerPress = (markerId: string) => {
    // Find user by marker ID
    const user = visibleUsers.find((u) => `${u.role}-${u.id}` === markerId);
    if (user) {
      handleMarkerPress(user);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search and Token Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="📍 Where to?"
            placeholderTextColor="#94a3b8"
            value={destinationQuery}
            onChangeText={setDestinationQuery}
            onSubmitEditing={handleDestinationSubmit}
            returnKeyType="search"
          />
          <View style={styles.searchActions}>
            <TouchableOpacity style={styles.searchBtn} onPress={handleDestinationSubmit}>
              <Text style={styles.searchBtnText}>{searchLoading ? '...' : 'Go'}</Text>
            </TouchableOpacity>
            {riderDestination && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearDestination}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>🪙 {profile?.stats.tokenBalance || 0}</Text>
        </View>
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {searchResults.map((r) => (
            <TouchableOpacity key={`${r.latitude}-${r.longitude}-${r.name}`} style={styles.searchResultItem} onPress={() => handleSelectDestination(r)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.searchResultName} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.searchResultMeta}>{Math.round(r.distance)} m away</Text>
              </View>
              <Text style={styles.searchResultSelect}>Select</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Identity + Dev toggle */}
      <View style={styles.identityBar}>
        <Text style={styles.identityText}>You are: {usernameLabel}</Text>
        <TouchableOpacity style={styles.devToggle} onPress={() => setShowDevPanel((prev) => !prev)}>
          <Text style={styles.devToggleText}>{showDevPanel ? 'Hide Dev' : 'Show Dev'}</Text>
        </TouchableOpacity>
      </View>

      {/* Dev panel */}
      {showDevPanel && (
        <View style={styles.devPanel}>
          <Text style={styles.devRow}>Username: {usernameLabel}</Text>
          <Text style={styles.devRow}>Token: {tokenLabel}</Text>
          <Text style={styles.devRow}>Socket: {socketConnected ? 'connected' : 'disconnected'}</Text>
          <Text style={styles.devRow}>
            Last location: {lastLocation ? `${lastLocation.lat.toFixed(5)}, ${lastLocation.lng.toFixed(5)}` : 'pending'}
          </Text>
          {notifyToast ? <Text style={styles.devRow}>Last toast: {notifyToast.message}</Text> : null}
          {liveLocationError ? <Text style={styles.devError}>Location error: {liveLocationError}</Text> : null}
          <View style={styles.devRowInline}>
            <Text style={styles.devRow}>Include mocks in list</Text>
            <TouchableOpacity style={styles.toggleChip} onPress={() => setIncludeMocks((prev) => !prev)}>
              <Text style={styles.toggleChipText}>{includeMocks ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterPill,
            filters.showPilots && styles.filterPilotActive,
          ]}
          onPress={() => toggleFilter('pilots')}
        >
          <Text
            style={[
              styles.filterText,
              filters.showPilots && styles.filterTextActive,
            ]}
          >
            🚗 Pilots ({nearbyPilots.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            filters.showRiders && styles.filterRiderActive,
          ]}
          onPress={() => toggleFilter('riders')}
        >
          <Text
            style={[
              styles.filterText,
              filters.showRiders && styles.filterTextActive,
            ]}
          >
            🚶 Riders ({nearbyRiders.length})
          </Text>
        </TouchableOpacity>

        <View style={[styles.filterPill, styles.filterBoth]}>
          <Text style={styles.filterText}>
            Both ({nearbyUsers.length})
          </Text>
        </View>
      </ScrollView>

      {/* Range Filter */}
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeLabel}>Range: {Math.round(filters.maxDistance / 1000)} km</Text>
        <View style={styles.rangeSliderContainer}>
          <Text style={styles.rangeMin}>1km</Text>
          <View style={styles.rangeSlider}>
            <TouchableOpacity
              style={[
                styles.rangeButton,
                filters.maxDistance === 1000 && styles.rangeButtonActive,
              ]}
              onPress={() => setMaxDistance(1000)}
            >
              <Text style={[styles.rangeButtonText, filters.maxDistance === 1000 && { color: '#fff' }]}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangeButton,
                filters.maxDistance === 3000 && styles.rangeButtonActive,
              ]}
              onPress={() => setMaxDistance(3000)}
            >
              <Text style={[styles.rangeButtonText, filters.maxDistance === 3000 && { color: '#fff' }]}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangeButton,
                filters.maxDistance === 5000 && styles.rangeButtonActive,
              ]}
              onPress={() => setMaxDistance(5000)}
            >
              <Text style={[styles.rangeButtonText, filters.maxDistance === 5000 && { color: '#fff' }]}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangeButton,
                filters.maxDistance === 10000 && styles.rangeButtonActive,
              ]}
              onPress={() => setMaxDistance(10000)}
            >
              <Text style={[styles.rangeButtonText, filters.maxDistance === 10000 && { color: '#fff' }]}>10</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.rangeMax}>10km</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {isLoadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <UniversalMap
            style={styles.map}
            center={mapCenter}
            zoom={13}
            markers={mapMarkers}
            routes={mapRoutes}
            onMarkerPress={handleMapMarkerPress}
            showUserLocation={true}
          />
        )}

        {/* Error indicator */}
        {nearbyError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {nearbyError}</Text>
            <TouchableOpacity onPress={refreshNearbyUsers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {routeError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {routeError}</Text>
            <TouchableOpacity onPress={handleDestinationSubmit}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {matchingError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {matchingError}</Text>
            <TouchableOpacity onPress={refreshMatching}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FAB Group */}
        <View style={styles.fabGroup}>
          <TouchableOpacity
            style={[
              styles.fab,
              isPilotAvailable ? styles.fabPilotActive : styles.fabInactive,
            ]}
            onPress={handlePilotToggle}
          >
            <Ionicons name="car" size={24} color="#fff" />
            <Text style={styles.fabLabel}>PILOT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              isRiderAvailable ? styles.fabRiderActive : styles.fabInactive,
            ]}
            onPress={handleRiderToggle}
          >
            <Ionicons name="walk" size={24} color="#fff" />
            <Text style={styles.fabLabel}>RIDER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby list panel */}
      <View style={styles.listPanel}>
        <View style={styles.listPanelHeader}>
            <Text style={styles.listPanelTitle}>{riderDestination ? 'Matched Pilots' : 'Nearby'}</Text>
          <View style={styles.listPanelActions}>
            <TouchableOpacity style={styles.toggleChip} onPress={() => setIncludeMocks((prev) => !prev)}>
              <Text style={styles.toggleChipText}>{includeMocks ? 'Mocks ON' : 'Mocks OFF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleChip} onPress={() => setShowListPanel((prev) => !prev)}>
              <Text style={styles.toggleChipText}>{showListPanel ? 'Hide List' : 'Show List'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showListPanel && (
          <ScrollView style={styles.listScroll}>
            {listUsers.map((u) => {
              const isYou = selfId && u.id === selfId;
              return (
                <View key={u.id} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.roleDot, u.role === 'pilot' ? styles.roleDotPilot : styles.roleDotRider]} />
                    <View>
                      <Text style={styles.listName}>
                        {u.name || 'Unknown'} {isYou ? '(You)' : ''}
                      </Text>
                      <Text style={styles.listMeta}>
                        {u.role.toUpperCase()} • {u.distance ? `${Math.round(u.distance)} m` : '—'}
                        {u.is_mock ? ' • mock' : ''}
                      </Text>
                      {riderDestination && u.metrics && (
                        <Text style={styles.listMeta}>
                          Overlap {u.metrics.overlapMeters ?? 0}m • Detour {u.metrics.detourMeters ?? 0}m • Δ° {u.metrics.bearingDiff ?? 0}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.listNotifyBtn, isYou && styles.listNotifyBtnDisabled]}
                    disabled={isYou || notifySendingFor === u.id}
                    onPress={() => handleNotifyUser(u)}
                  >
                    <Text style={styles.listNotifyText}>
                      {isYou ? 'You' : notifySendingFor === u.id ? 'Sending...' : 'Notify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            {listUsers.length === 0 && (
              <Text style={styles.listEmpty}>
                {riderDestination
                  ? 'No pilots match your destination yet. Try broadening range or adjusting destination.'
                  : 'No users in range. Try enabling mocks or moving closer.'}
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.bottomHeader}>
          <Text style={styles.bottomTitle}>
            {activePilotCount} Pilots • {activeRiderCount} Riders
          </Text>
          <Text style={styles.bottomSubtitle}>
            {riderDestination ? 'Matched to destination' : `Within ${Math.round(filters.maxDistance / 1000)} km`}
          </Text>
        </View>
        <Text style={styles.bottomHint}>
          {riderDestination
            ? `Showing pilots aligned to ${destinationLabel || 'destination'}`
            : '👆 Tap markers to view profiles'}
        </Text>
      </View>

      {/* Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        user={selectedUser}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUser(null);
        }}
        onNotify={handleNotifyUser}
        notifyLoading={notifySendingFor === selectedUser?.id}
      />

      {/* Incoming Notify Modal */}
      <Modal
        visible={!!incomingPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setIncomingPrompt(null)}
      >
        <View style={styles.incomingOverlay}>
          <View style={styles.incomingCard}>
            <Text style={styles.incomingTitle}>
              {incomingPrompt?.marker?.name || 'Someone'} wants to connect with you
            </Text>
            <Text style={styles.incomingSubtitle}>Respond instantly to start chatting</Text>
            <View style={styles.incomingActions}>
              <TouchableOpacity
                style={[styles.incomingButton, styles.incomingDecline]}
                onPress={handleDeclineNotify}
                disabled={isResponding}
              >
                <Text style={styles.incomingButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.incomingButton, styles.incomingAccept]}
                onPress={handleAcceptNotify}
                disabled={isResponding}
              >
                <Text style={[styles.incomingButtonText, styles.incomingAcceptText]}>
                  {isResponding ? 'Sending...' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {notifyToast && (
        <View
          style={[
            styles.toast,
            notifyToast.type === 'error' && styles.toastError,
            notifyToast.type === 'success' && styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{notifyToast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  identityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  identityText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  devToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  devToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  devPanel: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  devRow: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  devRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  devError: {
    fontSize: 12,
    color: '#dc2626',
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  listPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  listPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listPanelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listScroll: {
    maxHeight: 220,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleDotPilot: {
    backgroundColor: theme.colors.pilot,
  },
  roleDotRider: {
    backgroundColor: theme.colors.rider,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  listNotifyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  listNotifyBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  listNotifyText: {
    color: '#fff',
    fontWeight: '700',
  },
  listEmpty: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    paddingVertical: 16,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 6,
  },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  clearBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  searchResultMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  searchResultSelect: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  tokenBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterPilotActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: theme.colors.pilot,
  },
  filterRiderActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: theme.colors.rider,
  },
  filterBoth: {
    borderColor: '#7c3aed',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.pilot,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    flex: 1,
  },
  retryText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  fabGroup: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    gap: 12,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  fabPilotActive: {
    backgroundColor: theme.colors.pilot,
  },
  fabRiderActive: {
    backgroundColor: theme.colors.rider,
  },
  fabInactive: {
    backgroundColor: theme.colors.inactive,
    opacity: 0.6,
  },
  fabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  bottomCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    ...theme.shadows.lg,
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  bottomSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bottomHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  rangeContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  rangeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeSlider: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  rangeMin: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 30,
  },
  rangeMax: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 35,
    textAlign: 'right',
  },
  incomingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incomingCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.lg,
  },
  incomingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  incomingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 18,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  incomingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  incomingDecline: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  incomingAccept: {
    backgroundColor: theme.colors.primary,
  },
  incomingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  incomingAcceptText: {
    color: '#fff',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    ...theme.shadows.md,
  },
  toastSuccess: {
    backgroundColor: '#16a34a',
  },
  toastError: {
    backgroundColor: '#dc2626',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
