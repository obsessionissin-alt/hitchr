// src/screens/RideActiveScreen.tsx
// Modern Indian Design - Live ride tracking with End Ride button for demo

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { DEV_MODE } from '../constants/config';

export default function RideActiveScreen({ route, navigation }: any) {
  const { pilot } = route.params;
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0.4); // Starting distance in km
  
  useEffect(() => {
    // Update elapsed time every second
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      // Simulate decreasing distance
      setDistance(prev => Math.max(0, prev - 0.02));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndRide = () => {
    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: () => {
            // Calculate tokens based on simulated distance
            const distanceMeters = (elapsedTime * 10); // ~10m per second
            const tokensEarned = 10 + Math.floor(distanceMeters / 1000); // Base 10 + 1 per km
            navigation.replace('RideComplete', { 
              pilot,
              tokensEarned,
              distance: distanceMeters,
            });
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert emergency contacts and share your live location.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>Ride in Progress</Text>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.etaLabel}>Duration</Text>
        </View>
      </View>

      {/* Map Visualization */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {/* Route line */}
          <View style={styles.routeLine} />
          
          {/* Progress indicator */}
          <View style={[styles.progressFill, { width: `${Math.min(80, elapsedTime * 2)}%` }]} />
          
          {/* Car icon moving */}
          <View style={[styles.carIcon, { left: `${Math.min(70, 20 + elapsedTime)}%` }]}>
            <Text style={styles.carEmoji}>🛺</Text>
          </View>
          
          {/* Start marker */}
          <View style={styles.startMarker}>
            <Text style={styles.markerText}>A</Text>
          </View>
          
          {/* Destination marker */}
          <View style={styles.destinationMarker}>
            <Text style={styles.destinationText}>B</Text>
          </View>
          
          {/* Tracking badge */}
          <View style={styles.trackingBadge}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingText}>Live Tracking</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        
        {/* Pilot Info Card */}
        <View style={styles.pilotCard}>
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
          
          <View style={styles.pilotDetails}>
            <Text style={styles.pilotName}>{pilot.name}</Text>
            <Text style={styles.pilotVehicle}>
              {pilot.vehicle.plate} • {pilot.vehicle.type}
            </Text>
            <View style={styles.distanceBadge}>
              <View style={styles.distanceDotLive} />
              <Text style={styles.pilotDistance}>{distance.toFixed(1)} km away</Text>
            </View>
          </View>
          
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingValue}>⭐ {pilot.rating}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.sosButton]}
            onPress={handleSOS}
          >
            <Text style={styles.sosIcon}>🚨</Text>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* End Ride Button - Always visible in demo mode */}
        {DEV_MODE && (
          <TouchableOpacity 
            style={styles.endRideButton}
            onPress={handleEndRide}
          >
            <Text style={styles.endRideText}>End Ride</Text>
            <Text style={styles.endRideSubtext}>Demo Mode</Text>
          </TouchableOpacity>
        )}

        {/* Ride Stats */}
        <View style={styles.rideStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(elapsedTime * 0.01).toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{10 + Math.floor(elapsedTime / 60)}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>~{Math.max(1, 8 - Math.floor(elapsedTime / 60))} min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.accent}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  etaContainer: {
    alignItems: 'flex-end',
  },
  etaValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  
  // Map
  mapContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  map: {
    flex: 1,
    backgroundColor: '#E8F4E8',
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    position: 'relative',
    overflow: 'hidden',
  },
  routeLine: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  carIcon: {
    position: 'absolute',
    top: '45%',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  carEmoji: {
    fontSize: 22,
  },
  startMarker: {
    position: 'absolute',
    top: '45%',
    left: '12%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.rider,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  destinationMarker: {
    position: 'absolute',
    top: '45%',
    right: '12%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  trackingBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
    ...theme.shadows.sm,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  // Bottom Sheet
  bottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  // Pilot Card
  pilotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  pilotDetails: {
    flex: 1,
  },
  pilotName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  pilotVehicle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  pilotDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  ratingDisplay: {
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  sosButton: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.borderStrong,
  },
  sosIcon: {
    fontSize: 18,
  },
  sosText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  
  // End Ride Button
  endRideButton: {
    backgroundColor: theme.colors.surfaceDark,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  endRideText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  endRideSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  
  // Stats
  rideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
});
