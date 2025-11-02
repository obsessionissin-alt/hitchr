// src/screens/MapScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';

interface Pilot {
  id: string;
  name: string;
  phone: string;
  rating: number;
  total_rides: number;
  token_balance: number;
  distance?: number;
}

export default function MapScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<string | null>(null);

  const userLocation = { lat: 30.395359, lng: 77.966561 }; // Aligarh

  const fetchNearbyPilots = async () => {
    try {
      const response = await api.get('/nearby/pilots', {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 5000, // 5km
        },
      });
      setPilots(response.data || []);
    } catch (error) {
      console.error('Error fetching pilots:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNearbyPilots();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyPilots();
  };

  const handleRequestRide = async (pilotId: string) => {
    try {
      setLoading(true);
      const response = await api.post('/rides/notify', { pilotId });
      
      if (response.data.success) {
        // Navigate to pending screen
        navigation.navigate('RidePending', {
          rideId: response.data.ride.id,
          pilotId,
          pilotName: pilots.find(p => p.id === pilotId)?.name,
        });
      }
    } catch (error: any) {
      console.error('Error requesting ride:', error);
      alert(error.response?.data?.error || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (pilot: Pilot) => {
    navigation.navigate('PilotProfile', { pilot });
  };

  if (loading && pilots.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Finding nearby pilots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Ionicons name="wallet" size={20} color="#F59E0B" />
          <Text style={styles.tokenText}>{user?.token_balance || 0}</Text>
        </View>
      </View>

      {/* Location Info */}
      <View style={styles.locationCard}>
        <Ionicons name="location" size={20} color="#3B82F6" />
        <View style={styles.locationText}>
          <Text style={styles.locationTitle}>Your Location</Text>
          <Text style={styles.locationCoords}>
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Pilots List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.pilotsHeader}>
          <Text style={styles.pilotsTitle}>
            {pilots.length} Pilot{pilots.length !== 1 ? 's' : ''} Nearby
          </Text>
          <Text style={styles.pilotsSubtitle}>Within 5 km</Text>
        </View>

        {pilots.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No pilots nearby</Text>
            <Text style={styles.emptySubtext}>Try refreshing or check back later</Text>
          </View>
        ) : (
          pilots.map((pilot) => (
            <View key={pilot.id} style={styles.pilotCard}>
              <View style={styles.pilotHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {pilot.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.pilotInfo}>
                  <Text style={styles.pilotName}>{pilot.name}</Text>
                  <View style={styles.pilotMeta}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.pilotRating}>{pilot.rating?.toFixed(1) || '4.8'}</Text>
                    <Text style={styles.pilotSeparator}>•</Text>
                    <Text style={styles.pilotRides}>{pilot.total_rides || 0} rides</Text>
                    {pilot.distance && (
                      <>
                        <Text style={styles.pilotSeparator}>•</Text>
                        <Text style={styles.pilotDistance}>{pilot.distance.toFixed(1)} km</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.pilotActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewProfileButton]}
                  onPress={() => handleViewProfile(pilot)}
                >
                  <Ionicons name="person-outline" size={18} color="#3B82F6" />
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.requestButton,
                    selectedPilot === pilot.id && styles.requestButtonSelected,
                  ]}
                  onPress={() => {
                    if (selectedPilot === pilot.id) {
                      handleRequestRide(pilot.id);
                    } else {
                      setSelectedPilot(pilot.id);
                    }
                  }}
                >
                  <Ionicons 
                    name={selectedPilot === pilot.id ? "checkmark-circle" : "car"} 
                    size={18} 
                    color="white" 
                  />
                  <Text style={styles.requestButtonText}>
                    {selectedPilot === pilot.id ? 'Confirm Request' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  pilotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pilotsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  pilotsSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  pilotCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pilotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pilotInfo: {
    flex: 1,
  },
  pilotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pilotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pilotRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FBBF24',
  },
  pilotSeparator: {
    fontSize: 13,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  pilotRides: {
    fontSize: 13,
    color: '#64748B',
  },
  pilotDistance: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  pilotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewProfileButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  requestButton: {
    backgroundColor: '#F59E0B',
  },
  requestButtonSelected: {
    backgroundColor: '#10B981',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});