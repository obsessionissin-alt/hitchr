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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRouteAPI } from '../../utils/campusApi';
import RouteCard from '../../components/RouteCard';
import RoleToggle from '../../components/RoleToggle';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme('light');
  const { user, userRole, routes, setRoutes, myRoutes, setMyRoutes } = useCampusStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      if (userRole === 'rider') {
        const response = await campusRouteAPI.getAll('posted');
        setRoutes(response.data);
      } else {
        if (user) {
          const response = await campusRouteAPI.getByPilot(user.id);
          setMyRoutes(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [userRole]);

  const handleCreateRoute = () => {
    router.push('/composer');
  };

  const handleRoutePress = (route: any) => {
    router.push(`/route/${route.id}`);
  };

  const displayData = userRole === 'rider' ? routes : myRoutes;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    greeting: {
      fontSize: Typography.xs,
      color: colors.textSecondary,
      fontWeight: Typography.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    title: {
      fontSize: Typography.xxl,
      fontWeight: Typography.extrabold,
      color: colors.text,
    },
    searchButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.primary,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md + 2,
      borderRadius: BorderRadius.lg,
      ...shadows.md,
    },
    createButtonText: {
      color: colors.surface,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
    },
    sectionHeader: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    listContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.huge,
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    emptySubtext: {
      color: colors.textSecondary,
      fontSize: Typography.md,
      marginTop: Spacing.xs,
      textAlign: 'center',
      lineHeight: Typography.lineHeights.normal * Typography.md,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day</Text>
            <Text style={styles.title}>{userRole === 'rider' ? 'Live Now' : 'My Routes'}</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <RoleToggle />
      </View>

      {userRole === 'pilot' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateRoute}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color={colors.surface} />
          <Text style={styles.createButtonText}>Post New Route</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {userRole === 'rider' ? 'Available Routes' : 'Active Posts'}
        </Text>
      </View>

      <FlatList
        data={displayData}
        renderItem={({ item }) => (
          <RouteCard
            route={item}
            onPress={() => handleRoutePress(item)}
            theme="light"
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>
              {userRole === 'rider'
                ? 'No routes available'
                : 'No routes posted yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {userRole === 'rider'
                ? 'Pull down to refresh or check back later'
                : 'Create your first route to start sharing rides'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
