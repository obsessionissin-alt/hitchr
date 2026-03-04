// src/components/UserProfileModal.tsx
// Profile modal for displaying nearby user details
// Accepts normalized UserMarker type from useNearbyUsers hook

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import type { UserMarker } from '../types/userMarker';

interface UserProfileModalProps {
  visible: boolean;
  user: UserMarker | null;
  onClose: () => void;
  onNotify?: (user: UserMarker) => Promise<void>;
  notifyLoading?: boolean;
}

export default function UserProfileModal({
  visible,
  user,
  onClose,
  onNotify,
  notifyLoading = false,
}: UserProfileModalProps) {
  if (!user) return null;

  const isPilot = user.role === 'pilot';

  const handleNotify = async () => {
    if (!onNotify) return;
    await onNotify(user);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={[styles.avatar, { backgroundColor: isPilot ? theme.colors.pilot : theme.colors.rider }]}>
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{user.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.rating}>{user.rating?.toFixed(1) || 'N/A'}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: isPilot ? theme.colors.pilot : theme.colors.rider }]}>
                    <Text style={styles.roleText}>{isPilot ? 'PILOT' : 'RIDER'}</Text>
                  </View>
                  {user.is_mock && (
                    <View style={styles.mockBadge}>
                      <Text style={styles.mockText}>MOCK</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Stats */}
            <View style={styles.statsContainer}>
              {user.total_rides !== undefined && (
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{user.total_rides}</Text>
                  <Text style={styles.statLabel}>Rides</Text>
                </View>
              )}
              {isPilot && user.total_km !== undefined && (
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{Math.round(user.total_km)}</Text>
                  <Text style={styles.statLabel}>KM</Text>
                </View>
              )}
              {user.distance !== undefined && (
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {user.distance >= 1000 
                      ? `${(user.distance / 1000).toFixed(1)}` 
                      : Math.round(user.distance)}
                  </Text>
                  <Text style={styles.statLabel}>
                    {user.distance >= 1000 ? 'KM Away' : 'M Away'}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Info (for pilots) */}
            {isPilot && user.vehicle_type && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle</Text>
                <Text style={styles.sectionText}>
                  {user.vehicle_type}
                  {user.plate_number && ` • ${user.plate_number}`}
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.sectionText}>
                {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: isPilot ? theme.colors.pilot : theme.colors.rider }
              ]}
              onPress={handleNotify}
              disabled={!onNotify || notifyLoading}
            >
              {notifyLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Notify</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  rating: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  mockBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  mockText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 16,
    color: '#0f172a',
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
