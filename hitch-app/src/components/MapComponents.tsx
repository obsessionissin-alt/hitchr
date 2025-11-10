// src/components/MapComponents.tsx
// This file is only imported on native platforms
// On web, Metro will automatically use MapComponents.web.tsx

import { Platform } from 'react-native';

// Only import react-native-maps on native platforms
// Metro's platform resolution should prevent this from being bundled on web
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  }
} catch (e) {
  // react-native-maps not available (e.g., on web)
  console.log('react-native-maps not available on this platform');
}

export { MapView, Marker, PROVIDER_GOOGLE };

