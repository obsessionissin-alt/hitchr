// src/screens/AuthScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../store/AuthContext';

export default function AuthScreen() {
  // Get everything from context
  const { 
    sendOTP, 
    verifyOTP, 
    loading, 
    error,
    authStep,       // 'phone' or 'otp' from context
    tempPhone,      // Phone number from context
    setTempPhone,   // Set phone number in context
    setAuthStep,    // Set step in context
  } = useAuth();

  // Only OTP is local state (doesn't need to survive re-renders)
  const [otp, setOtp] = useState('');

  // Debug logs
  useEffect(() => {
    console.log('🔄 Step changed in state:', authStep);
  }, [authStep]);

  useEffect(() => {
    console.log('📊 Component state:', { authStep, tempPhone, otp, loading });
  }, [authStep, tempPhone, otp, loading]);

  const handleSendOTP = async (e?: any) => {
    // Prevent form submission on web
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!tempPhone || tempPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      await sendOTP(tempPhone);
      // State change happens in AuthContext now
      console.log('✅ OTP sent, step should change to otp');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    }
  };
  
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      await verifyOTP(tempPhone, otp);
      // Navigation handled by AppNavigator
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid OTP'); 
      setOtp('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Area */}
      <View style={styles.header}>
        <Text style={styles.logo}>🚗 HITCH</Text>
        <Text style={styles.tagline}>Community Ride Sharing</Text>
      </View>

      {/* Auth Form */}
      <View style={styles.form}>
        {authStep === 'phone' ? (
          <>
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>We'll send you a verification code</Text>

            <View style={styles.phoneInput}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="1234567890"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={tempPhone}
                onChangeText={setTempPhone}
                autoFocus
                editable={!loading}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.hint}>
              💡 Any number works - OTP is always 123456 in development
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={(e) => handleSendOTP(e)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>Sent to +91{tempPhone}</Text>

            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
              editable={!loading}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.hint}>
              🔑 Development OTP: 123456
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setAuthStep('phone');
                setOtp('');
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 30,
    textAlign: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#0F172A',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 8,
    letterSpacing: 8,
    color: '#0F172A',
  },
  hint: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});