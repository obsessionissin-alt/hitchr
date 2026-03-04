import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRideAPI } from '../../utils/campusApi';
import { formatDistance, formatDuration } from '../../utils/helpers';
import haptics from '../../utils/haptics';

interface RideInstance {
  id: string;
  route_id: string;
  pilot_id: string;
  pilot_name: string;
  rider_id: string;
  rider_name: string;
  pickup: any;
  dropoff: any;
  pilot_destination: any;
  status: string;
  shared_distance_km: number;
  suggested_contribution: number;
  contribution_status: string;
  actual_contribution: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

const STATUS_BANNER: Record<string, { label: string; color: string; icon: string }> = {
  waiting: { label: 'Waiting for Pickup', color: Colors.warning, icon: 'time' },
  active: { label: 'Ride in Progress', color: Colors.success, icon: 'car-sport' },
  completed: { label: 'Journey Complete', color: Colors.textSecondary, icon: 'checkmark-circle' },
};

export default function RidingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, userRole } = useCampusStore();
  const [ride, setRide] = useState<RideInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRide = useCallback(async () => {
    try {
      const response = await campusRideAPI.get(id as string);
      setRide(response.data);
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadRide();
    }, [loadRide])
  );

  // Poll for updates if ride is active or waiting
  useEffect(() => {
    if (!ride || ride.status === 'completed') return;

    const interval = setInterval(() => {
      loadRide();
    }, 5000);

    return () => clearInterval(interval);
  }, [ride?.status, loadRide]);

  const isPilot = user?.id === ride?.pilot_id;

  const handleStartRide = async () => {
    if (!ride) return;
    
    haptics.tapMedium();
    
    Alert.alert(
      'Ready to roll? 🚗',
      'Confirm that you\'ve picked up your co-traveler and you\'re heading out!',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Let\'s go!',
          onPress: async () => {
            setActionLoading(true);
            try {
              await campusRideAPI.start(ride.id);
              haptics.journeyStart();
              await loadRide();
            } catch (error: any) {
              haptics.error();
              Alert.alert('Oops', error.response?.data?.detail || 'Couldn\'t start the journey. Try again?');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteRide = async () => {
    if (!ride) return;

    haptics.tapMedium();

    if (isPilot) {
      // Pilot marks ride as complete
      Alert.alert(
        'Journey complete? 🏁',
        'Confirm you\'ve dropped off your travel buddy safely.',
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: 'Yes, done!',
            onPress: async () => {
              setActionLoading(true);
              try {
                await campusRideAPI.complete(ride.id);
                haptics.celebrate();
                await loadRide();
                Alert.alert(
                  'Great journey! 🎉',
                  'Thanks for sharing the ride. Your co-traveler can now show their appreciation.'
                );
              } catch (error: any) {
                haptics.error();
                Alert.alert('Hmm', error.response?.data?.detail || 'Couldn\'t mark complete. Try again?');
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    } else {
      // Rider goes to contribution screen
      router.push(`/complete-ride/${ride.id}`);
    }
  };

  const handleBack = () => {
    router.back();
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
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Ride not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_BANNER[ride.status] || STATUS_BANNER.waiting;
  const otherPerson = isPilot
    ? { role: 'Rider', name: ride.rider_name }
    : { role: 'Pilot', name: ride.pilot_name };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.color }]}>
          <Ionicons name={statusConfig.icon as any} size={20} color={Colors.white} />
          <Text style={styles.statusBannerText}>{statusConfig.label}</Text>
          {(ride.status === 'waiting' || ride.status === 'active') && (
            <View style={styles.pulsingDot} />
          )}
        </View>

        {/* Person Card */}
        <View style={styles.personCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.text} />
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personRole}>{otherPerson.role}</Text>
            <Text style={styles.personName}>{otherPerson.name}</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Journey Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Details</Text>
          <View style={styles.journeyCard}>
            <View style={styles.journeyPoint}>
              <View style={[styles.journeyIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="location" size={18} color={Colors.primary} />
              </View>
              <View style={styles.journeyDetails}>
                <Text style={styles.journeyLabel}>Pickup</Text>
                <Text style={styles.journeyText}>{ride.pickup?.name || 'Start point'}</Text>
              </View>
            </View>

            <View style={styles.journeyLine}>
              <View style={styles.lineSegment} />
              <Text style={styles.distanceBadge}>{formatDistance(ride.shared_distance_km)}</Text>
              <View style={styles.lineSegment} />
            </View>

            <View style={styles.journeyPoint}>
              <View style={[styles.journeyIcon, { backgroundColor: Colors.accent + '20' }]}>
                <Ionicons name="flag" size={18} color={Colors.accent} />
              </View>
              <View style={styles.journeyDetails}>
                <Text style={styles.journeyLabel}>Drop-off</Text>
                <Text style={styles.journeyText}>{ride.dropoff?.name || 'End point'}</Text>
              </View>
            </View>

            {ride.pilot_destination && (
              <>
                <View style={styles.journeyLine}>
                  <View style={styles.lineSegment} />
                </View>
                <View style={styles.journeyPoint}>
                  <View style={[styles.journeyIcon, { backgroundColor: Colors.textMuted + '20' }]}>
                    <Ionicons name="navigate" size={18} color={Colors.textMuted} />
                  </View>
                  <View style={styles.journeyDetails}>
                    <Text style={styles.journeyLabel}>Pilot continues to</Text>
                    <Text style={[styles.journeyText, { color: Colors.textSecondary }]}>
                      {ride.pilot_destination?.name || 'Final destination'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Contribution Preview (for completed rides) */}
        {ride.status === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contribution</Text>
            <View style={styles.contributionCard}>
              <Ionicons
                name={ride.contribution_status === 'paid' ? 'checkmark-circle' : 'wallet-outline'}
                size={32}
                color={ride.contribution_status === 'paid' ? Colors.success : Colors.primary}
              />
              <View style={styles.contributionInfo}>
                {ride.contribution_status === 'paid' ? (
                  <>
                    <Text style={styles.contributionLabel}>Contributed</Text>
                    <Text style={styles.contributionAmount}>₹{ride.actual_contribution}</Text>
                  </>
                ) : ride.contribution_status === 'waived' ? (
                  <>
                    <Text style={styles.contributionLabel}>Contribution</Text>
                    <Text style={[styles.contributionAmount, { color: Colors.textSecondary }]}>Waived</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.contributionLabel}>Suggested contribution</Text>
                    <Text style={styles.contributionAmount}>₹{ride.suggested_contribution}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Safety Card */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <View style={styles.safetyInfo}>
            <Text style={styles.safetyTitle}>Travel Safe</Text>
            <Text style={styles.safetyText}>
              Your journey is being tracked. Share ride details with trusted contacts.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {ride.status === 'waiting' && isPilot && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartRide}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="play" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>Start Ride</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {ride.status === 'waiting' && !isPilot && (
          <View style={styles.waitingMessage}>
            <ActivityIndicator size="small" color={Colors.warning} />
            <Text style={styles.waitingText}>Waiting for pilot to start the ride...</Text>
          </View>
        )}

        {ride.status === 'active' && isPilot && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteRide}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>Complete Ride</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {ride.status === 'active' && !isPilot && (
          <View style={styles.inProgressMessage}>
            <View style={styles.liveDot} />
            <Text style={styles.inProgressText}>Ride in progress. Enjoy the journey!</Text>
          </View>
        )}

        {ride.status === 'completed' && ride.contribution_status === 'pending' && !isPilot && (
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={handleCompleteRide}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Contribute to Pilot</Text>
          </TouchableOpacity>
        )}

        {ride.status === 'completed' && (ride.contribution_status !== 'pending' || isPilot) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
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
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statusBanner: {
    paddingVertical: Spacing.md,
    paddingTop: Spacing.xl + 40, // Safe area
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statusBannerText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personRole: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  personName: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  journeyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  journeyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  journeyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyDetails: {
    flex: 1,
  },
  journeyLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: 2,
  },
  journeyText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  journeyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 17,
    paddingVertical: Spacing.sm,
  },
  lineSegment: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
  },
  distanceBadge: {
    paddingHorizontal: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  contributionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  contributionInfo: {
    flex: 1,
  },
  contributionLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: 2,
  },
  contributionAmount: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  safetyCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    margin: Spacing.lg,
    marginTop: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.trustGreen,
  },
  safetyInfo: {
    flex: 1,
  },
  safetyTitle: {
    color: Colors.success,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  safetyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  completeButton: {
    backgroundColor: Colors.primary,
  },
  payButton: {
    backgroundColor: Colors.primary,
  },
  doneButton: {
    backgroundColor: Colors.surface,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  waitingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  waitingText: {
    color: Colors.warning,
    fontSize: FontSizes.md,
  },
  inProgressMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  inProgressText: {
    color: Colors.success,
    fontSize: FontSizes.md,
  },
});
