import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SimpleAuthProvider, useSimpleAuth } from './src/store/SimpleAuthContext';
import EnhancedMapScreen from './src/screens/EnhancedMapScreen';
import EnhancedProfileScreen from './src/screens/EnhancedProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Auth Screens
function AuthScreens() {
  const { login, sendOTP } = useSimpleAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await sendOTP(phone);
      console.log('✅ OTP sent');
      if (data.otp) {
        Alert.alert('OTP Sent', `Development OTP: ${data.otp}`);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await login(phone, otp);
      console.log('✅ Login successful!');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🚗</Text>
            <Text style={styles.logoText}>Hitchr</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>We sent a code to +91{phone}</Text>
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor="#94A3B8"
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
            
            <TouchableOpacity 
              style={[styles.button, (!otp || loading) && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={!otp || loading}
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
                setStep('phone');
                setOtp('');
                setError('');
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.logoText}>Hitchr</Text>
          <Text style={styles.tagline}>Your ride, tokenized</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={styles.phoneInput}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, (!phone || loading) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={!phone || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

// Import additional screens
import RideRequestScreen from './src/screens/RideRequestScreen';
import RideActiveScreen from './src/screens/RideActiveScreen';
import RideCompleteScreen from './src/screens/RideCompleteScreen';
import PilotFullProfileScreen from './src/screens/PilotFullProfileScreen';

// Main Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Map"
        component={EnhancedMapScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EnhancedProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PilotFullProfile" 
        component={PilotFullProfileScreen}
        options={{ title: 'Pilot Profile' }}
      />
      <Stack.Screen 
        name="RideRequest" 
        component={RideRequestScreen}
        options={{ title: 'Ride Request' }}
      />
      <Stack.Screen 
        name="RideActive" 
        component={RideActiveScreen}
        options={{ title: 'Ride Active', headerShown: false }}
      />
      <Stack.Screen 
        name="RideComplete" 
        component={RideCompleteScreen}
        options={{ title: 'Ride Complete', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// App Navigator
function AppNavigator() {
  const { user, loading } = useSimpleAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthScreens />}
    </NavigationContainer>
  );
}

// Root App Component
export default function App() {
  console.log('🚀 Hitchr App - Step 3: Full Navigation');
  
  return (
    <SimpleAuthProvider>
      <AppNavigator />
    </SimpleAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
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
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  countryCode: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});
