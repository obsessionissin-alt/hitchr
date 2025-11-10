import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhoneInput from '../components/PhoneInput';
import OTPInput from '../components/OTPInput';
import authService from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewAuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export default function NewAuthScreen({ onAuthSuccess }: NewAuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationId, setVerificationId] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Validate phone number
  const isPhoneValid = phone.length === 10 && /^[6-9]/.test(phone);

  const handleSendOTP = async () => {
    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = `+91${phone}`;
      console.log('📞 Sending OTP to:', fullPhone);

      const vid = await authService.sendOTP(fullPhone);
      setVerificationId(vid);
      setStep('otp');
      setResendTimer(30);
      console.log('✅ OTP sent successfully');
    } catch (err: any) {
      console.error('❌ Send OTP error:', err);
      let errorMessage = 'Failed to send OTP';

      if (err.message.includes('too-many-requests')) {
        errorMessage = 'Too many attempts. Please wait 5 minutes and try again.';
      } else if (err.message.includes('invalid-phone')) {
        errorMessage = 'Invalid phone number format';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Verifying OTP...');

      // Verify with Firebase
      const { token, user } = await authService.verifyOTP(verificationId, otp);

      // Store token
      await AsyncStorage.setItem('@auth_token', token);
      
      console.log('✅ Authentication successful!');
      console.log('👤 User:', user);

      // Call parent callback
      onAuthSuccess(user);
    } catch (err: any) {
      console.error('❌ Verify OTP error:', err);
      let errorMessage = 'Invalid OTP code';

      if (err.message.includes('invalid-verification-code')) {
        errorMessage = 'Invalid code. Please try again.';
      } else if (err.message.includes('code-expired')) {
        errorMessage = 'Code expired. Please request a new one.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setOtp('');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNumber = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setOtp('');
    setError('');
    await handleSendOTP();
  };

  const renderPhoneStep = () => (
    <>
      <Text style={styles.title}>Welcome to HITCH</Text>
      <Text style={styles.subtitle}>Turn every ride into adventure</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <PhoneInput
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          setError('');
        }}
        error={error}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, (!isPhoneValid || loading) && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={!isPhoneValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderOTPStep = () => (
    <>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We sent a code to +91 {phone.slice(0, 2)}XXX XXX{phone.slice(-2)}
      </Text>

      <TouchableOpacity onPress={handleEditNumber}>
        <Text style={styles.editNumber}>Edit Number</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <OTPInput
        value={otp}
        onChangeText={(text) => {
          setOtp(text);
          setError('');
          // Auto-verify when complete
          if (text.length === 6 && !loading) {
            setTimeout(() => handleVerifyOTP(), 100);
          }
        }}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, (otp.length !== 6 || loading) && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={otp.length !== 6 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResendOTP}
        disabled={resendTimer > 0}
        style={styles.resendContainer}
      >
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0
            ? `Resend OTP in ${resendTimer}s`
            : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'phone' ? renderPhoneStep() : renderOTPStep()}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editNumber: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
});

