import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export default function RideActiveScreen({ route, navigation }: any) {
  const { pilot } = route.params;

  useEffect(() => {
    // Simulate ride completion after 8 seconds
    const timer = setTimeout(() => {
      navigation.replace('RideComplete', { pilot });
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>In Progress</Text>
        </View>
        <View>
          <Text style={styles.eta}>8 min</Text>
          <Text style={styles.etaLabel}>ETA</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.map}>
          <View style={styles.routeLine} />
          <View style={styles.carIcon}>
            <Text style={styles.carEmoji}>🚗</Text>
          </View>
          <View style={styles.destinationPin} />
          <View style={styles.trackingBadge}>
            <Text style={styles.trackingDot}>●</Text>
            <Text style={styles.trackingText}>Tracking</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        
        <View style={styles.pilotInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{pilot.avatar}</Text>
          </View>
          <View style={styles.pilotDetails}>
            <Text style={styles.pilotName}>{pilot.name}</Text>
            <Text style={styles.pilotVehicle}>
              {pilot.vehicle.plate} • {pilot.vehicle.type}
            </Text>
            <Text style={styles.pilotDistance}>0.4 km away</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📍 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.sosButton]}>
            <Text style={[styles.actionButtonText, styles.sosText]}>SOS</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  eta: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  etaLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
  },
  mapContainer: {
    flex: 1,
    padding: 10,
  },
  map: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    borderRadius: 20,
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: 4,
    backgroundColor: '#3B82F6',
    transform: [{ rotate: '25deg' }],
  },
  carIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 50,
    height: 50,
    marginLeft: -25,
    marginTop: -25,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  carEmoji: {
    fontSize: 24,
  },
  destinationPin: {
    position: 'absolute',
    bottom: '30%',
    right: '25%',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  trackingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingDot: {
    fontSize: 12,
    color: '#10B981',
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pilotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pilotDetails: {
    flex: 1,
  },
  pilotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  pilotVehicle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  pilotDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  sosButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  sosText: {
    color: '#FFFFFF',
  },
});
