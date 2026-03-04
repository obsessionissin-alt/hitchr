import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useCampusStore } from '../store/campusStore';
import { campusUserAPI, campusSeedAPI } from '../utils/campusApi';

export default function CampusOnboarding() {
  const router = useRouter();
  const { user, setUser, loadUser } = useCampusStore();
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadUser();
    
    // Seed campus data only once per install
    try {
      const hasSeeded = await AsyncStorage.getItem('hitchr_has_seeded');
      if (!hasSeeded) {
        await campusSeedAPI.seed();
        await AsyncStorage.setItem('hitchr_has_seeded', 'true');
        console.log('Campus data seeded for first time');
      } else {
        console.log('Already seeded, skipping');
      }
    } catch (error) {
      console.log('Seed error:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const handleJoin = async () => {
    if (!name.trim() || !college.trim()) {
      alert('Please enter name and college');
      return;
    }
    
    setCreating(true);
    try {
      const response = await campusUserAPI.create({
        name: name.trim(),
        college: college.trim(),
        email: email.trim() || undefined,
      });
      await setUser(response.data);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to join. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Hitchr Campus</Text>
          <Text style={styles.tagline}>Travel Together. साथ चलें।</Text>
          <Text style={styles.description}>
            Match with people already headed your way.{'\n'}
            A campus-first, human way to move.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>College</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Delhi University"
            placeholderTextColor={Colors.textMuted}
            value={college}
            onChangeText={setCollege}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>College Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@college.edu"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, (!name.trim() || !college.trim()) && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={!name.trim() || !college.trim() || creating}
            activeOpacity={0.8}
          >
            {creating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Join Campus Hitchr</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.featureText}>Campus Verified</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="people" size={20} color={Colors.accent} />
              <Text style={styles.featureText}>Community First</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Pay After Ride</Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.trustBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  features: {
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
});
