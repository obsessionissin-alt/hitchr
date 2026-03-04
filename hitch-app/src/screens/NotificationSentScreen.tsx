// src/screens/NotificationSentScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
type ScreenRouteProp = RouteProp<RootStackParamList, 'NotificationSent'>;

export default function NotificationSentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { rideId, pilot } = route.params;

  const { on, off } = useSocket();
  const { cancelRide } = useRide();

  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [estimatedTime, setEstimatedTime] = useState('2 mins');

  useEffect(() => {
    // Listen for proximity match
    const handleProximityMatch = (data: any) => {
      if (data.rideId === rideId) {
        navigation.replace('ProximityConfirm', { rideId });
      }
    };

    // Listen for cancellation
    const handleCancelled = (data: any) => {
      if (data.rideId === rideId) {
        Alert.alert('Ride Cancelled', 'The pilot cancelled the ride', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]);
      }
    };

    on('ride:proximity-match', handleProximityMatch);
    on('ride:cancelled', handleCancelled);

    // DEMO MODE: Auto-progress to Approaching state after 2 seconds
    let demoTimer: NodeJS.Timeout | undefined;
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE: Auto-progressing to Approaching state');
      demoTimer = setTimeout(() => {
        navigation.replace('ProximityConfirm', { rideId });
      }, 2000);
    }

    return () => {
      off('ride:proximity-match', handleProximityMatch);
      off('ride:cancelled', handleCancelled);
      if (demoTimer) {
        clearTimeout(demoTimer);
      }
    };
  }, [rideId, on, off, navigation]);

  // Countdown timer (disabled in DEMO MODE)
  useEffect(() => {
    if (DEMO_MODE) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert('Timeout', 'No response from pilot', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main'),
            },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation]);

  const handleCancel = async () => {
    Alert.alert('Cancel Notification', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRide(rideId);
            navigation.navigate('Main');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <Text style={styles.title}>Notification Sent!</Text>
        <Text style={styles.subtitle}>{pilot.name} has been alerted you're ahead</Text>

        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Voice Alert Sent:</Text>
          <Text style={styles.alertText}>"Rider ahead on your route"</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <View style={styles.stepsList}>
            <Text style={styles.step}>✓ {pilot.name} continues on current route</Text>
            <Text style={styles.step}>✓ Within 10-20m, both confirm</Text>
            <Text style={styles.step}>✓ Ride starts instantly!</Text>
          </View>
        </View>

        <View style={styles.timerCard}>
          <View style={styles.timerContent}>
            <View>
              <Text style={styles.timerLabel}>Time Remaining</Text>
              <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
            </View>
            <Text style={styles.timerIcon}>⏱️</Text>
          </View>
        </View>

        <View style={styles.estimateCard}>
          <View style={styles.estimateContent}>
            <View>
              <Text style={styles.estimateLabel}>Estimated Time</Text>
              <Text style={styles.estimateValue}>{estimatedTime}</Text>
            </View>
            <Text style={styles.estimateIcon}>📍</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel Notification</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  alertCard: {
    backgroundColor: theme.colors.secondary,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    ...theme.shadows.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  stepsList: {
    gap: 10,
  },
  step: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  timerCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    ...theme.shadows.sm,
  },
  timerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  timerIcon: {
    fontSize: 48,
  },
  estimateCard: {
    backgroundColor: '#fef3c7',
    padding: 18,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  estimateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  estimateIcon: {
    fontSize: 48,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});

