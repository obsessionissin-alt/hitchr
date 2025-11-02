import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ride, Location } from '../types';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface RideContextType {
  currentRide: Ride | null;
  isLoading: boolean;
  notifyPilot: (pilotId: string, origin: Location, destination: Location) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const notifyPilot = async (
    pilotId: string,
    origin: Location,
    destination: Location
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      await apiService.notifyRide({
        // riderId: user.id,
        pilotId,
        origin,
        destination,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RideContext.Provider
      value={{
        currentRide,
        isLoading,
        notifyPilot,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within RideProvider');
  }
  return context;
};