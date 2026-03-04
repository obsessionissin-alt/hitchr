import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { 
  campusRouteAPI, 
  campusPlannedTripAPI, 
  campusMemoryAPI 
} from '../../utils/campusApi';
import { formatDistance, formatDuration } from '../../utils/helpers';

type FeedFilter = 'all' | 'live' | 'planned' | 'memories';

interface FeedItem {
  id: string;
  type: 'route' | 'planned' | 'memory';
  user_name: string;
  user_college?: string;
  from_name: string;
  to_name: string;
  distance_km?: number;
  // Route specific
  seats_available?: number;
  time_window_mins?: number;
  departure_time?: string;
  status?: string;
  // Planned specific
  planned_date?: string;
  seats_needed?: number;
  description?: string;
  // Memory specific
  story?: string;
  tags?: string[];
  created_at: string;
}

const FILTER_CONFIG: Record<FeedFilter, { label: string; icon: string; color: string }> = {
  all: { label: 'All', icon: 'apps', color: Colors.primary },
  live: { label: 'Live Now', icon: 'flash', color: Colors.success },
  planned: { label: 'Planned', icon: 'calendar', color: Colors.info },
  memories: { label: 'Memories', icon: 'camera', color: Colors.accent },
};

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useCampusStore();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>('all');

  const loadFeed = useCallback(async () => {
    try {
      const items: FeedItem[] = [];

      // Load routes (live)
      if (filter === 'all' || filter === 'live') {
        try {
          const routesResponse = await campusRouteAPI.getAll('posted');
          const routes = routesResponse.data || [];
          routes.forEach((route: any) => {
            items.push({
              id: `route-${route.id}`,
              type: 'route',
              user_name: route.pilot_name,
              user_college: route.pilot_college,
              from_name: route.from_point?.name || 'Start',
              to_name: route.to_point?.name || 'End',
              distance_km: route.distance_km,
              seats_available: route.seats_available,
              time_window_mins: route.time_window_mins,
              departure_time: route.departure_time,
              status: route.status,
              created_at: route.created_at,
            });
          });
        } catch (e) {
          console.log('Error loading routes:', e);
        }
      }

      // Load planned trips
      if (filter === 'all' || filter === 'planned') {
        try {
          const tripsResponse = await campusPlannedTripAPI.getAll();
          const trips = tripsResponse.data || [];
          trips.forEach((trip: any) => {
            items.push({
              id: `planned-${trip.id}`,
              type: 'planned',
              user_name: trip.user_name,
              user_college: trip.user_college,
              from_name: trip.from_point?.name || 'Start',
              to_name: trip.to_point?.name || 'End',
              planned_date: trip.planned_date,
              seats_needed: trip.seats_needed,
              description: trip.description,
              created_at: trip.created_at,
            });
          });
        } catch (e) {
          console.log('Error loading trips:', e);
        }
      }

      // Load memories
      if (filter === 'all' || filter === 'memories') {
        try {
          const memoriesResponse = await campusMemoryAPI.getAll();
          const memories = memoriesResponse.data || [];
          memories.forEach((memory: any) => {
            items.push({
              id: `memory-${memory.id}`,
              type: 'memory',
              user_name: memory.user_name,
              user_college: memory.user_college,
              from_name: memory.from_point?.name || 'Start',
              to_name: memory.to_point?.name || 'End',
              distance_km: memory.distance_km,
              story: memory.story,
              tags: memory.tags,
              created_at: memory.created_at,
            });
          });
        } catch (e) {
          console.log('Error loading memories:', e);
        }
      }

      // Sort by created_at (newest first)
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setFeedItems(items);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed();
  }, [loadFeed]);

  const handleItemPress = (item: FeedItem) => {
    if (item.type === 'route') {
      const routeId = item.id.replace('route-', '');
      router.push(`/route/${routeId}`);
    }
    // For planned and memories, we could add detail screens later
  };

  const getTypeConfig = (type: FeedItem['type']) => {
    switch (type) {
      case 'route':
        return { icon: 'flash', color: Colors.success, label: 'Live Now' };
      case 'planned':
        return { icon: 'calendar', color: Colors.info, label: 'Planning' };
      case 'memory':
        return { icon: 'camera', color: Colors.accent, label: 'Memory' };
    }
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const typeConfig = getTypeConfig(item.type);
    
    return (
      <TouchableOpacity
        style={styles.feedCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={Colors.text} />
            </View>
            <View>
              <Text style={styles.userName}>{item.user_name}</Text>
              {item.user_college && (
                <View style={styles.collegeBadge}>
                  <Ionicons name="school" size={10} color={Colors.success} />
                  <Text style={styles.collegeText}>{item.user_college}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
            <Ionicons name={typeConfig.icon as any} size={12} color={typeConfig.color} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.routeText} numberOfLines={1}>{item.from_name}</Text>
          </View>
          <View style={styles.routeDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <View style={styles.routeRow}>
            <Ionicons name="flag" size={16} color={typeConfig.color} />
            <Text style={styles.routeText} numberOfLines={1}>{item.to_name}</Text>
          </View>
        </View>

        {/* Type-specific content */}
        {item.type === 'route' && (
          <View style={styles.routeInfo}>
            <View style={styles.infoChip}>
              <Ionicons name="people" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{item.seats_available} seats</Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="time" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>in {item.time_window_mins}m</Text>
            </View>
            {item.distance_km && (
              <View style={styles.infoChip}>
                <Ionicons name="speedometer" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{formatDistance(item.distance_km)}</Text>
              </View>
            )}
          </View>
        )}

        {item.type === 'planned' && (
          <View style={styles.plannedInfo}>
            {item.planned_date && (
              <Text style={styles.plannedDate}>
                <Ionicons name="calendar-outline" size={12} color={Colors.info} />
                {' '}{item.planned_date}
              </Text>
            )}
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
        )}

        {item.type === 'memory' && (
          <View style={styles.memoryInfo}>
            {item.story && (
              <Text style={styles.story} numberOfLines={3}>{item.story}</Text>
            )}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Live</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'live', 'planned', 'memories'] as FeedFilter[]).map((f) => {
          const config = FILTER_CONFIG[f];
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, isActive && { backgroundColor: config.color }]}
              onPress={() => setFilter(f)}
            >
              <Ionicons 
                name={config.icon as any} 
                size={14} 
                color={isActive ? Colors.white : Colors.textSecondary} 
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed List */}
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={64} color={Colors.gray} />
            <Text style={styles.emptyText}>No journeys here yet</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'live' && 'Be the first to say “I’m heading out.”'}
              {filter === 'planned' && 'Post a plan and find people going your way.'}
              {filter === 'memories' && 'Share a story that inspires others to move.'}
              {filter === 'all' && 'Pull down to refresh or post your journey.'}
            </Text>
          </View>
        }
      />
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
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
  },
  feedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  collegeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  routeContainer: {
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
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  routeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  plannedInfo: {
    gap: Spacing.xs,
  },
  plannedDate: {
    color: Colors.info,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  memoryInfo: {
    gap: Spacing.sm,
  },
  story: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
