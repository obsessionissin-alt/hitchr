import { create } from 'zustand';

interface Waypoint {
  lat: number;
  lng: number;
  address: string;
  name: string;
}

interface RideRoute {
  origin: Waypoint;
  destination: Waypoint;
  waypoints?: Waypoint[];
  distance_km: number;
  duration_mins: number;
}

interface Rider {
  user_id: string;
  name: string;
  pickup: Waypoint;
  dropoff: Waypoint;
  joined_at: string;
  status: string;
}

interface Ride {
  id: string;
  pilot_id: string;
  pilot_name: string;
  route: RideRoute;
  status: string;
  riders: Rider[];
  max_riders: number;
  departure_time?: string;
  vehicle_type: string;
  created_at: string;
  description?: string;
}

interface RideStore {
  rides: Ride[];
  selectedRide: Ride | null;
  currentRide: Ride | null;
  setRides: (rides: Ride[]) => void;
  setSelectedRide: (ride: Ride | null) => void;
  setCurrentRide: (ride: Ride | null) => void;
  updateRide: (ride: Ride) => void;
}

export const useRideStore = create<RideStore>((set) => ({
  rides: [],
  selectedRide: null,
  currentRide: null,
  
  setRides: (rides) => set({ rides }),
  
  setSelectedRide: (ride) => set({ selectedRide: ride }),
  
  setCurrentRide: (ride) => set({ currentRide: ride }),
  
  updateRide: (updatedRide) => set((state) => ({
    rides: state.rides.map(r => r.id === updatedRide.id ? updatedRide : r),
    selectedRide: state.selectedRide?.id === updatedRide.id ? updatedRide : state.selectedRide,
    currentRide: state.currentRide?.id === updatedRide.id ? updatedRide : state.currentRide,
  })),
}));
