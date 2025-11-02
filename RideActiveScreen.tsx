// src/screens/RideActiveScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEMO_RIDE_DURATION = 8000; // 8 seconds in demo mode

export default function RideActiveScreen({ route, navigation }: any) {
  const { rideId, pilotId, pilotName } = route.params;
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(8);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Demo: Progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (DEMO_RIDE_DURATION / 1000));
        if (newProgress >= 100) {
          clearInterval(interval);
          completeRide();
          return 100;
        }
        return newProgress;
      });

      setEta((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const completeRide = () => {
    setTimeout(() => {
      navigation.replace('RideComplete', {
        rideId,
        pilotId,
        pilotName,
        distance: 2.5,
        duration: 8,
        tokensEarned: 15,
      });
    }, 500);
  };

  const handleEndRide = () => {
    completeRide();
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>In Progress</Text>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaValue}>{eta} min</Text>
          <Text style={styles.etaLabel}>ETA</Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.routeLine} />
        <Animated.View
          style={[
            styles.carMarker,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="car" size={24} color="#FFFFFF" />
        </Animated.View>
        <View style={styles.destinationMarker}>
          <Ionicons name="location" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.trackingBadge}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>Tracking</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Pilot Info Card */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <View style={styles.pilotCard}>
          <View style={styles.pilotAvatar}>
            <Text style={styles.pilotAvatarText}>
              {pilotName?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
          <View style={styles.pilotInfo}>
            <Text style={styles.pilotName}>{pilotName || 'Pilot'}</Text>
            <Text style={styles.pilotMeta}>Sedan • ⭐ 4.9</Text>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={12} color="#10B981" />
              <Text style={styles.distanceText}>0.4 km away</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.sosButton]}>
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.sosButtonText]}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* End Ride Button */}
        <TouchableOpacity
          style={styles.endRideButton}
          onPress={handleEndRide}
        >
          <Text style={styles.endRideButtonText}>End Ride (Demo)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  etaContainer: {
    alignItems: 'flex-end',
  },
  etaValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  etaLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    position: 'absolute',
    width: 4,
    height: '60%',
    backgroundColor: '#3B82F6',
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
  carMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  destinationMarker: {
    position: 'absolute',
    bottom: 80,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  trackingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pilotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  pilotAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pilotAvatarText: {
    fontSize: 24,
    fontWeight: '700',
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
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sosButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  sosButtonText: {
    color: '#FFFFFF',
  },
  endRideButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  endRideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});