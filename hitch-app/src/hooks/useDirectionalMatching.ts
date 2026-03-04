import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { UserMarker } from '../types/userMarker';
import { DEMO_MODE } from '../constants/config';

const getPollingInterval = () => Math.floor(Math.random() * 2000) + 5000;

// Simple haversine distance in meters
const distanceMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
};

const minDistanceToRoute = (
  point: { latitude: number; longitude: number },
  route: Array<{ latitude: number; longitude: number }>
) => {
  if (!route.length) return Infinity;
  let min = Infinity;
  for (const r of route) {
    const d = distanceMeters(point, r);
    if (d < min) min = d;
  }
  return min;
};

interface UseDirectionalMatchingParams {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  radius?: number;
  withMocks?: boolean;
  autoRefresh?: boolean;
}

export function useDirectionalMatching(params: UseDirectionalMatchingParams) {
  const {
    origin,
    destination,
    routeCoordinates = [],
    radius = 5000,
    withMocks = true,
    autoRefresh = true,
  } = params;

  const [data, setData] = useState<UserMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchMatches = useCallback(async () => {
    if (!origin || !destination) return;

    try {
      setLoading(true);
      setError(null);

      // DEMO MODE: If enabled, fetch all nearby users and lightly filter to route
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Fetching nearby users (soft route filter)');
        const nearbyResponse = await api.getNearbyUsers({
          lat: origin.latitude,
          lng: origin.longitude,
          radius,
          withMocks,
        });
        
        if (!isMounted.current) return;
        
        const allUsers: any[] = Array.isArray(nearbyResponse) ? nearbyResponse : [];

        // Apply a soft route filter so only users near the rider's path/destination show up
        const route = routeCoordinates.length ? routeCoordinates : [];
        const ROUTE_RADIUS = 300; // meters from polyline
        const DEST_RADIUS = 600; // meters to destination

        const filtered = allUsers.filter((u) => {
          if (!u.latitude || !u.longitude) return false;
          const userPoint = { latitude: u.latitude, longitude: u.longitude };
          const distToRoute = route.length ? minDistanceToRoute(userPoint, route) : Infinity;
          const distToDest = distanceMeters(userPoint, destination);

          // Keep if on/near route or close to destination
          return distToRoute <= ROUTE_RADIUS || distToDest <= DEST_RADIUS;
        });

        // Sort by whichever is smaller: distance to route or to destination
        const sorted = filtered.sort((a, b) => {
          const pa = { latitude: a.latitude, longitude: a.longitude };
          const pb = { latitude: b.latitude, longitude: b.longitude };
          const aScore = Math.min(
            route.length ? minDistanceToRoute(pa, route) : Infinity,
            distanceMeters(pa, destination)
          );
          const bScore = Math.min(
            route.length ? minDistanceToRoute(pb, route) : Infinity,
            distanceMeters(pb, destination)
          );
          return aScore - bScore;
        });

        console.log(`🎭 DEMO MODE: Showing ${sorted.length} users near the route/destination`);
        setData(sorted as UserMarker[]);
        return;
      }

      // Real matching logic
      const payload = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        riderRoute: routeCoordinates.map((pt) => ({
          lat: pt.latitude,
          lng: pt.longitude,
        })),
        radius,
        withMocks,
      };

      const response = await api.getMatchedPilots(payload);

      if (!isMounted.current) return;

      if (response?.pilots && Array.isArray(response.pilots)) {
        setData(response.pilots);
      } else {
        setData([]);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || 'Failed to load matches');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [origin, destination, routeCoordinates, radius, withMocks]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!origin || !destination) {
      setData([]);
      return;
    }
    fetchMatches();
  }, [origin, destination, fetchMatches]);

  useEffect(() => {
    if (!autoRefresh || !origin || !destination) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const interval = getPollingInterval();
    pollingRef.current = setInterval(() => {
      fetchMatches();
    }, interval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [autoRefresh, origin, destination, fetchMatches]);

  return {
    data,
    loading,
    error,
    refresh: fetchMatches,
  };
}

export default useDirectionalMatching;


