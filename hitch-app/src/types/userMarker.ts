// src/types/userMarker.ts
// Normalized marker structure for nearby users (unified for pilots and riders)

export interface UserMarker {
  id: string;
  name: string;
  role: 'pilot' | 'rider';
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  is_mock: boolean;
  distance?: number;
  heading?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  matchScore?: number;
  metrics?: {
    overlapMeters?: number;
    bearingDiff?: number;
    detourMeters?: number;
  };
  // Additional fields for display
  rating?: number;
  total_rides?: number;
  total_km?: number;
  vehicle_type?: string;
  plate_number?: string;
}

export interface NearbyUsersResponse {
  data: UserMarker[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface NearbyUsersFilters {
  showPilots: boolean;
  showRiders: boolean;
  maxDistance: number;
}

