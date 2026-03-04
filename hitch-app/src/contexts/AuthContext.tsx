// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import api from '../services/api';
import { DEV_MODE } from '../constants/config';

interface AuthContextType {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (firebaseToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@hitch:auth_token',
  REFRESH_TOKEN: '@hitch:refresh_token',
  USER_DATA: '@hitch:user_data',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate auth state on app launch
  useEffect(() => {
    const rehydrateAuth = async () => {
      try {
        const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        ]);

        if (storedAccessToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(parsedUser);

          const isDevToken = storedAccessToken.startsWith('dev_mock_token_');

          if (DEV_MODE && isDevToken) {
            api.setAuthToken(storedAccessToken);
            setIsLoading(false);
            return;
          }

          // Verify token is still valid (production mode)
          try {
            api.setAuthToken(storedAccessToken);
            const response = await api.get('/api/v1/users/me');
            setUser(response);
          } catch (error) {
            // Token expired, try to refresh
            if (storedRefreshToken) {
              await refreshAccessToken();
            } else {
              // Clear invalid session
              await signOut();
            }
          }
        }
      } catch (error) {
        console.error('Auth rehydration error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    rehydrateAuth();
  }, []);

  const signIn = async (firebaseToken: string) => {
    try {
      // Check if dev mode (mock token)
      const isDevMode = firebaseToken.startsWith('dev_mock_token_');
      
      if (isDevMode) {
        // Dev mode: Create mock user data
        const username = firebaseToken.replace('dev_mock_token_', '') || 'Dev User';
        const mockUser = {
          id: firebaseToken, // keep id aligned with token for sockets/location
          name: username,
          phone: '+91 9876543210',
          email: 'dev@hitch.app',
          kyc_status: 'verified',
          is_pilot_available: false,
          is_rider_available: false,
          token_balance: 120,
          total_rides_as_pilot: 0,
          total_rides_as_rider: 0,
          total_km: 0,
          rating: 5.0,
          rating_count: 0,
          created_at: new Date().toISOString(),
        };

        setAccessToken(firebaseToken);
        setRefreshToken(firebaseToken + '_refresh');
        setUser(mockUser);

        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, firebaseToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, firebaseToken + '_refresh'),
          AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser)),
        ]);

        api.setAuthToken(firebaseToken);
        
        console.log('✅ Signed in with dev mode');
        return;
      }

      // Production mode: Verify Firebase token with backend
      const response = await api.post('/api/v1/auth/verify-token', {
        firebaseToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      // Save to state
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);

      // Persist to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
      ]);

      // Set default header for API requests
      api.setAuthToken(newAccessToken);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Firebase (ignore errors in dev mode)
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        if (!DEV_MODE) {
          throw error;
        }
      }

      // Clear state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);

      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      // Remove auth header
      api.clearAuthToken();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      if (DEV_MODE && refreshToken.startsWith('dev_mock_token_')) {
        return;
      }

      const response = await api.post('/api/v1/auth/refresh', {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
      ]);

      api.setAuthToken(newAccessToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      await signOut();
      throw error;
    }
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    signIn,
    signOut,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

