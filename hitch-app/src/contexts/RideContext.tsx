// src/contexts/RideContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import { DEV_MODE } from '../constants/config';
import { mockRideHistory, mockPilots } from '../data/mockData';

interface Location {
  lat: number;
  lng: number;
}

interface Ride {
  id: string;
  riderId: string;
  pilotId: string;
  origin: Location;
  originAddress?: string;
  destination: Location;
  destinationAddress?: string;
  distanceMeters?: number;
  status: 'notified' | 'offered' | 'pending_confirm' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  initiatedBy: 'rider' | 'pilot';
  tokensAwardedToRider?: number;
  tokensAwardedToPilot?: number;
  riderConfirmedAt?: string;
  pilotConfirmedAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  rider?: any;
  pilot?: any;
}

interface RideContextType {
  currentRide: Ride | null;
  rideHistory: Ride[];
  isLoading: boolean;
  createNotification: (pilotId: string, origin: Location, destination: Location) => Promise<Ride>;
  createOffer: (riderId: string, origin: Location, destination: Location) => Promise<Ride>;
  confirmRide: (rideId: string) => Promise<any>;
  startRide: (rideId: string) => Promise<any>;
  endRide: (rideId: string, endLocation: Location) => Promise<any>;
  cancelRide: (rideId: string) => Promise<void>;
  getRide: (rideId: string) => Promise<Ride>;
  fetchRideHistory: (role?: 'rider' | 'pilot' | 'both') => Promise<void>;
  setCurrentRide: (ride: Ride | null) => void;
  sendTelemetry: (rideId: string, points: any[]) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

const buildDevRide = (
  profile: any,
  params: {
    pilotId?: string;
    riderId?: string;
    origin: Location;
    destination: Location;
    initiatedBy: 'rider' | 'pilot';
    status?: Ride['status'];
  }
): Ride => {
  const pilotData = mockPilots.find((p) => p.id === params.pilotId) || mockPilots[0];

  return {
    id: `dev-ride-${Date.now()}`,
    riderId: params.riderId || profile?.id || 'dev-rider',
    pilotId: pilotData.id,
    origin: params.origin,
    destination: params.destination,
    distanceMeters: 1200,
    status: params.status || 'notified',
    initiatedBy: params.initiatedBy,
    createdAt: new Date().toISOString(),
    rider: {
      id: profile?.id || 'dev-rider',
      name: profile?.name || 'Dev Rider',
    },
    pilot: {
      id: pilotData.id,
      name: pilotData.name,
      rating: pilotData.rating,
      vehicle: pilotData.vehicle,
    },
  };
};

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { profile } = useUser();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createNotification = async (pilotId: string, origin: Location, destination: Location): Promise<Ride> => {
    try {
      setIsLoading(true);
      if (DEV_MODE) {
        const ride = buildDevRide(profile, {
          pilotId,
          origin,
          destination,
          initiatedBy: 'rider',
          status: 'notified',
        });
        setCurrentRide(ride);
        return ride;
      }

      const response = await api.post('/api/v1/rides/notify', {
        pilotId,
        origin,
        destination,
      });

      const ride = response;
      setCurrentRide(ride);
      return ride;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createOffer = async (riderId: string, origin: Location, destination: Location): Promise<Ride> => {
    try {
      setIsLoading(true);
      if (DEV_MODE) {
        const ride = buildDevRide(profile, {
          riderId,
          origin,
          destination,
          initiatedBy: 'pilot',
          status: 'offered',
        });
        setCurrentRide(ride);
        return ride;
      }

      const response = await api.post('/api/v1/rides/offer', {
        riderId,
        origin,
        destination,
      });

      const ride = response;
      setCurrentRide(ride);
      return ride;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRide = async (rideId: string) => {
    try {
      if (DEV_MODE) {
        if (currentRide?.id === rideId) {
          const updatedRide: Ride = {
            ...currentRide,
            status: 'confirmed',
            riderConfirmedAt: currentRide.riderConfirmedAt || new Date().toISOString(),
            pilotConfirmedAt: currentRide.pilotConfirmedAt || new Date().toISOString(),
          };
          setCurrentRide(updatedRide);
        }

        return { confirmed: true, waitingForOther: false, status: 'confirmed' };
      }

      const response = await api.patch(`/api/v1/rides/${rideId}/confirm`);
      
      if (currentRide?.id === rideId) {
        setCurrentRide({ ...currentRide, ...response });
      }

      return response;
    } catch (error) {
      console.error('Error confirming ride:', error);
      throw error;
    }
  };

  const startRide = async (rideId: string) => {
    try {
      if (DEV_MODE) {
        if (currentRide?.id === rideId) {
          const startedAt = new Date().toISOString();
          setCurrentRide({ ...currentRide, status: 'active', startedAt });
          return { startedAt };
        }
        return { startedAt: new Date().toISOString() };
      }

      const response = await api.patch(`/api/v1/rides/${rideId}/start`);
      
      if (currentRide?.id === rideId) {
        setCurrentRide({ ...currentRide, status: 'active', startedAt: response.startedAt });
      }

      return response;
    } catch (error) {
      console.error('Error starting ride:', error);
      throw error;
    }
  };

  const endRide = async (rideId: string, endLocation: Location) => {
    try {
      if (DEV_MODE) {
        const tokensAwarded = { rider: 10, pilot: 15 };
        if (currentRide?.id === rideId) {
          const completedRide: Ride = {
            ...currentRide,
            status: 'completed',
            endedAt: new Date().toISOString(),
            tokensAwardedToRider: tokensAwarded.rider,
            tokensAwardedToPilot: tokensAwarded.pilot,
          };
          setRideHistory((prev) => [completedRide, ...prev]);
          setCurrentRide(null);
        }

        return {
          success: true,
          tokensAwarded,
          distance: 8500,
          bonuses: [],
        };
      }

      const response = await api.patch(`/api/v1/rides/${rideId}/end`, {
        endLocation,
      });

      if (currentRide?.id === rideId) {
        setCurrentRide(null); // Clear current ride after completion
      }

      return response;
    } catch (error) {
      console.error('Error ending ride:', error);
      throw error;
    }
  };

  const cancelRide = async (rideId: string) => {
    try {
      if (DEV_MODE) {
        if (currentRide?.id === rideId) {
          setCurrentRide(null);
        }
        return;
      }

      await api.patch(`/api/v1/rides/${rideId}/cancel`);
      
      if (currentRide?.id === rideId) {
        setCurrentRide(null);
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      throw error;
    }
  };

  const getRide = async (rideId: string): Promise<Ride> => {
    try {
      if (DEV_MODE) {
        if (currentRide?.id === rideId) {
          return currentRide;
        }
        const historyRide = rideHistory.find((ride) => ride.id === rideId);
        if (historyRide) {
          return historyRide;
        }
        return buildDevRide(profile, {
          origin: { lat: 12.9716, lng: 77.5946 },
          destination: { lat: 12.9816, lng: 77.6046 },
          initiatedBy: 'rider',
          status: 'completed',
        });
      }

      const response = await api.get(`/api/v1/rides/${rideId}`);
      return response;
    } catch (error) {
      console.error('Error fetching ride:', error);
      throw error;
    }
  };

  const fetchRideHistory = async (role?: 'rider' | 'pilot' | 'both') => {
    try {
      setIsLoading(true);
      if (DEV_MODE) {
        const history = mockRideHistory.map((ride, index) => {
          const pilot = mockPilots[index % mockPilots.length];
          return {
            id: ride.id,
            riderId: profile?.id || 'dev-rider',
            pilotId: pilot.id,
            origin: { lat: 12.9716, lng: 77.5946 },
            destination: { lat: 12.9816, lng: 77.6046 },
            distanceMeters: ride.distance * 1000,
            status: 'completed',
            initiatedBy: 'rider',
            tokensAwardedToRider: ride.tokens,
            tokensAwardedToPilot: ride.tokens + 5,
            createdAt: new Date().toISOString(),
            rider: { id: profile?.id || 'dev-rider', name: profile?.name || 'Dev Rider' },
            pilot: { id: pilot.id, name: pilot.name, rating: pilot.rating },
          } as Ride;
        });
        setRideHistory(history);
        return;
      }

      const params = role ? { role } : {};
      const response = await api.get('/api/v1/rides/history', { params });
      setRideHistory(response);
    } catch (error) {
      console.error('Error fetching ride history:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTelemetry = async (rideId: string, points: any[]) => {
    try {
      if (DEV_MODE) {
        return;
      }

      await api.post(`/api/v1/rides/${rideId}/telemetry`, { points });
    } catch (error) {
      console.error('Error sending telemetry:', error);
      // Don't throw - telemetry is non-critical
    }
  };

  const value = {
    currentRide,
    rideHistory,
    isLoading,
    createNotification,
    createOffer,
    confirmRide,
    startRide,
    endRide,
    cancelRide,
    getRide,
    fetchRideHistory,
    setCurrentRide,
    sendTelemetry,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

