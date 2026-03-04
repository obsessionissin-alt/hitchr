import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRouteAPI, campusJoinRequestAPI } from '../../utils/campusApi';
import { formatDistance, formatDuration } from '../../utils/helpers';
import haptics from '../../utils/haptics';

export default function RouteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, shadows } = useTheme('light');
  const { user, userRole } = useCampusStore();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    try {
      const response = await campusRouteAPI.get(id as string);
      setRoute(response.data);
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      alert('Please enter pickup and dropoff locations');
      return;
    }

    if (!user) return;

    setRequesting(true);
    try {
      const pickupLat = route.from_point.lat + (Math.random() - 0.5) * 0.01;
      const pickupLng = route.from_point.lng + (Math.random() - 0.5) * 0.01;
      const dropoffLat = route.to_point.lat + (Math.random() - 0.5) * 0.01;
      const dropoffLng = route.to_point.lng + (Math.random() - 0.5) * 0.01;

      await campusJoinRequestAPI.create({
        route_id: id as string,
        rider_id: user.id,
        rider_name: user.name,
        rider_college: user.college,
        pickup: {
          lat: pickupLat,
          lng: pickupLng,
          address: pickupLocation,
          name: pickupLocation,
        },
        dropoff: {
          lat: dropoffLat,
          lng: dropoffLng,
          address: dropoffLocation,
          name: dropoffLocation,
        },
      });

      haptics.success();
      alert('Request sent! 🙌 The pilot will let you know shortly.');
      setJoinModalVisible(false);
      router.back();
    } catch (error: any) {
      haptics.error();
      console.error('Error sending request:', error);
      alert(error.response?.data?.detail || 'Couldn\'t send request. Try again?');
    } finally {
      setRequesting(false);
    }
  };

  const timeRemaining = () => {
    if (!route) return '';
    const now = new Date();
    const departure = new Date(route.departure_time);
    const diff = Math.floor((departure.getTime() - now.getTime()) / 60000);
    if (diff < 0) return 'Now';
    if (diff < 60) return `Leaving in ${diff} minutes`;
    return `Leaving in ${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.text,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      ...shadows.md,
    },
    pilotSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pilotInfo: {
      flex: 1,
    },
    pilotName: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.text,
      marginBottom: 4,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeText: {
      fontSize: Typography.sm,
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
    sectionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.md,
    },
    routeVisual: {
      marginBottom: Spacing.lg,
    },
    routeStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    routePoint: {
      width: 50,
      alignItems: 'center',
    },
    pointDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    originDot: {
      backgroundColor: colors.primary,
    },
    destDot: {
      backgroundColor: colors.trust,
    },
    routeArrow: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.sm,
      borderRadius: 2,
    },
    routeDetails: {
      gap: Spacing.md,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    routeIcon: {
      marginTop: 2,
    },
    routeTextContainer: {
      flex: 1,
    },
    routeLabel: {
      fontSize: Typography.xs,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    routeText: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: colors.text,
    },
    routeAddress: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    infoGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    infoPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.md,
      backgroundColor: colors.divider,
      borderRadius: BorderRadius.md,
    },
    infoText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textSecondary,
    },
    noteText: {
      fontSize: Typography.md,
      color: colors.textSecondary,
      lineHeight: Typography.lineHeights.normal * Typography.md,
    },
    footer: {
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    joinButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
      ...shadows.md,
    },
    joinButtonDisabled: {
      backgroundColor: colors.divider,
    },
    joinButtonText: {
      color: colors.surface,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
    },
    joinButtonTextDisabled: {
      color: colors.textTertiary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    modalTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: colors.text,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputLabel: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: colors.text,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    input: {
      backgroundColor: colors.divider,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: Typography.md,
      color: colors.text,
    },
    infoBox: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: colors.trust + '10',
      borderRadius: BorderRadius.md,
      marginTop: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    infoBoxText: {
      flex: 1,
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: Typography.lineHeights.normal * Typography.sm,
    },
    modalButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
      ...shadows.md,
    },
    modalButtonText: {
      color: colors.surface,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Route not found</Text>
      </View>
    );
  }

  const isFull = route.seats_available <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.pilotSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.pilotInfo}>
              <Text style={styles.pilotName}>{route.pilot_name}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.trust} />
                <Text style={styles.badgeText}>{route.pilot_college}</Text>
              </View>
            </View>
            <View style={styles.timePill}>
              <View style={styles.liveDot} />
              <Text style={styles.timeText}>Live</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{timeRemaining()}</Text>

          <View style={styles.routeVisual}>
            <View style={styles.routeStrip}>
              <View style={styles.routePoint}>
                <View style={[styles.pointDot, styles.originDot]} />
              </View>
              <View style={styles.routeArrow} />
              <View style={styles.routePoint}>
                <View style={[styles.pointDot, styles.destDot]} />
              </View>
            </View>

            <View style={styles.routeDetails}>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={20} color={colors.primary} style={styles.routeIcon} />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>FROM</Text>
                  <Text style={styles.routeText}>{route.from_point.name}</Text>
                  <Text style={styles.routeAddress}>{route.from_point.address}</Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <Ionicons name="flag" size={20} color={colors.trust} style={styles.routeIcon} />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>TO</Text>
                  <Text style={styles.routeText}>{route.to_point.name}</Text>
                  <Text style={styles.routeAddress}>{route.to_point.address}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoPill}>
              <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDistance(route.distance_km)}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDuration(route.duration_mins)}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{route.seats_available} seats</Text>
            </View>
          </View>

          {route.note && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Note from Pilot</Text>
              <Text style={styles.noteText}>{route.note}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {userRole === 'rider' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
            onPress={() => setJoinModalVisible(true)}
            disabled={isFull}
            activeOpacity={0.8}
          >
            <Text style={[styles.joinButtonText, isFull && styles.joinButtonTextDisabled]}>
              {isFull ? 'Ride Full' : 'Request to Join'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setJoinModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Join Request</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setJoinModalVisible(false)}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Pickup Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Where should the pilot pick you up?"
                placeholderTextColor={colors.textTertiary}
                value={pickupLocation}
                onChangeText={setPickupLocation}
              />

              <Text style={styles.inputLabel}>Dropoff Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Where do you want to go?"
                placeholderTextColor={colors.textTertiary}
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.trust} />
                <Text style={styles.infoBoxText}>
                  No payment required now. You'll pay after the ride based on shared distance.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleJoinRequest}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.modalButtonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
