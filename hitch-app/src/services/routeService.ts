import { MAPBOX_ACCESS_TOKEN } from '../constants/config';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RoutePoint[];
  distance: number; // meters
  duration: number; // seconds
}

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';
const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

const ensureToken = () => {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error('Missing Mapbox access token. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.');
  }
};

export async function fetchRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<RouteResult> {
  ensureToken();

  const url = `${DIRECTIONS_BASE}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?alternatives=false&geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !data?.routes?.length) {
    throw new Error(data?.message || 'Failed to fetch route');
  }

  const route = data.routes[0];
  const coordinates: RoutePoint[] = (route.geometry.coordinates || []).map(
    ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
  );

  return {
    coordinates,
    distance: route.distance,
    duration: route.duration,
  };
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

export interface GeocodeCandidate extends GeocodeResult {
  distance: number;
}

const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export async function geocodePlaceCandidates(
  query: string,
  proximity: { latitude: number; longitude: number },
  options?: {
    countryCode?: string | null;
    radiusMeters?: number;
    mapBounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
    limit?: number;
  }
): Promise<GeocodeCandidate[]> {
  ensureToken();

  if (!proximity || !proximity.latitude || !proximity.longitude) {
    throw new Error('Proximity location is required for accurate geocoding');
  }

  const { countryCode = 'IN', radiusMeters = 30000, mapBounds, limit = 5 } = options || {};
  const encoded = encodeURIComponent(query);

  // Detect if this is a city/place search (simple queries like "dehradun")
  const isCitySearch = query.toLowerCase().trim().split(/\s+/).length <= 2;

  // Build bbox (expanded aggressively to catch POIs)
  let bbox = '';
  if (mapBounds && mapBounds.minLat && mapBounds.maxLat && mapBounds.minLng && mapBounds.maxLng) {
    if (mapBounds.minLng < mapBounds.maxLng && mapBounds.minLat < mapBounds.maxLat) {
      const latExpand = (mapBounds.maxLat - mapBounds.minLat) * 2;
      const lngExpand = (mapBounds.maxLng - mapBounds.minLng) * 2;
      bbox = `&bbox=${mapBounds.minLng - lngExpand},${mapBounds.minLat - latExpand},${mapBounds.maxLng + lngExpand},${mapBounds.maxLat + latExpand}`;
    }
  }
  if (!bbox) {
    const baseRadius = 30000;
    const radius = Math.max(10000, Math.min(radiusMeters, baseRadius));
    const latRadiusDeg = radius / 111000;
    const lngRadiusDeg = radius / (111000 * Math.max(0.1, Math.cos((proximity.latitude * Math.PI) / 180)));
    bbox = `&bbox=${proximity.longitude - lngRadiusDeg},${proximity.latitude - latRadiusDeg},${proximity.longitude + lngRadiusDeg},${proximity.latitude + latRadiusDeg}`;
  }

  const proximityParam = `&proximity=${proximity.longitude},${proximity.latitude}`;
  const countryParam = countryCode ? `&country=${countryCode}` : '';
  const typesParam = '&types=address,poi,neighborhood,locality,place,district,region';
  const typesLimit = `&limit=${Math.max(limit, 5)}`;

  const url = `${GEOCODE_BASE}/${encoded}.json?${typesParam}${typesLimit}${proximityParam}${countryParam}${bbox}&access_token=${MAPBOX_ACCESS_TOKEN}`;
  console.log('🌐 Geocoding URL:', url.replace(MAPBOX_ACCESS_TOKEN, 'TOKEN_HIDDEN'));

  const fetchFeatures = async (u: string) => {
    const resp = await fetch(u);
    const data = await resp.json();
    if (!resp.ok) {
      console.error('❌ Geocoding API error:', data);
      throw new Error(data?.message || `Geocoding failed: ${resp.status} ${resp.statusText}`);
    }
    return Array.isArray(data?.features) ? data.features : [];
  };

  let features = await fetchFeatures(url);
  console.log(`📍 Found ${features.length} features in initial search`);

  if (!features.length) {
    const fallbackUrl = `${GEOCODE_BASE}/${encoded}.json?${typesParam}${typesLimit}${proximityParam}${countryParam}&access_token=${MAPBOX_ACCESS_TOKEN}`;
    console.log('🔄 Trying fallback search without bbox...');
    console.log('🌐 Fallback URL:', fallbackUrl.replace(MAPBOX_ACCESS_TOKEN, 'TOKEN_HIDDEN'));
    features = await fetchFeatures(fallbackUrl);
  }

  if (!features.length) return [];

  const MAX_DISTANCE = isCitySearch ? 50000 : 30000;
  const scored = features
    .map((f: any) => {
      if (!Array.isArray(f.center) || f.center.length < 2) return null;
      const dist = distanceMeters(
        proximity,
        { latitude: f.center[1], longitude: f.center[0] }
      );
      const relevance = f.relevance || 0.5;
      const score = (1 / (1 + dist / 1000)) * 0.7 + relevance * 0.3;
      return { feature: f, distance: dist, score };
    })
    .filter((x: any): x is { feature: any; distance: number; score: number } => x !== null)
    .filter(f => f.distance <= MAX_DISTANCE)
    .sort((a, b) => {
      if (Math.abs(a.distance - b.distance) > 500) return a.distance - b.distance;
      return b.score - a.score;
    })
    .slice(0, limit);

  console.log('📍 Candidates:', scored.map(s => `${s.feature.place_name} (${Math.round(s.distance / 1000)}km)`));

  return scored.map((s) => ({
    name: s.feature.place_name,
    longitude: s.feature.center[0],
    latitude: s.feature.center[1],
    distance: s.distance,
  }));
}

// Backwards-compatible helper: return best candidate or null
export async function geocodePlace(
  query: string,
  proximity?: { latitude: number; longitude: number },
  countryCode: string | null = 'IN',
  radiusMeters: number = 30000,
  mapBounds?: { 
    minLat: number; 
    maxLat: number; 
    minLng: number; 
    maxLng: number 
  }
): Promise<GeocodeResult | null> {
  if (!proximity) return null;
  const candidates = await geocodePlaceCandidates(query, proximity, {
    countryCode,
    radiusMeters,
    mapBounds,
    limit: 5,
  });
  return candidates[0] || null;
}

