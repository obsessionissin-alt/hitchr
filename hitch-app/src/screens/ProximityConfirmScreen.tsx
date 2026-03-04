// src/screens/ProximityConfirmScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Contexts
import { useSocket } from '../contexts/SocketContext';
import { useRide } from '../contexts/RideContext';
import { DEMO_MODE } from '../constants/config';

// Types
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ProximityConfirm'>;

export default function ProximityConfirmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { rideId } = route.params;

  const { on, off } = useSocket();
  const { confirmRide, getRide, cancelRide } = useRide();

  const [ride, setRide] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [otherUserConfirmed, setOtherUserConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const loadRide = async () => {
      try {
        const rideData = await getRide(rideId);
        setRide(rideData);
      } catch (error) {
        console.error('Error loading ride:', error);
        Alert.alert('Error', 'Failed to load ride details', [
          { text: 'OK', onPress: () => navigation.navigate('Main') },
        ]);
      }
    };

    loadRide();
  }, [rideId]);

  useEffect(() => {
    // Listen for both confirmed event
    const handleBothConfirmed = (data: any) => {
      if (data.rideId === rideId) {
        Alert.alert('Success!', 'Both riders confirmed!', [
          {
            text: 'Start Ride',
            onPress: () => navigation.replace('RideLive', { rideId }),
          },
        ]);
      }
    };

    // Listen for cancellation
    const handleCancelled = (data: any) => {
      if (data.rideId === rideId) {
        Alert.alert('Ride Cancelled', 'The other user cancelled the ride', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]);
      }
    };

    on('ride:both-confirmed', handleBothConfirmed);
    on('ride:cancelled', handleCancelled);

    return () => {
      off('ride:both-confirmed', handleBothConfirmed);
      off('ride:cancelled', handleCancelled);
    };
  }, [rideId, on, off, navigation]);

  const handleAutoCancel = useCallback(async () => {
    try {
      await cancelRide(rideId);
      Alert.alert('Timeout', 'Confirmation time expired', [
        { text: 'OK', onPress: () => navigation.navigate('Main') },
      ]);
    } catch (error) {
      console.error('Auto cancel error:', error);
      navigation.navigate('Main');
    }
  }, [rideId, cancelRide, navigation]);

  // DEMO MODE: Auto-confirm after 2 seconds and auto-start ride
  useEffect(() => {
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE: Auto-confirming ride');
      const autoConfirmTimer = setTimeout(async () => {
        try {
          const result = await confirmRide(rideId);
          setUserConfirmed(true);
          
          // In DEMO MODE, auto-start ride immediately (simulate both confirmed)
          setTimeout(() => {
            console.log('🎭 DEMO MODE: Auto-starting ride');
            navigation.replace('RideLive', { rideId });
          }, 1000);
        } catch (error) {
          console.error('Demo auto-confirm error:', error);
        }
      }, 2000);
      
      return () => clearTimeout(autoConfirmTimer);
    }
  }, [DEMO_MODE, rideId, confirmRide, navigation]);

  // Countdown timer (disabled in DEMO MODE)
  useEffect(() => {
    if (DEMO_MODE) {
      setCountdown(30); // Keep countdown visible but don't auto-cancel
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleAutoCancel]);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      const result = await confirmRide(rideId);

      setUserConfirmed(true);

      if (result.confirmed && !result.waitingForOther) {
        // Both confirmed
        Alert.alert('Success!', 'Ride confirmed!', [
          {
            text: 'Start Ride',
            onPress: () => navigation.replace('RideLive', { rideId }),
          },
        ]);
      } else {
        setOtherUserConfirmed(false);
        Alert.alert('Confirmed', 'Waiting for the other person to confirm');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm ride');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert('Decline Ride', 'Are you sure you want to decline?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRide(rideId);
            navigation.navigate('Main');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to decline');
          }
        },
      },
    ]);
  };

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const otherUser = ride.pilot || ride.rider; // Depends on current user's role

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>Pilot Nearby!</Text>
        <Text style={styles.subtitle}>{otherUser?.name} is {distance || 15} meters away</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, styles.activeDot]} />
            <Text style={styles.statusText}>Within confirmation range</Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{otherUser?.name?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{otherUser?.name || 'Unknown'}</Text>
              <Text style={styles.userMeta}>
                {ride.pilot?.pilot_vehicle_type || 'Vehicle'} • ⭐ {otherUser?.rating || '5.0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.requirementCard}>
          <Text style={styles.requirementText}>Both riders must confirm to start</Text>
        </View>

        <View style={styles.tripCard}>
          <Text style={styles.tripTitle}>Trip Preview</Text>
          <View style={styles.tripRow}>
            <Text style={styles.tripLabel}>Your destination</Text>
            <Text style={styles.tripValue}>Destination</Text>
          </View>
          <View style={styles.tripRow}>
            <Text style={styles.tripLabel}>Estimated tokens</Text>
            <Text style={[styles.tripValue, styles.tokenValue]}>+10 🪙</Text>
          </View>
        </View>

        <View style={styles.countdownContainer}>
          <View style={styles.countdownCircle}>
            <Text style={[styles.countdownText, countdown < 10 && styles.countdownDanger]}>
              {countdown}
            </Text>
          </View>
          <Text style={styles.countdownLabel}>seconds remaining</Text>
        </View>

        {userConfirmed ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.waitingText}>Waiting for {otherUser?.name} to confirm...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>✓ Confirm Ride</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              disabled={isConfirming}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.success,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    ...theme.shadows.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  requirementCard: {
    backgroundColor: theme.colors.secondary,
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  tripLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tripValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  tokenValue: {
    color: theme.colors.primary,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.success,
  },
  countdownDanger: {
    color: theme.colors.danger,
  },
  countdownLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});









