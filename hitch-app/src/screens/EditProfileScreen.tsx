// src/screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Contexts
import { useUser } from '../contexts/UserContext';

// Types
import { theme } from '../constants/theme';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, updateProfile } = useUser();

  const [name, setName] = useState(profile?.name || '');
  const [vehicleType, setVehicleType] = useState(profile?.pilotVehicleType || '');
  const [plateNumber, setPlateNumber] = useState(profile?.pilotPlateNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile({
        name,
        pilotVehicleType: vehicleType,
        pilotPlateNumber: plateNumber,
      });
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <TouchableOpacity style={styles.changeAvatarButton}>
              <Text style={styles.changeAvatarText}>Change Avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile?.phone}
              editable={false}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[styles.label, styles.sectionLabel]}>Vehicle Info (Pilot Only)</Text>
            <TextInput
              style={styles.input}
              value={vehicleType}
              onChangeText={setVehicleType}
              placeholder="Vehicle type (e.g., Sedan)"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <TextInput
              style={styles.input}
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="License plate (e.g., KA-01-AB-1234)"
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* KYC Status */}
            <Text style={[styles.label, styles.sectionLabel]}>KYC Status</Text>
            <View style={styles.kycCard}>
              <View style={styles.kycInfo}>
                <Text style={styles.kycTitle}>
                  {profile?.kycStatus === 'verified' ? 'Verified' : 'Verification Pending'}
                </Text>
                <Text style={styles.kycSubtitle}>
                  {profile?.kycStatus === 'verified'
                    ? 'Your account is verified'
                    : 'Upload documents to verify'}
                </Text>
              </View>
              {profile?.kycStatus !== 'verified' && (
                <TouchableOpacity style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
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
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  changeAvatarButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: -12,
  },
  sectionLabel: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  disabledInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textTertiary,
  },
  kycCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  kycInfo: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  kycSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});



















