import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';

export default function RideRequestScreen({ route, navigation }: any) {
  const { pilot } = route.params;
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Simulate proximity match after 5 seconds
    const timer = setTimeout(() => {
      navigation.replace('RideActive', { pilot });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.icon}>🔔</Text>
        </Animated.View>
        
        <Text style={styles.title}>Notification Sent!</Text>
        <Text style={styles.subtitle}>{pilot.name} has been alerted you're ahead</Text>
        
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Voice Alert Sent:</Text>
          <Text style={styles.alertText}>"Rider ahead on your route"</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>✓ {pilot.name} continues driving on current route</Text>
          <Text style={styles.infoText}>✓ When within 10-20m, you'll both get a confirmation alert</Text>
          <Text style={styles.infoText}>✓ Both tap "Confirm" and ride starts instantly!</Text>
        </View>
        
        <View style={styles.timeCard}>
          <View>
            <Text style={styles.timeLabel}>Estimated Time</Text>
            <Text style={styles.timeValue}>2 mins</Text>
          </View>
          <Text style={styles.timeIcon}>⏱️</Text>
        </View>
        
        <View style={styles.mapPlaceholder}>
          <View style={styles.pilotPin}>
            <Text style={styles.pinText}>P</Text>
          </View>
          <View style={styles.userPin} />
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel Notification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
  alertBox: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 8,
  },
  timeCard: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
  },
  timeIcon: {
    fontSize: 48,
  },
  mapPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    position: 'relative',
    marginBottom: 20,
  },
  pilotPin: {
    position: 'absolute',
    top: '35%',
    left: '40%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#3B82F6',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});

