import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSimpleAuth } from '../store/SimpleAuthContext';
import { mockCurrentUser, mockAchievements, mockPlates, mockRideHistory } from '../data/mockData';

const API_URL = 'http://localhost:3000/api/v1';

export default function EnhancedProfileScreen() {
  const { logout, user: authUser } = useSimpleAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      console.log('📊 Fetching user profile...');
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User profile loaded:', data);
        setUserData(data);
      } else {
        console.log('⚠️ Failed to fetch profile, using mock data');
        setUserData(mockCurrentUser);
      }
    } catch (error) {
      console.log('❌ Error fetching profile, using mock data:', error);
      setUserData(mockCurrentUser);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  const user = userData || mockCurrentUser;

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{user.avatar}</Text>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{user.name || authUser?.name || 'User'}</Text>
        <Text style={styles.subtitle}>
          {user.role === 'rider' ? 'Rider' : 'Pilot'} • Member since {user.memberSince || 'Recently'}
        </Text>
        
        <View style={styles.badgesRow}>
          {(user.badges || []).map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.totalRides || 0}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(user.rating || 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.totalKm || 0}</Text>
          <Text style={styles.statLabel}>KM Traveled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.tokens || authUser?.token_balance || 0}</Text>
          <Text style={styles.statLabel}>Tokens</Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements & Badges</Text>
        
        {mockAchievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementIconText}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
              {achievement.unlocked ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.progress}>{achievement.progress}/{achievement.total}</Text>
              )}
            </View>
            {!achievement.unlocked && (
              <View style={styles.progressBarContainer}>
                <View 
                  style={[styles.progressBar, { width: `${(achievement.progress / achievement.total) * 100}%` }]}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Collected Plates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collected Plates</Text>
        <View style={styles.platesGrid}>
          {mockPlates.map((plate, index) => (
            <View 
              key={index} 
              style={[
                styles.plateCard,
                !plate.unlocked && styles.plateCardLocked
              ]}
            >
              {plate.unlocked ? (
                <>
                  <Text style={styles.plateCode}>{plate.code}</Text>
                  <Text style={styles.plateCity}>{plate.city}</Text>
                </>
              ) : (
                <Text style={styles.plateLocked}>?</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {mockRideHistory.map((ride) => (
          <View key={ride.id} style={styles.activityCard}>
            <View>
              <Text style={styles.activityTitle}>Ride to {ride.destination}</Text>
              <Text style={styles.activityDate}>{ride.date}</Text>
            </View>
            <Text style={styles.activityTokens}>+{ride.tokens}</Text>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
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
  banner: {
    backgroundColor: '#F59E0B',
    height: 120,
    position: 'relative',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -50,
    left: '50%',
    marginLeft: -50,
    borderWidth: 5,
    borderColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarLargeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  progressBarContainer: {
    marginTop: 12,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  platesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plateCard: {
    width: '30%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  plateCardLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  plateCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  plateCity: {
    fontSize: 10,
    color: '#64748B',
  },
  plateLocked: {
    fontSize: 24,
    color: '#94A3B8',
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#64748B',
  },
  activityTokens: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

