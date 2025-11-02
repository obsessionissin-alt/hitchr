// User types
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'rider' | 'pilot' | 'both';
  avatar?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  tokensBalance?: number;
  stats: {
    totalRides: number;
    completedRides: number;
    totalKm: number;
    rating: number;
    trustScore: number;
  };
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Pilot types
export interface Pilot {
  id: string;
  name: string;
  avatar?: string;
  vehicle?: {
    type: string;
    model: string;
    plateNumber: string;
  };
  location: Location;
  rating: number;
  trustScore: number;
  totalRides: number;
  isOnline: boolean;
}

// Ride types
export interface Ride {
  id: string;
  riderId: string;
  pilotId?: string;
  origin: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'pending' | 'accepted' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  distanceMeters?: number;
  tokensAwarded?: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

// Token types
export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'bonus' | 'penalty';
  category?: string;
  source?: string;
  rideId?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}