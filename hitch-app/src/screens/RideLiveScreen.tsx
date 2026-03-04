// src/screens/RideLiveScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Components
import UniversalMap from '../components/UniversalMap';
import type { MapMarkerData, MapRouteData } from '../components/UniversalMap.types';

// Contexts
import { useSocket } from '../contexts/SocketContext';
import { useRide } from '../contexts/RideContext';
import { useUser } from '../contexts/UserContext';
import { useMap } from '../contexts/MapContext';
import { DEMO_MODE } from '../constants/config';

// Types
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'RideLive'>;

export default function RideLiveScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { rideId } = route.params;

  const { on, off, emit } = useSocket();
  const { getRide, endRide, sendTelemetry } = useRide();
  const { profile } = useUser();
  const { userLocation } = useMap();

  const [ride, setRide] = useState<any>(null);
  const [partnerLocation, setPartnerLocation] = useState<any>(null);
  const [telemetryBatch, setTelemetryBatch] = useState<any[]>([]);
  const [duration, setDuration] = useState(0);
  const [mockDistance, setMockDistance] = useState(0); // DEMO MODE: Mock distance in km

  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mockDistanceRef = useRef(0);

  useEffect(() => {
    const loadRide = async () => {
      try {
        const rideData = await getRide(rideId);
        setRide(rideData);
      } catch (error) {
        console.error('Error loading ride:', error);
        Alert.alert('Error', 'Failed to load ride details');
      }
    };

    loadRide();
  }, [rideId]);

  useEffect(() => {
    // Join ride room
    emit('ride:join', rideId);

    // Listen for partner location updates
    const handlePartnerLocation = (data: any) => {
      setPartnerLocation({
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
      });
    };

    // Listen for ride completion
    const handleRideCompleted = (data: any) => {
      if (data.rideId === rideId) {
        navigation.replace('RideComplete', {
          rideId,
          tokensEarned: data.tokensAwarded.rider || data.tokensAwarded.pilot,
          distance: data.distance,
        });
      }
    };

    on('ride:partner-location', handlePartnerLocation);
    on('ride:completed', handleRideCompleted);

    return () => {
      off('ride:partner-location', handlePartnerLocation);
      off('ride:completed', handleRideCompleted);
      emit('ride:leave', rideId);
    };
  }, [rideId, on, off, emit, navigation]);

  // Send telemetry periodically
  useEffect(() => {
    telemetryIntervalRef.current = setInterval(async () => {
      if (userLocation) {
        const locationData = await Location.getCurrentPositionAsync();
        
        const telemetryPoint = {
          lat: locationData.coords.latitude,
          lng: locationData.coords.longitude,
          speed: locationData.coords.speed || 0,
          heading: locationData.coords.heading || 0,
          accuracy: locationData.coords.accuracy || 0,
          timestamp: new Date().toISOString(),
        };

        setTelemetryBatch((prev) => [...prev, telemetryPoint]);

        // Share location with partner
        emit('ride:location-share', {
          rideId,
          lat: telemetryPoint.lat,
          lng: telemetryPoint.lng,
          heading: telemetryPoint.heading,
          speed: telemetryPoint.speed,
        });
      }
    }, 5000); // Every 5 seconds

    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, [userLocation, rideId, emit]);

  // Send telemetry batch to server
  useEffect(() => {
    if (telemetryBatch.length >= 10) {
      sendTelemetry(rideId, telemetryBatch);
      setTelemetryBatch([]);
    }
  }, [telemetryBatch, rideId]);

  // Duration counter + DEMO MODE mock distance
  useEffect(() => {
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
      
      // DEMO MODE: Increment mock distance every second (0.01-0.05 km per second)
      if (DEMO_MODE) {
        const increment = 0.01 + Math.random() * 0.04; // Random between 0.01-0.05 km
        mockDistanceRef.current += increment;
        setMockDistance(Math.round(mockDistanceRef.current * 100) / 100); // Round to 2 decimals
      }
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const handleEndRide = async () => {
    // Only pilot can end ride in real mode; DEMO_MODE allows anyone
    if (!DEMO_MODE && !profile?.isPilotAvailable) {
      Alert.alert('Error', 'Only the pilot can end the ride');
      return;
    }

    Alert.alert('End Ride', 'Are you sure you want to end this ride?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Ride',
        style: 'default',
        onPress: async () => {
          try {
            // DEMO MODE: Use mock distance and calculate tokens
            if (DEMO_MODE) {
              const finalDistance = mockDistanceRef.current; // km
              const finalDuration = duration; // seconds
              const baseTokens = 10;
              const distanceBonus = Math.floor(finalDistance * 2); // 2 tokens per km
              const timeBonus = Math.floor(finalDuration / 60); // 1 token per minute
              const totalTokens = baseTokens + distanceBonus + timeBonus;
              
              console.log('🎭 DEMO MODE: Ending ride with mock data', {
                distance: finalDistance,
                duration: finalDuration,
                tokens: totalTokens,
              });
              
              // Try to call backend, but fallback to mock if it fails
              try {
                if (userLocation && telemetryBatch.length > 0) {
                  await sendTelemetry(rideId, telemetryBatch);
                }
                const result = await endRide(rideId, userLocation || { lat: 0, lng: 0 });
                navigation.replace('RideComplete', {
                  rideId,
                  tokensEarned: result.tokensAwarded?.pilot || totalTokens,
                  distance: result.distance || Math.round(finalDistance * 1000), // Convert to meters
                });
              } catch (backendError) {
                console.warn('🎭 DEMO MODE: Backend failed, using mock data', backendError);
                navigation.replace('RideComplete', {
                  rideId,
                  tokensEarned: totalTokens,
                  distance: Math.round(finalDistance * 1000), // Convert to meters
                });
              }
              return;
            }

            // Real mode: require location
            if (!userLocation) {
              Alert.alert('Error', 'Unable to get current location');
              return;
            }

            // Send remaining telemetry
            if (telemetryBatch.length > 0) {
              await sendTelemetry(rideId, telemetryBatch);
            }

            const result = await endRide(rideId, userLocation);
            
            navigation.replace('RideComplete', {
              rideId,
              tokensEarned: result.tokensAwarded.pilot,
              distance: result.distance,
            });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to end ride');
          }
        },
      },
    ]);
  };

  // DEMO MODE: quick end without prompts, usable by either role
  const handleDemoEndRide = async () => {
    const finalDistance = mockDistanceRef.current; // km
    const finalDuration = duration; // seconds
    const baseTokens = 10;
    const distanceBonus = Math.floor(finalDistance * 2); // 2 tokens per km
    const timeBonus = Math.floor(finalDuration / 60); // 1 token per minute
    const totalTokens = baseTokens + distanceBonus + timeBonus;

    try {
      if (userLocation && telemetryBatch.length > 0) {
        await sendTelemetry(rideId, telemetryBatch);
      }
      const result = await endRide(rideId, userLocation || { lat: 0, lng: 0 });
      navigation.replace('RideComplete', {
        rideId,
        tokensEarned: result.tokensAwarded?.pilot || totalTokens,
        distance: result.distance || Math.round(finalDistance * 1000),
      });
    } catch (error) {
      console.warn('🎭 DEMO MODE: Force-ending ride with mock data', error);
      navigation.replace('RideComplete', {
        rideId,
        tokensEarned: totalTokens,
        distance: Math.round(finalDistance * 1000),
      });
    }
  };

  const handleCall = () => {
    const otherUser = ride?.pilot || ride?.rider;
    if (otherUser?.phone) {
      Linking.openURL(`tel:${otherUser.phone}`);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will alert emergency contacts and authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            // In production, this would trigger emergency protocols
            Alert.alert('SOS Sent', 'Emergency services have been notified');
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const otherUser = ride?.pilot || ride?.rider;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>In Progress</Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={styles.durationValue}>{formatDuration(duration)}</Text>
          <Text style={styles.durationLabel}>Duration</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {userLocation && (
          <UniversalMap
            style={styles.map}
            center={{
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            }}
            zoom={14}
            markers={[
              {
                id: 'you',
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                color: '#10b981',
                label: 'Y',
                title: 'Your location',
              },
              ...(partnerLocation
                ? [
                    {
                      id: 'partner',
                      latitude: partnerLocation.lat,
                      longitude: partnerLocation.lng,
                      color: theme.colors.primary,
                      label: 'P',
                      title: otherUser?.name || 'Partner',
                    } as MapMarkerData,
                  ]
                : []),
            ]}
            routes={
              partnerLocation
                ? [
                    {
                      id: 'route',
                      coordinates: [
                        { latitude: userLocation.lat, longitude: userLocation.lng },
                        { latitude: partnerLocation.lat, longitude: partnerLocation.lng },
                      ],
                      color: theme.colors.primary,
                      width: 4,
                    } as MapRouteData,
                  ]
                : []
            }
          />
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <View style={styles.partnerInfo}>
          <View style={styles.partnerAvatar}>
            <Text style={styles.partnerAvatarText}>{otherUser?.name?.[0] || '?'}</Text>
          </View>
          <View style={styles.partnerDetails}>
            <Text style={styles.partnerName}>{otherUser?.name || 'Unknown'}</Text>
            <Text style={styles.partnerMeta}>
              {ride?.pilot?.pilot_vehicle_type || 'Vehicle'} • {ride?.pilot?.pilot_plate_number || 'No plate'}
            </Text>
            {partnerLocation && (
              <Text style={styles.partnerDistance}>
                {DEMO_MODE 
                  ? `${mockDistance.toFixed(2)} km traveled`
                  : 'Distance away'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.sosButton]} onPress={handleSOS}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.sosText]}>SOS</Text>
          </TouchableOpacity>
        </View>

        {DEMO_MODE && (
          <TouchableOpacity style={[styles.endButton, styles.demoEndButton]} onPress={handleDemoEndRide}>
            <Text style={styles.endButtonText}>Demo End Ride</Text>
          </TouchableOpacity>
        )}

        {profile?.isPilotAvailable && (
          <TouchableOpacity style={styles.endButton} onPress={handleEndRide}>
            <Text style={styles.endButtonText}>End Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    ...theme.shadows.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  durationContainer: {
    alignItems: 'flex-end',
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  durationLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...theme.shadows.lg,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 15,
  },
  partnerAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  partnerMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  partnerDistance: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sosButton: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  sosText: {
    color: '#fff',
  },
  endButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  demoEndButton: {
    backgroundColor: theme.colors.secondary,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

