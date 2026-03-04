// src/screens/ProfileModalScreen.tsx
// Modal screen for detailed user profile view
// Accepts normalized UserMarker from navigation params

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useUser } from '../contexts/UserContext';
import { useNotifySockets } from '../hooks/useNotifySockets';

// Types
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';
import type { UserMarker } from '../types/userMarker';

type ProfileModalRouteProp = RouteProp<RootStackParamList, 'ProfileModal'>;

export default function ProfileModalScreen() {
  const route = useRoute<ProfileModalRouteProp>();
  const { person, type } = route.params;

  const { profile } = useUser();
  const { sendNotify, statusUpdate } = useNotifySockets();
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isPilot = person.role === 'pilot' || type === 'pilot';

  const handleNotify = async () => {
    try {
      setStatusMessage(null);
      setIsSending(true);
      await sendNotify({
        fromUserId: profile?.id,
        toUserId: person.id,
        marker: person,
      });
      const message = 'Notification sent';
      setStatusMessage(message);
      Alert.alert(message, `${person.name} will see this instantly.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (statusUpdate && profile?.id && statusUpdate.toUserId === profile.id) {
      const message =
        statusUpdate.status === 'declined'
          ? 'Request Declined'
          : 'Request Accepted';
      setStatusMessage(message);
      Alert.alert('Update', message);
    }
  }, [statusUpdate, profile?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mini Map Placeholder */}
        <View style={styles.miniMap}>
          <View
            style={[
              styles.miniMarker,
              isPilot ? styles.pilotMarker : styles.riderMarker,
            ]}
          >
            <Text style={styles.markerText}>{isPilot ? 'P' : 'R'}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.handleBar} />

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {person.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{person.name || 'Unknown'}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    isPilot ? styles.pilotBadge : styles.riderBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>{isPilot ? 'PILOT' : 'RIDER'}</Text>
                </View>
                {person.is_mock && (
                  <View style={styles.mockBadge}>
                    <Text style={styles.mockBadgeText}>MOCK</Text>
                  </View>
                )}
              </View>

              {isPilot && person.vehicle_type && (
                <Text style={styles.vehicleInfo}>
                  {person.vehicle_type} • {person.plate_number || 'No plate'}
                </Text>
              )}

              <View style={styles.metaRow}>
                <Text style={styles.rating}>⭐ {person.rating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.divider}>|</Text>
                <Text style={styles.verified}>✓ Verified</Text>
              </View>
            </View>
          </View>

          {/* Distance Badge */}
          {person.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <View style={styles.distanceDot} />
              <Text style={styles.distanceText}>
                {person.distance >= 1000 
                  ? `${(person.distance / 1000).toFixed(1)} km away`
                  : `${Math.round(person.distance)} m away`
                } • ~{Math.ceil((person.distance || 0) / 500)} mins
              </Text>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {person.total_rides || 0}
              </Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{person.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            {isPilot && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.round(person.total_km || 0)}
                </Text>
                <Text style={styles.statLabel}>KM</Text>
              </View>
            )}

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {person.distance !== undefined 
                  ? (person.distance / 1000).toFixed(1) 
                  : '?'
                }
              </Text>
              <Text style={styles.statLabel}>KM Away</Text>
            </View>
          </View>

          {/* Location Info */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>
              {person.latitude.toFixed(4)}, {person.longitude.toFixed(4)}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNotify}
            disabled={isSending}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isSending ? 'Sending...' : `Notify ${person.name}`}
            </Text>
          </TouchableOpacity>
          {statusMessage && <Text style={styles.statusMessage}>{statusMessage}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  miniMap: {
    height: 180,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  pilotMarker: {
    backgroundColor: theme.colors.pilot,
  },
  riderMarker: {
    backgroundColor: theme.colors.rider,
  },
  markerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
    ...theme.shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pilotBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  riderBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.pilot,
  },
  mockBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
  },
  vehicleInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  divider: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  verified: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  distanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.pilot,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  locationSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    ...theme.shadows.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    ...theme.shadows.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusMessage: {
    marginTop: 10,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
