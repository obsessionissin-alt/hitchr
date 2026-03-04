// Type declarations for react-native-maps
declare module 'react-native-maps' {
  import { Component } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps {
    provider?: 'google' | null;
    style?: StyleProp<ViewStyle>;
    region?: Region;
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    onRegionChangeComplete?: (region: Region) => void;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    coordinate: LatLng;
    onPress?: () => void;
    children?: React.ReactNode;
  }

  export interface PolylineProps {
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
  }

  export class MapView extends Component<MapViewProps> {}
  export class Marker extends Component<MarkerProps> {}
  export class Polyline extends Component<PolylineProps> {}
  
  export const PROVIDER_GOOGLE: 'google' | null;
  
  export default MapView;
}



