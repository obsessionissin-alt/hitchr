// src/screens/RidePendingScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const DEMO_AUTO_ACCEPT_DELAY = 3000; // 3 seconds in demo mode

export default function RidePendingScreen({ route, navigation }: any) {
  const { rideId, pilotId, pilotName } = route.params;
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    // Demo mode: Auto-accept after 3 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          autoAcceptRide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const autoAcceptRide = async () => {
    try {
      setStatus('accepted');
      // In demo mode, we automatically move to active ride
      setTimeout(() => {
        navigation.replace('RideActive', {
          rideId,
          pilotId,
          pilotName,
        });
      }, 1500);
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleCancel = async () => {
    try {
      // In real implementation, would cancel the ride via API
      navigation.goBack();
    } catch (error) {
      console.error('Error canceling ride:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Request</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Icon */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {status === 'waiting' ? (
            <View style={styles.pulseContainer}>
              <View style={[styles.pulse, styles.pulseOuter]} />
              <View style={[styles.pulse, styles.pulseMiddle]} />
              <View style={styles.bellIcon}>
                <Ionicons name="notifications" size={48} color="#3B82F6" />
              </View>
            </View>
          ) : (
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
          )}
        </View>

        {/* Message */}
        {status === 'waiting' ? (
          <>
            <Text style={styles.title}>Notification Sent!</Text>
            <Text style={styles.subtitle}>
              {pilotName || 'The pilot'} has been notified
            </Text>
            <Text style={styles.description}>
              In demo mode, ride will auto-accept in:
            </Text>
            <Text style={styles.countdown}>{countdown}s</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Ride Accepted!</Text>
            <Text style={styles.subtitle}>Starting your ride...</Text>
          </>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#64748B" />
            <Text style={styles.infoLabel}>Pilot</Text>
            <Text style={styles.infoValue}>{pilotName || 'Unknown'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#64748B" />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, styles.statusText]}>
              {status === 'waiting' ? 'Pending' : 'Accepted'}
            </Text>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <Text style={styles.stepText}>Pilot receives notification</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="car" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.stepText}>Pilot continues on route</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="location" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.stepText}>Both confirm when nearby (10-20m)</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="play" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.stepText}>Ride starts immediately!</Text>
          </View>
        </View>

        {/* Cancel Button */}
        {status === 'waiting' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  pulseContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  pulseOuter: {
    width: 140,
    height: 140,
    opacity: 0.3,
  },
  pulseMiddle: {
    width: 120,
    height: 120,
    opacity: 0.5,
  },
  bellIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 32,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusText: {
    color: '#F59E0B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  nextStepsCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});