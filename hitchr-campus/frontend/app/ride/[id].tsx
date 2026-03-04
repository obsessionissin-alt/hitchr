import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useRideStore } from '../../store/rideStore';
import { useUserStore } from '../../store/userStore';
import { rideAPI } from '../../utils/api';
import { formatDistance, formatDuration, getVehicleIcon, getStatusColor } from '../../utils/helpers';

export default function RideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUserStore();
  const { setCurrentRide, updateRide } = useRideStore();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadRide();
  }, [id]);

  const loadRide = async () => {
    try {
      const response = await rideAPI.get(id as string);
      setRide(response.data);
    } catch (error) {
      console.error('Error loading ride:', error);
      alert('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      alert('Please enter both pickup and dropoff locations');
      return;
    }

    setJoining(true);
    try {
      const joinData = {
        user_id: user?.id,
        user_name: user?.name,
        pickup: {
          lat: ride.route.origin.lat,
          lng: ride.route.origin.lng,
          address: pickupAddress,
          name: pickupAddress,
        },
        dropoff: {
          lat: ride.route.destination.lat,
          lng: ride.route.destination.lng,
          address: dropoffAddress,
          name: dropoffAddress,
        },
      };

      const response = await rideAPI.join(id as string, joinData);
      const updatedRide = response.data;
      
      updateRide(updatedRide);
      setCurrentRide(updatedRide);
      setJoinModalVisible(false);
      
      // Navigate to riding screen
      router.push(`/riding/${id}`);
    } catch (error: any) {
      console.error('Error joining ride:', error);
      alert(error.response?.data?.detail || 'Failed to join ride');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const isRideFull = ride.riders.length >= ride.max_riders;
  const hasJoined = ride.riders.some((r: any) => r.user_id === user?.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
            <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Pilot Info */}
        <View style={styles.pilotSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.text} />
          </View>
          <View style={styles.pilotInfo}>
            <Text style={styles.pilotName}>{ride.pilot_name}</Text>
            <View style={styles.vehicleInfo}>
              <Ionicons name={getVehicleIcon(ride.vehicle_type)} size={16} color={Colors.textSecondary} />
              <Text style={styles.vehicleText}>{ride.vehicle_type}</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <Ionicons name="location" size={24} color={Colors.primary} />
              <View>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeText}>{ride.route.origin.name}</Text>
                <Text style={styles.routeAddress}>{ride.route.origin.address}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <Ionicons name="flag" size={24} color={Colors.accent} />
              <View>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeText}>{ride.route.destination.name}</Text>
                <Text style={styles.routeAddress}>{ride.route.destination.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
              <Text style={styles.statText}>{formatDistance(ride.route.distance_km)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.statText}>{formatDuration(ride.route.duration_mins)}</Text>
            </View>
          </View>
        </View>

        {/* Riders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Riders ({ride.riders.length}/{ride.max_riders})
          </Text>
          {ride.riders.length > 0 ? (
            ride.riders.map((rider: any, index: number) => (
              <View key={index} style={styles.riderCard}>
                <Ionicons name="person-circle" size={32} color={Colors.primary} />
                <Text style={styles.riderName}>{rider.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No riders yet. Be the first!</Text>
          )}
        </View>

        {/* Description */}
        {ride.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this ride</Text>
            <Text style={styles.description}>{ride.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Join Button */}
      {!hasJoined && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.joinButton, isRideFull && styles.joinButtonDisabled]}
            onPress={() => setJoinModalVisible(true)}
            disabled={isRideFull}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>
              {isRideFull ? 'Ride Full' : 'Join Ride'}
            </Text>
            {!isRideFull && <Ionicons name="arrow-forward" size={20} color={Colors.white} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Join Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Ride</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Where should the pilot pick you up?"
              placeholderTextColor={Colors.textMuted}
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />

            <Text style={styles.inputLabel}>Dropoff Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Where do you want to go?"
              placeholderTextColor={Colors.textMuted}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.info} />
              <Text style={styles.infoText}>
                No payment required now. You'll pay after the ride based on shared distance.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, joining && styles.modalButtonDisabled]}
              onPress={handleJoinRide}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Confirm & Join</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  pilotSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.darkGray,
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotInfo: {
    flex: 1,
  },
  pilotName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vehicleText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textTransform: 'capitalize',
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  routeContainer: {
    marginBottom: Spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  routeLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  routeText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  routeAddress: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.border,
    marginLeft: 11,
    marginVertical: Spacing.sm,
  },
  routeStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.md,
  },
  statText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  riderName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.darkGray,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  joinButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
