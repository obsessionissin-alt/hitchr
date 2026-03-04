// src/hooks/useNearbyUsers.ts
// Unified data pipeline for fetching nearby users (pilots + riders)
// Works on both Web and Native (Expo)

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import api from '../services/api';
import type { UserMarker, NearbyUsersResponse } from '../types/userMarker';
import { DEFAULT_RADIUS, WITH_MOCKS } from '../constants/config';

// Polling interval: 5-7 seconds (randomized to prevent thundering herd)
const getPollingInterval = () => Math.floor(Math.random() * 2000) + 5000;

interface UseNearbyUsersOptions {
  /** User's current latitude */
  latitude: number | null;
  /** User's current longitude */
  longitude: number | null;
  /** Maximum search radius in meters (default: 5000) */
  maxDistance?: number;
  /** Include mock users for development preview */
  withMocks?: boolean;
  /** Auto-refresh interval enabled */
  autoRefresh?: boolean;
  /** Filter to show only pilots */
  showPilots?: boolean;
  /** Filter to show only riders */
  showRiders?: boolean;
}

interface BackendPilotResponse {
  id: string;
  name: string;
  avatar_url?: string | null;
  rating?: number;
  total_rides_as_pilot?: number;
  total_km?: number;
  latitude: number;
  longitude: number;
  pilot_vehicle_type?: string;
  pilot_plate_number?: string;
  distance?: number;
  is_mock?: boolean;
}

interface BackendRiderResponse {
  id: string;
  name: string;
  avatar_url?: string | null;
  rating?: number;
  total_rides_as_rider?: number;
  latitude: number;
  longitude: number;
  distance?: number;
  is_mock?: boolean;
}

/**
 * Normalize a pilot response from backend into UserMarker format
 */
const normalizePilot = (pilot: BackendPilotResponse): UserMarker => ({
  id: pilot.id,
  name: pilot.name,
  role: 'pilot',
  avatar_url: pilot.avatar_url || null,
  latitude: pilot.latitude,
  longitude: pilot.longitude,
  is_mock: pilot.is_mock ?? false,
  distance: pilot.distance,
  rating: pilot.rating,
  total_rides: pilot.total_rides_as_pilot,
  total_km: pilot.total_km,
  vehicle_type: pilot.pilot_vehicle_type,
  plate_number: pilot.pilot_plate_number,
});

/**
 * Normalize a rider response from backend into UserMarker format
 */
const normalizeRider = (rider: BackendRiderResponse): UserMarker => ({
  id: rider.id,
  name: rider.name,
  role: 'rider',
  avatar_url: rider.avatar_url || null,
  latitude: rider.latitude,
  longitude: rider.longitude,
  is_mock: rider.is_mock ?? false,
  distance: rider.distance,
  rating: rider.rating,
  total_rides: rider.total_rides_as_rider,
});

/**
 * Hook to fetch and manage nearby users (pilots + riders)
 * 
 * Features:
 * - Fetches from backend API with automatic polling (5-7s)
 * - Merges real users with mock users when withMocks=true
 * - Returns normalized UserMarker[] array
 * - Works on both Web and Native
 * - Preserves last successful fetch on network errors
 */
export function useNearbyUsers(options: UseNearbyUsersOptions): NearbyUsersResponse {
  const {
    latitude,
    longitude,
    maxDistance = DEFAULT_RADIUS,
    withMocks = WITH_MOCKS,
    autoRefresh = true,
    showPilots = true,
    showRiders = true,
  } = options;

  const [data, setData] = useState<UserMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache last successful fetch to prevent data flash on network errors
  const lastSuccessfulData = useRef<UserMarker[]>([]);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch nearby users from backend
   */
  const fetchNearbyUsers = useCallback(async () => {
    // Skip if no location available
    if (latitude === null || longitude === null) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: maxDistance.toString(),
        withMocks: withMocks ? 'true' : 'false',
      });

      // Unified fetch (pilots + riders) from /nearby
      const response = await api.get<UserMarker[]>(`/nearby?${params}`).catch((err) => {
        console.warn('Failed to fetch nearby users:', err.message);
        return null;
      });

      if (!isMountedRef.current) return;

      if (response !== null && Array.isArray(response)) {
        // Filter by role based on current filters
        const filteredUsers = response.filter((user) => {
          if (user.role === 'pilot' && !showPilots) return false;
          if (user.role === 'rider' && !showRiders) return false;
          return true;
        });

        const sortedUsers = filteredUsers.sort(
          (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
        );

        setData(sortedUsers);
        lastSuccessfulData.current = sortedUsers;
      } else {
        // If fetch failed but we have cached data, use it
        if (lastSuccessfulData.current.length > 0) {
          console.warn('API failed, using cached data');
          setData(lastSuccessfulData.current);
        } else {
          setError('Failed to fetch nearby users');
        }
      }
    } catch (err: any) {
      console.error('Error fetching nearby users:', err);

      if (!isMountedRef.current) return;

      if (lastSuccessfulData.current.length > 0) {
        setData(lastSuccessfulData.current);
        console.warn('Using cached nearby users data');
      } else {
        setError(err.message || 'Failed to fetch nearby users');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [latitude, longitude, maxDistance, withMocks, showPilots, showRiders]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  // Initial fetch when location becomes available
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchNearbyUsers();
    }
  }, [latitude, longitude, maxDistance, fetchNearbyUsers]);

  // Setup polling interval
  useEffect(() => {
    if (!autoRefresh || latitude === null || longitude === null) {
      return;
    }

    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Setup new polling interval (5-7 seconds, randomized)
    const setupPolling = () => {
      const interval = getPollingInterval();
      pollingIntervalRef.current = setInterval(() => {
        fetchNearbyUsers();
      }, interval);
    };

    setupPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [autoRefresh, latitude, longitude, fetchNearbyUsers]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

/**
 * Helper to filter UserMarker[] by role
 */
export function filterByRole(users: UserMarker[], role: 'pilot' | 'rider'): UserMarker[] {
  return users.filter(user => user.role === role);
}

/**
 * Helper to get pilots from UserMarker[]
 */
export function getPilots(users: UserMarker[]): UserMarker[] {
  return filterByRole(users, 'pilot');
}

/**
 * Helper to getRiders from UserMarker[]
 */
export function getRiders(users: UserMarker[]): UserMarker[] {
  return filterByRole(users, 'rider');
}

export default useNearbyUsers;

