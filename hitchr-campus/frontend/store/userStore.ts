import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phone?: string;
  badges: string[];
  trust_score: number;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: async (user: User) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  
  loadUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  },
}));
