// src/components/PilotProfileModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const { height } = Dimensions.get('window');

interface Pilot {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  distance: number;
  vehicle?: { type: string; model: string };
}

interface PilotProfileModalProps {
  visible: boolean;
  pilot: Pilot | null;
  onClose: () => void;
  onNotify: () => void;
  onViewFullProfile: () => void;
}

export default function PilotProfileModal({
  visible,
  pilot,
  onClose,
  onNotify,
  onViewFullProfile,
}: PilotProfileModalProps) {
  if (!pilot) return null;

  const stats = [
    { label: 'Rides', value: pilot.totalRides, icon: 'car' },
    { label: 'Rating', value: pilot.rating.toFixed(1), icon: 'star' },
    { label: 'KM', value: '1.2k', icon: 'map' }, // Mock data
    { label: 'Tokens', value: '450', icon: 'wallet' }, // Mock data
  ];

  const badges = [
    { icon: '🏆', title: 'Top Pilot' },
    { icon: '🌟', title: '5-Star Pro' },
    { icon: '🛡️', title: 'Safe Driver' },
  ];

  // Calculate ETA (mock: ~2 mins per km)
  const etaMinutes = Math.round((pilot.distance / 1000) * 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{pilot.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.name}>{pilot.name}</Text>
              <Text style={styles.vehicle}>
                {pilot.vehicle?.type || 'Car'} • {pilot.vehicle?.model || 'Sedan'}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color={theme.colors.warning} />
                <Text style={styles.rating}>{pilot.rating.toFixed(1)}</Text>
              </View>
            </View>

            {/* Distance Indicator */}
            <View style={styles.distanceCard}>
              <Ionicons name="location" size={16} color={theme.colors.secondary} />
              <Text style={styles.distanceText}>
                {(pilot.distance / 1000).toFixed(1)} km away • ~{etaMinutes} mins
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statBox}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name={stat.icon as any} size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Badges */}
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.badgesRow}>
                {badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeText}>{badge.title}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.notifyButton} onPress={onNotify}>
                <Ionicons name="notifications" size={20} color={theme.colors.white} />
                <Text style={styles.notifyButtonText}>🔔 Notify Pilot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewProfileButton} onPress={onViewFullProfile}>
                <Text style={styles.viewProfileButtonText}>View Full Profile</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  viewProfileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
