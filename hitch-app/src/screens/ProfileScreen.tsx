// src/screens/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

// Types
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { profile, updateAvailability } = useUser();
  const { signOut } = useAuth();

  const handlePilotToggle = async (value: boolean) => {
    try {
      await updateAvailability(value, profile?.isRiderAvailable || false);
    } catch (error) {
      console.error('Toggle pilot error:', error);
    }
  };

  const handleRiderToggle = async (value: boolean) => {
    try {
      await updateAvailability(profile?.isPilotAvailable || false, value);
    } catch (error) {
      console.error('Toggle rider error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Banner */}
        <View style={styles.banner}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{profile.name || 'Anonymous'}</Text>
          <Text style={styles.memberSince}>Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌟 Explorer</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎖️ Trusted</Text>
            </View>
          </View>
        </View>

        {/* Availability Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability Status</Text>
          
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Ionicons name="car" size={20} color={theme.colors.pilot} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Available as Pilot</Text>
                <Text style={styles.toggleSubtitle}>Offer rides to others</Text>
              </View>
            </View>
            <Switch
              value={profile.isPilotAvailable}
              onValueChange={handlePilotToggle}
              trackColor={{ false: '#e2e8f0', true: theme.colors.success }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Ionicons name="walk" size={20} color={theme.colors.rider} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Available as Rider</Text>
                <Text style={styles.toggleSubtitle}>Looking for rides</Text>
              </View>
            </View>
            <Switch
              value={profile.isRiderAvailable}
              onValueChange={handleRiderToggle}
              trackColor={{ false: '#e2e8f0', true: theme.colors.success }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats.totalRidesAsPilot + profile.stats.totalRidesAsRider}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(profile.stats.totalKm / 1000).toFixed(0)}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats.tokenBalance}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
        </View>

        {/* Role-specific Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Statistics</Text>
          
          <View style={styles.roleStats}>
            <View style={styles.roleStat}>
              <View style={styles.roleHeader}>
                <Ionicons name="car" size={16} color={theme.colors.pilot} />
                <Text style={styles.roleLabel}>As Pilot</Text>
              </View>
              <Text style={styles.roleValue}>{profile.stats.totalRidesAsPilot} rides</Text>
            </View>

            <View style={[styles.roleStat, styles.riderStat]}>
              <View style={styles.roleHeader}>
                <Ionicons name="walk" size={16} color={theme.colors.rider} />
                <Text style={styles.roleLabel}>As Rider</Text>
              </View>
              <Text style={styles.roleValue}>{profile.stats.totalRidesAsRider} rides</Text>
            </View>
          </View>
        </View>

        {/* Collected Plates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collected Plates</Text>
          <View style={styles.platesGrid}>
            <View style={styles.plateItem}>
              <Text style={styles.plateCode}>KA-01</Text>
            </View>
            <View style={styles.plateItem}>
              <Text style={styles.plateCode}>MH-12</Text>
            </View>
            <View style={[styles.plateItem, styles.emptyPlate]}>
              <Text style={styles.emptyPlateText}>?</Text>
            </View>
            <View style={[styles.plateItem, styles.emptyPlate]}>
              <Text style={styles.emptyPlateText}>?</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  banner: {
    height: 120,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  avatarContainer: {
    marginBottom: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: theme.colors.background,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  userInfo: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  memberSince: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.pilot,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
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
    textAlign: 'center',
  },
  roleStats: {
    flexDirection: 'row',
    gap: 12,
  },
  roleStat: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  riderStat: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  roleValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  platesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  plateItem: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlate: {
    backgroundColor: theme.colors.borderLight,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  plateCode: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  emptyPlateText: {
    fontSize: 24,
    color: theme.colors.textTertiary,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.danger,
  },
});
