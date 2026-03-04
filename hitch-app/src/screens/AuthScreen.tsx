// src/screens/AuthScreen.tsx
// Modern Indian Design - Raw, authentic, Gen Z vibes

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { DEV_MODE } from '../constants/config';

export default function AuthScreen() {
  const { signIn } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [devUsername, setDevUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);

      if (DEV_MODE) {
        setStep('otp');
        Alert.alert('Dev Mode', 'Use OTP: 123456 to continue');
      } else {
        const { auth } = require('../config/firebase');
        const { signInWithPhoneNumber } = require('firebase/auth');
        
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
        (window as any).confirmationResult = confirmation;
        setStep('otp');
        Alert.alert('Success', 'OTP sent to your phone number');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      if (DEV_MODE) {
        if (otp === '123456') {
          const username = devUsername.trim() || phoneNumber.slice(-4);
          const mockToken = 'dev_mock_token_' + username;
          await signIn(mockToken);
        } else {
          Alert.alert('Error', 'Invalid OTP. Use 123456 in dev mode');
        }
      } else {
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) {
          throw new Error('No confirmation result found');
        }

        const userCredential = await confirmationResult.confirm(otp);
        const idToken = await userCredential.user.getIdToken();
        await signIn(idToken);
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Dev Mode Banner */}
          {DEV_MODE && (
            <View style={styles.devBanner}>
              <Text style={styles.devText}>DEV MODE</Text>
            </View>
          )}

          {/* Tagline - Authentic Indian vibe */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineHindi}>भीड़ में खोया रहता हूँ</Text>
            <Text style={styles.taglineEnglish}>Lost in the crowd</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>H</Text>
              </View>
            </View>
            
            <Text style={styles.brandName}>hitchr</Text>
            <Text style={styles.tagline}>Find your ride, find your tribe</Text>
          </View>

          {/* Visual Element - Rickshaw inspired */}
          <View style={styles.visualElement}>
            <View style={styles.stripeYellow} />
            <View style={styles.stripeGreen} />
            <View style={styles.stripeMagenta} />
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {step === 'phone' ? (
              <>
                <Text style={styles.formTitle}>Enter your number</Text>
                <Text style={styles.formSubtitle}>
                  We'll send you a code to verify
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone number"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    editable={!isLoading}
                    maxLength={10}
                  />
                </View>

                {DEV_MODE && (
                  <View style={styles.devSection}>
                    <Text style={styles.devLabel}>Test Username</Text>
                    <TextInput
                      style={styles.devInput}
                      placeholder="alice, bob, etc."
                      placeholderTextColor={theme.colors.textTertiary}
                      value={devUsername}
                      onChangeText={setDevUsername}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>Enter OTP</Text>
                <Text style={styles.formSubtitle}>
                  Sent to +91 {phoneNumber}
                </Text>

                {DEV_MODE && (
                  <View style={styles.devHint}>
                    <Text style={styles.devHintText}>Use: 123456</Text>
                  </View>
                )}

                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  editable={!isLoading}
                  maxLength={6}
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.backLinkText}>← Change number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms</Text>
              {' & '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  devBanner: {
    alignSelf: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    marginTop: theme.spacing.md,
  },
  devText: {
    color: theme.colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  taglineContainer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  taglineHindi: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  taglineEnglish: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.textOnPrimary,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  visualElement: {
    flexDirection: 'row',
    height: 6,
    marginVertical: theme.spacing.xl,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 4,
  },
  stripeYellow: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  stripeGreen: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
  stripeMagenta: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  countryCode: {
    width: 64,
    height: 56,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  devSection: {
    marginBottom: theme.spacing.md,
  },
  devLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devInput: {
    height: 48,
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  devHint: {
    backgroundColor: `${theme.colors.accent}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  devHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  otpInput: {
    height: 64,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 8,
    marginBottom: theme.spacing.lg,
  },
  button: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  backLink: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
  terms: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
