// src/contexts/MapContext.tsx
// Backend-driven map context - fetches pilots/riders from API
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { DEV_MODE, DEFAULT_RADIUS, WITH_MOCKS } from '../constants/config';

interface Location {
  lat: number;
  lng: number;
}

export interface NearbyUser {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  rating: number;
  total_rides_as_pilot?: number;
  total_rides_as_rider?: number;
  total_km?: number;
  latitude: number;
  longitude: number;
  distance: number;
  pilot_vehicle_type?: string;
  pilot_plate_number?: string;
  is_mock?: boolean;
}

interface MapFilters {
  showPilots: boolean;
  showRiders: boolean;
  maxDistance: number;
}

interface MapContextType {
  userLocation: Location | null;
  nearbyPilots: NearbyUser[];
  nearbyRiders: NearbyUser[];
  filters: MapFilters;
  isLoadingLocation: boolean;
  isLoadingNearby: boolean;
  locationError: string | null;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  fetchNearbyUsers: () => Promise<void>;
  setFilters: (filters: Partial<MapFilters>) => void;
  updateUserLocation: (location: Location) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [nearbyPilots, setNearbyPilots] = useState<NearbyUser[]>([]);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyUser[]>([]);
  const [filters, setFiltersState] = useState<MapFilters>({
    showPilots: true,
    showRiders: true,
    maxDistance: DEFAULT_RADIUS,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<{
    pilots: NearbyUser[];
    riders: NearbyUser[];
  } | null>(null);
  
  const locationSubscription = useRef<ExpoLocation.LocationSubscription | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  const startLocationTracking = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);

      // Default location (Dehradun) for quick fallback
      const defaultLocation = { lat: 30.3165, lng: 78.0322 };
      
      // On web, use default location immediately then try to get real location
      if (Platform.OS === 'web') {
        setUserLocation(defaultLocation);
        setIsLoadingLocation(false);
        
        // Try to get real location in background (non-blocking)
        navigator.geolocation?.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Web geolocation error:', error.message);
          },
          { timeout: 5000, maximumAge: 60000 }
        );
        return;
      }

      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setUserLocation(defaultLocation);
        setIsLoadingLocation(false);
        return;
      }

      try {
        const currentPosition = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
        
        const location = {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        };
        
        setUserLocation(location);
      } catch (error) {
        console.warn('Could not get current position:', error);
        setUserLocation(defaultLocation);
      }

      // Watch position on native only
      if (Platform.OS !== 'web') {
        try {
          locationSubscription.current = await ExpoLocation.watchPositionAsync(
            {
              accuracy: ExpoLocation.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 50,
            },
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            }
          );
        } catch (watchError) {
          console.warn('Could not start location watch:', watchError);
        }
      }
    } catch (error: any) {
      console.error('Location tracking error:', error);
      setLocationError(error.message || 'Failed to get location');
      setUserLocation({ lat: 30.3165, lng: 78.0322 });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Fetch nearby users from API using the unified /nearby endpoint
  const fetchNearbyUsers = async () => {
    if (!userLocation) return;

    try {
      setIsLoadingNearby(true);

      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: filters.maxDistance.toString(),
        withMocks: WITH_MOCKS ? 'true' : 'false',
      });

      console.log('Fetching nearby users from unified endpoint:', `/nearby?${params}`);

      // Use the unified endpoint instead of separate pilots/riders endpoints
      const response = await api.get(`/nearby?${params}`).catch((err) => {
        console.warn('Failed to fetch nearby users:', err.message);
        return null;
      });

      // Only update state if we got a valid response
      if (response !== null && Array.isArray(response)) {
        // Split the unified data into pilots and riders
        const pilots = response.filter((user: any) => user.role === 'pilot');
        const riders = response.filter((user: any) => user.role === 'rider');
        
        setNearbyPilots(pilots);
        setNearbyRiders(riders);
        setLastSuccessfulFetch({ pilots, riders });
      } else if (lastSuccessfulFetch) {
        // If fetch failed but we have previous data, keep showing it
        console.warn('API failed, keeping previous data');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      // Don't clear existing data on error
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const setFilters = (newFilters: Partial<MapFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const updateUserLocation = (location: Location) => {
    setUserLocation(location);
  };

  const value: MapContextType = {
    userLocation,
    nearbyPilots,
    nearbyRiders,
    filters,
    isLoadingLocation,
    isLoadingNearby,
    locationError,
    startLocationTracking,
    stopLocationTracking,
    fetchNearbyUsers,
    setFilters,
    updateUserLocation,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
