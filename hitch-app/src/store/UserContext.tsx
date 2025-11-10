import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'rider' | 'pilot' | 'both';
  avatar?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  tokensBalance?: number;
  stats?: {
    totalRides: number;
    completedRides: number;
    totalKm?: number;
    rating?: number;
    trustScore: number;
  };
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (role: 'rider' | 'pilot' | 'both') => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, authToken, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync profile with auth user
  useEffect(() => {
    if (user) {
      setProfile(user as UserProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    try {
      const response = await api.updateProfile(data);
      const updatedUser = response.user;

      // Update both profile and auth user
      setProfile(updatedUser);
      setUser(updatedUser);

      console.log('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!authToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.getMe();
      const updatedUser = response.user;

      setProfile(updatedUser);
      setUser(updatedUser);

      console.log('Profile refreshed');
    } catch (error: any) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: 'rider' | 'pilot' | 'both') => {
    await updateProfile({ role });
  };

  const value: UserContextType = {
    profile,
    isLoading,
    updateProfile,
    refreshProfile,
    switchRole,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}