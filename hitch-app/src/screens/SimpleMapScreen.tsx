// Simplified MapScreen for web
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSimpleAuth } from '../store/SimpleAuthContext';

const API_URL = 'http://localhost:3000/api/v1';

interface Pilot {
  id: string;
  name: string;
  phone: string;
  rating: number;
  total_rides: number;
  latitude: number;
  longitude: number;
  distance: number;
}

export default function SimpleMapScreen() {
  const { user } = useSimpleAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<string | null>(null);

  useEffect(() => {
    fetchPilots();
  }, []);

  const fetchPilots = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      // Default location (Bangalore)
      const lat = 12.9716;
      const lng = 77.5946;
      
      const response = await fetch(
        `${API_URL}/pilots/nearby?lat=${lat}&lng=${lng}&radius=10000`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPilots(data.pilots || []);
      } else {
        console.error('Failed to fetch pilots');
      }
    } catch (error) {
      console.error('Error fetching pilots:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPilots();
  };

  const handleSelectPilot = (pilotId: string) => {
    if (selectedPilot === pilotId) {
      Alert.alert(
        'Request Ride',
        'Would you like to request a ride from this pilot?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request', onPress: () => console.log('Ride requested') },
        ]
      );
    } else {
      setSelectedPilot(pilotId);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading pilots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Available Pilots</Text>
        <Text style={styles.headerSubtitle}>
          Welcome, {user?.name || user?.phone}
        </Text>
      </View>

      {/* Pilots List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pilots.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No pilots nearby</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          pilots.map((pilot) => (
            <TouchableOpacity
              key={pilot.id}
              style={[
                styles.pilotCard,
                selectedPilot === pilot.id && styles.pilotCardSelected,
              ]}
              onPress={() => handleSelectPilot(pilot.id)}
            >
              <View style={styles.pilotHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {pilot.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.pilotInfo}>
                  <Text style={styles.pilotName}>{pilot.name}</Text>
                  <View style={styles.pilotMeta}>
                    <Text style={styles.pilotRating}>
                      ⭐ {pilot.rating?.toFixed(1) || '4.8'}
                    </Text>
                    <Text style={styles.pilotSeparator}>•</Text>
                    <Text style={styles.pilotRides}>
                      {pilot.total_rides || 0} rides
                    </Text>
                    {pilot.distance && (
                      <>
                        <Text style={styles.pilotSeparator}>•</Text>
                        <Text style={styles.pilotDistance}>
                          {(pilot.distance / 1000).toFixed(1)} km
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  selectedPilot === pilot.id && styles.selectButtonActive,
                ]}
                onPress={() => handleSelectPilot(pilot.id)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedPilot === pilot.id ? '✓ Confirm' : 'Select'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  pilotCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pilotCardSelected: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  pilotHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pilotInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  pilotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  pilotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pilotRating: {
    fontSize: 14,
    color: '#64748B',
  },
  pilotSeparator: {
    fontSize: 14,
    color: '#CBD5E1',
    marginHorizontal: 8,
  },
  pilotRides: {
    fontSize: 14,
    color: '#64748B',
  },
  pilotDistance: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: '#10B981',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

