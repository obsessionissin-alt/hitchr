import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import RoleToggle from '../../components/RoleToggle';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useCampusStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={Colors.text} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.campusBadge}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.campusText}>{user?.college}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <RoleToggle />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesContainer}>
          {user?.badges?.map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Ride History</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Help & Safety</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  campusText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.error,
    ...Shadows.small,
  },
  logoutText: {
    color: Colors.error,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
