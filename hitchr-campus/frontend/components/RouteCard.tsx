import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Spacing, BorderRadius, Typography } from '../constants/theme';
import { formatDistance, formatDuration } from '../utils/helpers';

interface RouteCardProps {
  route: any;
  onPress: () => void;
  theme?: 'light' | 'dark';
}

export default function RouteCard({ route, onPress, theme = 'light' }: RouteCardProps) {
  const { colors, shadows } = useTheme(theme);

  const timeRemaining = () => {
    const now = new Date();
    const departure = new Date(route.departure_time);
    const diff = Math.floor((departure.getTime() - now.getTime()) / 60000);
    if (diff < 0) return 'Now';
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...shadows.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    pilotInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pilotDetails: {
      flex: 1,
    },
    pilotName: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: colors.text,
      marginBottom: 2,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      fontSize: Typography.xs,
      color: colors.trust,
      fontWeight: Typography.semibold,
    },
    timePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.pill,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surface,
    },
    timeText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: colors.surface,
    },
    routeVisual: {
      marginBottom: Spacing.lg,
      position: 'relative',
    },
    routeStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    routePoint: {
      width: 40,
      alignItems: 'center',
    },
    pointDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    originDot: {
      backgroundColor: colors.primary,
    },
    destDot: {
      backgroundColor: colors.trust,
    },
    pointLabel: {
      fontSize: Typography.xs,
      color: colors.textTertiary,
    },
    routeArrow: {
      flex: 1,
      height: 3,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
      position: 'relative',
    },
    arrowHead: {
      position: 'absolute',
      right: -4,
      top: -4,
    },
    routeLabels: {
      marginTop: Spacing.sm,
    },
    routeLabel: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: colors.text,
    },
    footer: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    infoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.divider,
      borderRadius: BorderRadius.pill,
    },
    infoText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textSecondary,
    },
    note: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: Typography.lineHeights.normal * Typography.sm,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.pilotInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.pilotDetails}>
            <Text style={styles.pilotName}>{route.pilot_name}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.trust} />
              <Text style={styles.badgeText}>{route.pilot_college}</Text>
            </View>
          </View>
        </View>
        <View style={styles.timePill}>
          <View style={styles.liveDot} />
          <Text style={styles.timeText}>{timeRemaining()}</Text>
        </View>
      </View>

      <View style={styles.routeVisual}>
        <View style={styles.routeStrip}>
          <View style={styles.routePoint}>
            <View style={[styles.pointDot, styles.originDot]} />
            <Text style={styles.pointLabel}>From</Text>
          </View>
          <View style={styles.routeArrow}>
            <View style={styles.arrowHead}>
              <Ionicons name="play" size={12} color={colors.border} />
            </View>
          </View>
          <View style={styles.routePoint}>
            <View style={[styles.pointDot, styles.destDot]} />
            <Text style={styles.pointLabel}>To</Text>
          </View>
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routeLabel}>{route.from_point.name} → {route.to_point.name}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoPill}>
          <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formatDistance(route.distance_km)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formatDuration(route.duration_mins)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{route.seats_available} seats</Text>
        </View>
      </View>

      {route.note && <Text style={styles.note} numberOfLines={2}>{route.note}</Text>}
    </TouchableOpacity>
  );
}
