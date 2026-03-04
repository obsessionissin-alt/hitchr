// src/screens/SimpleProfileScreen.tsx
// Modern Indian Design - Bold, social profile screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSimpleAuth } from '../store/SimpleAuthContext';
import { theme } from '../constants/theme';

export default function SimpleProfileScreen() {
  const { user, logout } = useSimpleAuth();

  const isPilot = user?.role === 'pilot';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, isPilot && styles.avatarPilot]}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || user?.phone?.charAt(4) || '?'}
                </Text>
              </View>
              {user?.role && (
                <View style={[styles.roleBadge, isPilot ? styles.roleBadgePilot : styles.roleBadgeRider]}>
                  <Text style={styles.roleEmoji}>{isPilot ? '🛺' : '🎒'}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.name}>{user?.name || 'Traveler'}</Text>
            <Text style={styles.phone}>{user?.phone || '+91 xxxxxx'}</Text>
            
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USER'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🪙</Text>
            </View>
            <Text style={styles.statValue}>{user?.token_balance || 0}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <View style={[styles.statIconContainer, styles.statIconHighlight]}>
              <Text style={styles.statIcon}>🛣️</Text>
            </View>
            <Text style={[styles.statValue, styles.statValueHighlight]}>{user?.total_rides || 0}</Text>
            <Text style={[styles.statLabel, styles.statLabelHighlight]}>Rides</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>⭐</Text>
            </View>
            <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🎫</Text>
            </View>
            <Text style={styles.quickActionText}>Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🏆</Text>
            </View>
            <Text style={styles.quickActionText}>Badges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📊</Text>
            </View>
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🔔</Text>
            </View>
            <Text style={styles.quickActionText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>📱</Text>
                <View>
                  <Text style={styles.menuItemLabel}>Phone</Text>
                  <Text style={styles.menuItemValue}>{user?.phone}</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🎭</Text>
                <View>
                  <Text style={styles.menuItemLabel}>Role</Text>
                  <Text style={styles.menuItemValue}>{user?.role || 'Not set'}</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>✨</Text>
                <View>
                  <Text style={styles.menuItemLabel}>Edit Profile</Text>
                  <Text style={styles.menuItemValue}>Update your info</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>❓</Text>
                <View>
                  <Text style={styles.menuItemLabel}>Help Center</Text>
                  <Text style={styles.menuItemValue}>FAQs & Support</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>📜</Text>
                <View>
                  <Text style={styles.menuItemLabel}>Legal</Text>
                  <Text style={styles.menuItemValue}>Terms & Privacy</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutIcon}>👋</Text>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>hitchr v2.0</Text>
          <Text style={styles.footerSubtext}>Find your ride, find your tribe</Text>
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
  
  // Header
  header: {
    backgroundColor: theme.colors.surface,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  
  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.rider,
    borderWidth: 3,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPilot: {
    backgroundColor: theme.colors.pilot,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  roleBadgePilot: {
    backgroundColor: theme.colors.primary,
  },
  roleBadgeRider: {
    backgroundColor: theme.colors.rider,
  },
  roleEmoji: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleTag: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statCardHighlight: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
    ...theme.shadows.glow,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconHighlight: {
    backgroundColor: 'rgba(27, 27, 27, 0.2)',
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  statValueHighlight: {
    color: theme.colors.textOnPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  statLabelHighlight: {
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  
  // Sections
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  
  // Menu
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  menuItemValue: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  menuItemArrow: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: 56,
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceDark,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    gap: 10,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});
