// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { DEV_MODE } from '../constants/config';
import { mockCurrentUser, mockBadges, mockPlates } from '../data/mockData';

interface UserStats {
  totalRidesAsPilot: number;
  totalRidesAsRider: number;
  totalKm: number;
  rating: number;
  ratingCount: number;
  tokenBalance: number;
  streakDays: number;
  lastRideDate: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  isPilotAvailable: boolean;
  isRiderAvailable: boolean;
  pilotVehicleType?: string;
  pilotPlateNumber?: string;
  stats: UserStats;
  badges: any[];
  collectedPlates: number;
  fcmToken?: string;
  created_at?: string;
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateAvailability: (isPilot: boolean, isRider: boolean, location?: { lat: number; lng: number }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = '@hitch:user_profile';

const createDevProfile = (authUser?: any): UserProfile => {
  const rawId = authUser?.id || mockCurrentUser.id;
  const displayName = (authUser?.name || rawId || '')
    .replace('dev_mock_token_', '')
    .replace('dev-', '')
    .replace(/_/g, ' ')
    .trim();

  return {
    id: rawId,
    name: displayName || mockCurrentUser.name,
    phone: authUser?.phone || mockCurrentUser.phone,
    email: 'dev@hitch.app',
    avatarUrl: undefined,
    kycStatus: 'verified',
    isPilotAvailable: false,
    isRiderAvailable: true,
    pilotVehicleType: 'Sedan',
    pilotPlateNumber: 'KA-01-AB-1234',
    stats: {
      totalRidesAsPilot: 15,
      totalRidesAsRider: mockCurrentUser.totalRides,
      totalKm: mockCurrentUser.totalKm,
      rating: mockCurrentUser.rating,
      ratingCount: 42,
      tokenBalance: mockCurrentUser.tokens,
      streakDays: 4,
      lastRideDate: new Date().toISOString(),
    },
    badges: mockBadges,
    collectedPlates: mockPlates.filter((plate) => plate.unlocked !== false).length,
    fcmToken: undefined,
  };
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load cached profile on mount
  useEffect(() => {
    const loadCachedProfile = async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setProfile(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Error loading cached profile:', error);
      }
    };

    loadCachedProfile();
  }, []);

  // Fetch fresh profile when authenticated
  useEffect(() => {
    if (isAuthenticated && authUser) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, authUser]);

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      if (DEV_MODE) {
        const devProfile = createDevProfile(authUser);
        setProfile(devProfile);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devProfile));
        return;
      }

      const response = await api.get('/api/v1/users/me');
      const userData = response;

      const userProfile: UserProfile = {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        kycStatus: userData.kyc_status,
        isPilotAvailable: userData.is_pilot_available || false,
        isRiderAvailable: userData.is_rider_available || false,
        pilotVehicleType: userData.pilot_vehicle_type,
        pilotPlateNumber: userData.pilot_plate_number,
        stats: {
          totalRidesAsPilot: userData.total_rides_as_pilot || 0,
          totalRidesAsRider: userData.total_rides_as_rider || 0,
          totalKm: userData.total_km || 0,
          rating: userData.rating || 0,
          ratingCount: userData.rating_count || 0,
          tokenBalance: userData.token_balance || 0,
          streakDays: userData.streak_days || 0,
          lastRideDate: userData.last_ride_date,
        },
        badges: userData.badges || [],
        collectedPlates: userData.collected_plates_count || 0,
        fcmToken: userData.fcm_token,
      };

      setProfile(userProfile);

      // Cache the profile
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error refreshing profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailability = async (isPilot: boolean, isRider: boolean, location?: { lat: number; lng: number }) => {
    try {
      if (DEV_MODE) {
        if (profile) {
          const updatedProfile = {
            ...profile,
            isPilotAvailable: isPilot,
            isRiderAvailable: isRider,
          };
          setProfile(updatedProfile);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
        }
        return;
      }

      const response = await api.patch('/users/me/availability', {
        isPilotAvailable: isPilot,
        isRiderAvailable: isRider,
        location: location,
      });

      if (profile) {
        const updatedProfile = {
          ...profile,
          isPilotAvailable: isPilot,
          isRiderAvailable: isRider,
        };
        setProfile(updatedProfile);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      }

      return response;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (DEV_MODE) {
        if (profile) {
          const updatedProfile = {
            ...profile,
            name: data.name ?? profile.name,
            avatarUrl: data.avatarUrl ?? profile.avatarUrl,
            pilotVehicleType: data.pilotVehicleType ?? profile.pilotVehicleType,
            pilotPlateNumber: data.pilotPlateNumber ?? profile.pilotPlateNumber,
          };
          setProfile(updatedProfile);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
        }
        return;
      }

      const response = await api.patch('/api/v1/users/me', {
        name: data.name,
        avatar_url: data.avatarUrl,
        pilot_vehicle_type: data.pilotVehicleType,
        pilot_plate_number: data.pilotPlateNumber,
      });

      await refreshProfile();

      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    profile,
    isLoading,
    refreshProfile,
    updateAvailability,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

