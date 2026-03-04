import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { campusCommunityAPI } from '../../utils/campusApi';

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
}

const COMMUNITY_ICONS: Record<string, string> = {
  'Delhi University': 'school',
  'IIT Delhi': 'school',
  'Spiti Valley Explorers': 'mountain',
  'default': 'people',
};

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommunities = useCallback(async () => {
    try {
      const response = await campusCommunityAPI.getAll();
      setCommunities(response.data || []);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  useFocusEffect(
    useCallback(() => {
      loadCommunities();
    }, [loadCommunities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommunities();
  }, [loadCommunities]);

  const getIconName = (name: string) => {
    return COMMUNITY_ICONS[name] || COMMUNITY_ICONS.default;
  };

  const renderCommunityCard = ({ item }: { item: Community }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIconName(item.name) as any} size={28} color={Colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.footer}>
          <View style={styles.memberBadge}>
            <Ionicons name="people" size={12} color={Colors.primary} />
            <Text style={styles.memberCount}>{item.member_count} members</Text>
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <Text style={styles.headerSubtitle}>
          Connect with travelers from your campus & interests
        </Text>
      </View>

      {/* Communities List */}
      <FlatList
        data={communities}
        renderItem={renderCommunityCard}
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-circle-outline" size={80} color={Colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Communities Yet</Text>
            <Text style={styles.emptySubtitle}>
              Communities help you find travel buddies from your campus, city, or shared interests.
            </Text>
            <View style={styles.emptyTips}>
              <View style={styles.tipRow}>
                <Ionicons name="school" size={20} color={Colors.primary} />
                <Text style={styles.tipText}>Campus communities (DU, IIT, etc.)</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="location" size={20} color={Colors.info} />
                <Text style={styles.tipText}>Location-based (Spiti, Manali)</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="heart" size={20} color={Colors.accent} />
                <Text style={styles.tipText}>Interest-based (Trekking, Road trips)</Text>
              </View>
            </View>
          </View>
        }
        ListHeaderComponent={
          communities.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {communities.length} {communities.length === 1 ? 'community' : 'communities'}
              </Text>
            </View>
          ) : null
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
    paddingBottom: Spacing.md,
    backgroundColor: Colors.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  listContent: {
    padding: Spacing.md,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  listHeaderText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  communityName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyTips: {
    gap: Spacing.md,
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    flex: 1,
  },
});
