import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

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
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{pilot.avatar}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{pilot.name}</Text>
              <Text style={styles.vehicle}>
                {pilot.vehicle.type} • {pilot.vehicle.plate}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {pilot.rating}</Text>
                <Text style={styles.separator}>|</Text>
                {pilot.verified && (
                  <Text style={styles.verified}>✓ Verified</Text>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.proximityIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.proximityText}>
              {(pilot.distance / 1000).toFixed(1)} km away • ~{Math.ceil(pilot.distance / 500)} mins
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pilot.totalRides}</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pilot.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(pilot.totalKm / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>KM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pilot.tokens}</Text>
              <Text style={styles.statLabel}>Tokens</Text>
            </View>
          </View>
          
          {pilot.badges && pilot.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.badgesContainer}>
                {pilot.badges.map((badge: string, index: number) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.primaryButton} onPress={onNotify}>
            <Text style={styles.primaryButtonText}>🔔 Notify Pilot</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onViewFull}>
            <Text style={styles.secondaryButtonText}>View Full Profile</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FBBF24',
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: '#CBD5E1',
    marginHorizontal: 8,
  },
  verified: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  proximityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  proximityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  badgesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});
