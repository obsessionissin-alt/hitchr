// src/store/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import socketService from '../services/socket';

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'rider' | 'pilot';
  token_balance: number;
  total_rides: number;
  rating: number;
  total_km: number;
  avatar_url?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  error: string | null;
  authStep: 'phone' | 'otp';
  tempPhone: string;
  setAuthStep: (step: 'phone' | 'otp') => void;
  setTempPhone: (phone: string) => void;
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [tempPhone, setTempPhone] = useState('');

  console.log('🔑 AuthProvider state - loading:', loading, 'user:', !!user);

  // Check for stored token on mount
  useEffect(() => {
    console.log('🔍 Checking stored auth...');
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        api.setAuthToken(token);
        try {
          const response = await api.getMe();
          setUser(response);
          
          // Connect Socket.io if user is authenticated
          try {
            await socketService.connect(token);
          } catch (socketError) {
            console.warn('Socket connection failed:', socketError);
          }
        } catch (apiError: any) {
          // Token might be invalid or expired
          console.log('Token validation failed:', apiError.message);
          await AsyncStorage.removeItem('@auth_token');
          api.clearAuthToken();
        }
      } else {
        console.log('No stored auth found');
      }
    } catch (err) {
      console.log('Auth check error:', err);
      // Clear invalid token if any
      await AsyncStorage.removeItem('@auth_token');
      api.clearAuthToken();
    } finally {
      console.log('✅ Auth check complete, setting loading = false');
      setLoading(false);
    }
  };

  const sendOTP = async (phoneNumber: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('Sending OTP to:', formattedPhone);

      // Call backend to send OTP
      const response = await api.post('/auth/send-otp', {
        phone: formattedPhone,
      });

      console.log('OTP sent successfully:', response);

      // In development, the OTP is returned in response
      if (response.otp) {
        console.log('Development OTP:', response.otp);
      }

      // Store phone and change step
      setTempPhone(phoneNumber);
      setAuthStep('otp');

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error('Send OTP error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send OTP';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`;

      console.log('Verifying OTP for:', formattedPhone);

      // Call backend to verify OTP
      const response = await api.post('/auth/verify-otp', {
        phone: formattedPhone,
        otp,
      });

      const { accessToken, user: userData } = response;

      // Store token
      await AsyncStorage.setItem('@auth_token', accessToken);
      api.setAuthToken(accessToken);

      // Connect Socket.io for real-time updates
      try {
        await socketService.connect(accessToken);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
        // Don't block auth if socket fails
      }

      setUser(userData);
      
      // Reset auth flow state
      setAuthStep('phone');
      setTempPhone('');
      
      setLoading(false);
      console.log('Auth successful!');
    } catch (err: any) {
      setLoading(false);
      console.error('Verify OTP error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Invalid OTP';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Disconnect Socket.io
      socketService.disconnect();
      
      await AsyncStorage.removeItem('@auth_token');
      api.clearAuthToken();
      setUser(null);
      setError(null);
      setAuthStep('phone');
      setTempPhone('');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        authStep,
        tempPhone,
        setAuthStep,
        setTempPhone,
        sendOTP,
        verifyOTP,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};