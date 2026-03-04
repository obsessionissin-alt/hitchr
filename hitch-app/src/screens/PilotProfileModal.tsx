// src/screens/PilotProfileModal.tsx
// Modern Indian Design - Bold, social pilot profiles

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../constants/theme';

interface PilotProfileModalProps {
  pilot: any;
  onClose: () => void;
  onNotify: () => void;
  onViewFull: () => void;
}

export default function PilotProfileModal({ pilot, onClose, onNotify, onViewFull }: PilotProfileModalProps) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <View style={styles.modal}>
        <View style={styles.handle} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{pilot.avatar}</Text>
              </View>
              {pilot.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{pilot.name}</Text>
              <Text style={styles.vehicle}>
                {pilot.vehicle.type} • {pilot.vehicle.plate}
              </Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {pilot.rating}</Text>
                </View>
                <View style={styles.rideBadge}>
                  <Text style={styles.rideText}>{pilot.totalRides} rides</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Proximity Indicator */}
          <View style={styles.proximityCard}>
            <View style={styles.proximityDot} />
            <View style={styles.proximityInfo}>
              <Text style={styles.proximityLabel}>Distance</Text>
              <Text style={styles.proximityValue}>
                {(pilot.distance / 1000).toFixed(1)} km away
              </Text>
            </View>
            <View style={styles.proximityEta}>
              <Text style={styles.etaValue}>~{Math.ceil(pilot.distance / 500)}</Text>
              <Text style={styles.etaLabel}>min</Text>
            </View>
          </View>
          
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pilot.totalRides}</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxHighlight]}>
              <Text style={[styles.statValue, styles.statValueHighlight]}>{pilot.rating}</Text>
              <Text style={[styles.statLabel, styles.statLabelHighlight]}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(pilot.totalKm)}</Text>
              <Text style={styles.statLabel}>KM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pilot.tokens}</Text>
              <Text style={styles.statLabel}>Tokens</Text>
            </View>
          </View>
          
          {/* Badges */}
          {pilot.badges && pilot.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.badgesContainer}>
                {pilot.badges.map((badge: string, index: number) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onNotify}>
              <Text style={styles.primaryButtonIcon}>🔔</Text>
              <Text style={styles.primaryButtonText}>Notify Pilot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onViewFull}>
              <Text style={styles.secondaryButtonText}>View Full Profile</Text>
              <Text style={styles.secondaryButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    maxHeight: '85%',
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: theme.colors.borderStrong,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  rideBadge: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  rideText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  
  // Proximity
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.accent}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: `${theme.colors.accent}30`,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  proximityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  proximityInfo: {
    flex: 1,
  },
  proximityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proximityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
    marginTop: 2,
  },
  proximityEta: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
  },
  etaValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textInverse,
    textTransform: 'uppercase',
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statBoxHighlight: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  statValueHighlight: {
    color: theme.colors.textOnPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelHighlight: {
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
  },
  
  // Badges
  badgesSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  
  // Actions
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    gap: 10,
    ...theme.shadows.magenta,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  secondaryButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
});
