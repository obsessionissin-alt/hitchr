// src/screens/RoleSelectScreen.tsx
// Modern Indian Design - Bold visual cards for role selection

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

const API_URL = 'http://localhost:3000/api/v1';

interface RoleSelectScreenProps {
  onRoleSelected: (role: 'rider' | 'pilot') => void;
}

export default function RoleSelectScreen({ onRoleSelected }: RoleSelectScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'rider' | 'pilot' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select your role to continue');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_URL}/users/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      console.log('✅ Role updated:', selectedRole);
      onRoleSelected(selectedRole);
    } catch (error) {
      console.error('❌ Role update error:', error);
      Alert.alert('Error', 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.title}>How will you travel?</Text>
          <Text style={styles.subtitle}>
            Choose your journey style
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.roleCards}>
          {/* Rider Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.riderCard,
              selectedRole === 'rider' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('rider')}
            disabled={loading}
            activeOpacity={0.9}
          >
            {selectedRole === 'rider' && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedText}>✓</Text>
              </View>
            )}
            
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleEmoji}>🎒</Text>
            </View>
            
            <Text style={styles.roleTitle}>Rider</Text>
            <Text style={styles.roleTagline}>Catch a ride</Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>→</Text>
                <Text style={styles.featureText}>Get lifts from verified pilots</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>→</Text>
                <Text style={styles.featureText}>Earn tokens for every ride</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>→</Text>
                <Text style={styles.featureText}>Build your traveler profile</Text>
              </View>
            </View>

            <View style={styles.roleFooter}>
              <Text style={styles.roleFooterText}>Perfect for explorers</Text>
            </View>
          </TouchableOpacity>

          {/* Pilot Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.pilotCard,
              selectedRole === 'pilot' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('pilot')}
            disabled={loading}
            activeOpacity={0.9}
          >
            {selectedRole === 'pilot' && (
              <View style={[styles.selectedIndicator, styles.selectedIndicatorDark]}>
                <Text style={styles.selectedTextDark}>✓</Text>
              </View>
            )}
            
            <View style={[styles.roleIconContainer, styles.roleIconDark]}>
              <Text style={styles.roleEmoji}>🛺</Text>
            </View>
            
            <Text style={[styles.roleTitle, styles.roleTitleDark]}>Pilot</Text>
            <Text style={[styles.roleTagline, styles.roleTaglineDark]}>Give a ride</Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={[styles.featureBullet, styles.featureBulletDark]}>→</Text>
                <Text style={[styles.featureText, styles.featureTextDark]}>Share your commute</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureBullet, styles.featureBulletDark]}>→</Text>
                <Text style={[styles.featureText, styles.featureTextDark]}>Earn rewards & tokens</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureBullet, styles.featureBulletDark]}>→</Text>
                <Text style={[styles.featureText, styles.featureTextDark]}>Build your network</Text>
              </View>
            </View>

            <View style={[styles.roleFooter, styles.roleFooterDark]}>
              <Text style={[styles.roleFooterText, styles.roleFooterTextDark]}>
                For those with wheels
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Note for Pilots */}
        {selectedRole === 'pilot' && (
          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>📋</Text>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Verification required</Text>
              <Text style={styles.noteText}>
                Pilots complete a quick KYC to ensure safety for everyone
              </Text>
            </View>
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRole && styles.continueButtonDisabled,
            ]}
            onPress={handleRoleSelection}
            disabled={!selectedRole || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={styles.continueButtonText}>
                {selectedRole 
                  ? `Continue as ${selectedRole === 'rider' ? 'Rider' : 'Pilot'}`
                  : 'Select a role'
                }
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.switchNote}>
            You can switch roles anytime from settings
          </Text>
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.textOnPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  roleCards: {
    gap: theme.spacing.md,
  },
  roleCard: {
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  riderCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  pilotCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
    ...theme.shadows.glow,
  },
  roleCardSelected: {
    borderColor: theme.colors.secondary,
    borderWidth: 3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorDark: {
    backgroundColor: theme.colors.surfaceDark,
  },
  selectedText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  selectedTextDark: {
    color: theme.colors.primary,
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  roleIconDark: {
    backgroundColor: 'rgba(27, 27, 27, 0.2)',
  },
  roleEmoji: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  roleTitleDark: {
    color: theme.colors.textOnPrimary,
  },
  roleTagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  roleTaglineDark: {
    color: 'rgba(27, 27, 27, 0.7)',
  },
  featureList: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  featureBulletDark: {
    color: theme.colors.textOnPrimary,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  featureTextDark: {
    color: 'rgba(27, 27, 27, 0.8)',
  },
  roleFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  roleFooterDark: {
    borderTopColor: 'rgba(27, 27, 27, 0.2)',
  },
  roleFooterText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleFooterTextDark: {
    color: 'rgba(27, 27, 27, 0.6)',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.info}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  noteIcon: {
    fontSize: 24,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.info,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
  continueButton: {
    height: 56,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.magenta,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  switchNote: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
