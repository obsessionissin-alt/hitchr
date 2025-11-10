// Simplified AuthContext that works on web
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api/v1';

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
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        // Validate token by getting user data
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Invalid token
          await AsyncStorage.removeItem('@auth_token');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phone: string) => {
    const formattedPhone = `+91${phone}`;
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    
    return data;
  };

  const login = async (phone: string, otp: string) => {
    const formattedPhone = `+91${phone}`;
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, otp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Invalid OTP');
    }

    await AsyncStorage.setItem('@auth_token', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};

