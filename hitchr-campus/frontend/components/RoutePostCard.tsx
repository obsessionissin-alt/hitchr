import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';
import { formatDistance, formatDuration } from '../utils/helpers';

interface RoutePostCardProps {
  route: any;
  onPress: () => void;
}

export default function RoutePostCard({ route, onPress }: RoutePostCardProps) {
  const timeRemaining = () => {
    const now = new Date();
    const departure = new Date(route.departure_time);
    const diff = Math.floor((departure.getTime() - now.getTime()) / 60000);
    if (diff < 0) return 'Now';
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.pilotInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.text} />
          </View>
          <View>
            <Text style={styles.pilotName}>{route.pilot_name}</Text>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.badgeText}>{route.pilot_college}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>{timeRemaining()}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={18} color={Colors.primary} />
          <Text style={styles.routeText}>{route.from_point.name}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Ionicons name="flag" size={18} color={Colors.accent} />
          <Text style={styles.routeText}>{route.to_point.name}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{formatDistance(route.distance_km)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{formatDuration(route.duration_mins)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{route.seats_available}/{route.total_seats}</Text>
        </View>
      </View>

      {route.note && (
        <Text style={styles.note} numberOfLines={2}>{route.note}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pilotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    color: Colors.success,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  route: {
    marginBottom: Spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 8,
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  note: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
