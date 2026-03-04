import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';

interface JoinRequestCardProps {
  request: any;
  onAccept: () => void;
  onDecline: () => void;
}

export default function JoinRequestCard({ request, onAccept, onDecline }: JoinRequestCardProps) {
  const timeAgo = () => {
    const now = new Date();
    const requested = new Date(request.requested_at);
    const diff = Math.floor((now.getTime() - requested.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.riderInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.text} />
          </View>
          <View>
            <Text style={styles.riderName}>{request.rider_name}</Text>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.badgeText}>{request.rider_college}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.timeText}>{timeAgo()}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.routeLabel}>Pickup: {request.pickup.name}</Text>
        </View>
        <View style={styles.routePoint}>
          <Ionicons name="flag" size={16} color={Colors.accent} />
          <Text style={styles.routeLabel}>Dropoff: {request.dropoff.name}</Text>
        </View>
      </View>

      {request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={onDecline}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color={Colors.error} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color={Colors.white} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status !== 'pending' && (
        <View style={[styles.statusBadge, request.status === 'accepted' ? styles.acceptedBadge : styles.declinedBadge]}>
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
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
  timeText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  route: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  declineButton: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  declineText: {
    color: Colors.error,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  acceptText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptedBadge: {
    backgroundColor: Colors.trustGreenLight,
  },
  declinedBadge: {
    backgroundColor: Colors.error + '12',
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
});
