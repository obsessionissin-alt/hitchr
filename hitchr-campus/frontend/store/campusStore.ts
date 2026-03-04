import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RoutePost {
  id: string;
  pilot_id: string;
  pilot_name: string;
  pilot_college: string;
  from_point: any;
  to_point: any;
  departure_time: string;
  time_window_mins: number;
  seats_available: number;
  total_seats: number;
  distance_km: number;
  duration_mins: number;
  note?: string;
  status: string;
  created_at: string;
}

interface JoinRequest {
  id: string;
  route_id: string;
  rider_id: string;
  rider_name: string;
  rider_college: string;
  pickup: any;
  dropoff: any;
  status: string;
  requested_at: string;
}

interface RideInstance {
  id: string;
  route_id: string;
  pilot_id: string;
  pilot_name: string;
  rider_id: string;
  rider_name: string;
  status: string;
  shared_distance_km: number;
  suggested_contribution: number;
  contribution_status: string;
  actual_contribution: number;
}

interface CampusUser {
  id: string;
  name: string;
  college: string;
  email?: string;
  campus_verified: boolean;
  role: 'rider' | 'pilot';
  badges: string[];
}

interface CampusStore {
  user: CampusUser | null;
  userRole: 'rider' | 'pilot';
  
  // Data
  routes: RoutePost[];
  myRoutes: RoutePost[];
  joinRequests: JoinRequest[];
  myRequests: JoinRequest[];
  activeRides: RideInstance[];
  
  // Actions
  setUser: (user: CampusUser) => Promise<void>;
  toggleRole: () => Promise<void>;
  setRoutes: (routes: RoutePost[]) => void;
  setMyRoutes: (routes: RoutePost[]) => void;
  setJoinRequests: (requests: JoinRequest[]) => void;
  setMyRequests: (requests: JoinRequest[]) => void;
  setActiveRides: (rides: RideInstance[]) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useCampusStore = create<CampusStore>((set, get) => ({
  user: null,
  userRole: 'rider',
  routes: [],
  myRoutes: [],
  joinRequests: [],
  myRequests: [],
  activeRides: [],
  
  setUser: async (user: CampusUser) => {
    await AsyncStorage.setItem('campus_user', JSON.stringify(user));
    set({ user, userRole: user.role });
  },
  
  toggleRole: async () => {
    const { user } = get();
    if (!user) return;
    
    const newRole = user.role === 'rider' ? 'pilot' : 'rider';
    const updatedUser = { ...user, role: newRole };
    await AsyncStorage.setItem('campus_user', JSON.stringify(updatedUser));
    set({ user: updatedUser, userRole: newRole });
  },
  
  setRoutes: (routes) => set({ routes }),
  setMyRoutes: (routes) => set({ myRoutes: routes }),
  setJoinRequests: (requests) => set({ joinRequests: requests }),
  setMyRequests: (requests) => set({ myRequests: requests }),
  setActiveRides: (rides) => set({ activeRides: rides }),
  
  logout: async () => {
    await AsyncStorage.removeItem('campus_user');
    set({ user: null, userRole: 'rider', routes: [], myRoutes: [], joinRequests: [], myRequests: [], activeRides: [] });
  },
  
  loadUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('campus_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        set({ user, userRole: user.role });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  },
}));
