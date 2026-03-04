import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRideAPI } from '../../utils/campusApi';
import { formatDistance } from '../../utils/helpers';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  waiting: { label: 'Waiting for Pickup', color: Colors.warning, icon: 'time-outline' },
  active: { label: 'Ride in Progress', color: Colors.success, icon: 'car-sport' },
  completed: { label: 'Completed', color: Colors.textSecondary, icon: 'checkmark-circle' },
};

export default function RidesScreen() {
  const router = useRouter();
  const { user, userRole } = useCampusStore();
  const [rides, setRides] = useState<RideInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRides = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let response;
      if (userRole === 'pilot') {
        response = await campusRideAPI.getByPilot(user.id);
      } else {
        response = await campusRideAPI.getByRider(user.id);
      }
      
      // Sort by status: active first, then waiting, then completed
      const sortedRides = (response.data || []).sort((a: RideInstance, b: RideInstance) => {
        const statusOrder: Record<string, number> = { active: 0, waiting: 1, completed: 2 };
        return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      });
      
      setRides(sortedRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userRole]);

  // Load on mount and when role changes
  useEffect(() => {
    loadRides();
  }, [loadRides]);

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [loadRides])
  );

  // Auto-refresh for active/waiting rides (poll every 5s)
  useEffect(() => {
    const hasActiveRides = rides.some(r => r.status === 'active' || r.status === 'waiting');
    if (!hasActiveRides) return;

    const interval = setInterval(() => {
      loadRides();
    }, 5000);

    return () => clearInterval(interval);
  }, [rides, loadRides]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [loadRides]);

  const handleRidePress = (ride: RideInstance) => {
    if (ride.status === 'completed' && ride.contribution_status === 'pending' && userRole === 'rider') {
      // Rider needs to pay
      router.push(`/complete-ride/${ride.id}`);
    } else {
      // View ride details
      router.push(`/riding/${ride.id}`);
    }
  };

  const renderRide = ({ item }: { item: RideInstance }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
    const isPilot = userRole === 'pilot';
    const showPaymentCta = item.status === 'completed' && item.contribution_status === 'pending' && !isPilot;

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}
        activeOpacity={0.7}
      >
        {/* Status indicator */}
        <View style={[styles.statusBar, { backgroundColor: config.color }]} />
        
        <View style={styles.rideContent}>
          {/* Header: person + status */}
          <View style={styles.rideHeader}>
            <View style={styles.personInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.text} />
              </View>
              <View>
                <Text style={styles.personRole}>{isPilot ? 'Rider' : 'Pilot'}</Text>
                <Text style={styles.personName}>
                  {isPilot ? item.rider_name : item.pilot_name}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon as any} size={14} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          {/* Route info */}
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.pickup?.name || 'Pickup location'}
              </Text>
            </View>
            <View style={styles.routeDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color={Colors.accent} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.dropoff?.name || 'Drop-off location'}
              </Text>
            </View>
          </View>

          {/* Footer: distance + action hint */}
          <View style={styles.rideFooter}>
            <Text style={styles.distanceText}>
              {formatDistance(item.shared_distance_km)} shared
            </Text>
            {showPaymentCta && (
              <View style={styles.paymentCta}>
                <Ionicons name="wallet-outline" size={14} color={Colors.primary} />
                <Text style={styles.paymentCtaText}>Tap to contribute</Text>
              </View>
            )}
            {item.status !== 'completed' && (
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading rides...</Text>
      </View>
    );
  }

  const activeRides = rides.filter(r => r.status === 'active' || r.status === 'waiting');
  const completedRides = rides.filter(r => r.status === 'completed');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Journeys</Text>
        <Text style={styles.subtitle}>
          {activeRides.length > 0
            ? `${activeRides.length} active ride${activeRides.length > 1 ? 's' : ''}`
            : 'No active rides'}
        </Text>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={Colors.gray} />
          <Text style={styles.emptyTitle}>No Journeys Yet</Text>
          <Text style={styles.emptySubtitle}>
            {userRole === 'pilot'
              ? 'Accept a request to begin a shared journey'
              : 'Join a live route to start moving together'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRide}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            activeRides.length > 0 ? (
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>Active Rides</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            completedRides.length > 0 && activeRides.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.sectionTitle}>Past Rides</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rideCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadows.sm,
  },
  statusBar: {
    width: 4,
  },
  rideContent: {
    flex: 1,
    padding: Spacing.md,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personRole: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  personName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  routeInfo: {
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeDots: {
    marginLeft: 6,
    paddingVertical: 2,
    gap: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
  },
  routeText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  rideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  distanceText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  paymentCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentCtaText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
});
