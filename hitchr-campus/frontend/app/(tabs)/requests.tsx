import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRouteAPI, campusJoinRequestAPI } from '../../utils/campusApi';
import JoinRequestCard from '../../components/JoinRequestCard';
import haptics from '../../utils/haptics';

interface RouteWithRequests {
  route: any;
  requests: any[];
}

export default function RequestsScreen() {
  const router = useRouter();
  const { user, userRole } = useCampusStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routesWithRequests, setRoutesWithRequests] = useState<RouteWithRequests[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user || userRole !== 'pilot') {
      setLoading(false);
      return;
    }

    try {
      // 1. Get pilot's routes
      const routesResponse = await campusRouteAPI.getByPilot(user.id);
      const pilotRoutes = routesResponse.data || [];

      // 2. For each route, get pending join requests
      const routesWithPendingRequests: RouteWithRequests[] = [];
      
      for (const route of pilotRoutes) {
        try {
          const requestsResponse = await campusJoinRequestAPI.getByRoute(route.id, 'pending');
          const requests = requestsResponse.data || [];
          
          if (requests.length > 0) {
            routesWithPendingRequests.push({ route, requests });
          }
        } catch (err) {
          console.log(`No requests for route ${route.id}`);
        }
      }

      setRoutesWithRequests(routesWithPendingRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const handleAccept = async (requestId: string, routeId: string) => {
    setProcessingId(requestId);
    try {
      await campusJoinRequestAPI.respond(requestId, 'accept');
      
      // Celebrate with haptic feedback!
      haptics.celebrate();
      
      // Show success with social language
      Alert.alert(
        'You\'ve got company! 🚗',
        'Your travel buddy has been notified. Time to meet up and hit the road together!',
        [
          {
            text: 'See Journey',
            onPress: () => {
              loadRequests();
              router.push('/(tabs)/rides');
            },
          },
          {
            text: 'Keep Checking',
            onPress: () => loadRequests(),
          },
        ]
      );
    } catch (error: any) {
      haptics.error();
      console.error('Error accepting request:', error);
      Alert.alert('Couldn\'t connect', error.response?.data?.detail || 'Something went wrong. Give it another shot?');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    Alert.alert(
      'Decline Request?',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await campusJoinRequestAPI.respond(requestId, 'decline');
              loadRequests();
            } catch (error: any) {
              console.error('Error declining request:', error);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to decline request.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  // Show message for riders
  if (userRole !== 'pilot') {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="swap-horizontal-outline" size={64} color={Colors.gray} />
        <Text style={styles.emptyTitle}>Switch to Pilot Mode</Text>
        <Text style={styles.emptySubtitle}>
          You'll see ride requests here when you're offering rides as a Pilot
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  // Flatten all requests for the list while keeping route context
  const allRequests = routesWithRequests.flatMap((rwr) =>
    rwr.requests.map((req) => ({ ...req, routeInfo: rwr.route }))
  );

  const renderRequest = ({ item }: { item: any }) => (
    <View style={styles.requestWrapper}>
      <View style={styles.routeContext}>
        <Ionicons name="navigate-circle" size={16} color={Colors.primary} />
        <Text style={styles.routeContextText} numberOfLines={1}>
          {item.routeInfo.from_point?.name || 'Start'} → {item.routeInfo.to_point?.name || 'End'}
        </Text>
        <View style={styles.seatsBadge}>
          <Text style={styles.seatsText}>{item.routeInfo.seats_available} seats</Text>
        </View>
      </View>
      <JoinRequestCard
        request={item}
        onAccept={() => handleAccept(item.id, item.route_id)}
        onDecline={() => handleDecline(item.id)}
      />
      {processingId === item.id && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color={Colors.white} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride Requests</Text>
        <Text style={styles.subtitle}>
          {allRequests.length} pending {allRequests.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      {allRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color={Colors.gray} />
          <Text style={styles.emptyTitle}>No New Join Requests</Text>
          <Text style={styles.emptySubtitle}>
            When someone wants to share a ride with you, it will show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={allRequests}
          renderItem={renderRequest}
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
    paddingTop: Spacing.xl + 40, // Safe area
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
    backgroundColor: Colors.background,
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
  requestWrapper: {
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  routeContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  routeContextText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  seatsBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  seatsText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
});
