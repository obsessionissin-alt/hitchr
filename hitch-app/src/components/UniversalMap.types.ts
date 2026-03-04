// src/components/UniversalMap.types.ts
// Shared types for the Mapbox-based universal map component

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  label?: string;
  title?: string;
}

export interface MapRouteData {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  color?: string;
  width?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface UniversalMapProps {
  /** Custom styles for the map container */
  style?: any;
  
  /** Center coordinates of the map */
  center?: {
    latitude: number;
    longitude: number;
  };
  
  /** Zoom level (default: 13) */
  zoom?: number;
  
  /** Array of markers to display on the map */
  markers?: MapMarkerData[];
  
  /** Array of routes/polylines to display on the map */
  routes?: MapRouteData[];
  
  /** Callback when a marker is pressed */
  onMarkerPress?: (markerId: string) => void;
  
  /** Show user's current location on the map */
  showUserLocation?: boolean;
  
  /** Callback when the map region changes */
  onRegionChange?: (region: MapRegion) => void;
}
