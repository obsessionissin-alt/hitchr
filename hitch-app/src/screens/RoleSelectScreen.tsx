import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // Update user role in backend
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
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use HITCH
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.roleCards}>
          {/* Rider Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'rider' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('rider')}
            disabled={loading}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.roleIconText}>🙋‍♂️</Text>
            </View>
            <Text style={styles.roleTitle}>Rider</Text>
            <Text style={styles.roleDescription}>
              Get rides from verified pilots on your route
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.roleFeature}>✓ Free rides</Text>
              <Text style={styles.roleFeature}>✓ Earn tokens</Text>
              <Text style={styles.roleFeature}>✓ Collect plates</Text>
              <Text style={styles.roleFeature}>✓ Build reputation</Text>
            </View>
            {selectedRole === 'rider' && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓ Selected</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Pilot Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'pilot' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('pilot')}
            disabled={loading}
          >
            <View style={[styles.roleIcon, styles.roleIconPilot]}>
              <Text style={styles.roleIconText}>👨‍✈️</Text>
            </View>
            <Text style={styles.roleTitle}>Pilot</Text>
            <Text style={styles.roleDescription}>
              Offer rides to people on your route
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.roleFeature}>✓ Help community</Text>
              <Text style={styles.roleFeature}>✓ Earn rewards</Text>
              <Text style={styles.roleFeature}>✓ Build network</Text>
              <Text style={styles.roleFeature}>✓ Get verified</Text>
            </View>
            {selectedRole === 'pilot' && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓ Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Note */}
        {selectedRole === 'pilot' && (
          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text style={styles.noteText}>
              Pilot verification required. You'll complete KYC after this step.
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !selectedRole && styles.continueButtonDisabled]}
          onPress={handleRoleSelection}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue as {selectedRole === 'rider' ? 'Rider' : selectedRole === 'pilot' ? 'Pilot' : '...'}
            </Text>
          )}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  roleCards: {
    gap: 20,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIconPilot: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  roleIconText: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleFeatures: {
    gap: 6,
  },
  roleFeature: {
    fontSize: 13,
    color: '#0F172A',
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

