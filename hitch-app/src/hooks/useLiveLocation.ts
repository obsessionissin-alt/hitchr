import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

type LiveLocationOptions = {
  enabled?: boolean;
  isPilotAvailable?: boolean;
  isRiderAvailable?: boolean;
  intervalMs?: number; // fallback if randomization not wanted
};

type LiveLocationState = {
  lat: number;
  lng: number;
  timestamp: number;
} | null;

const randomInterval = () => Math.floor(Math.random() * 2000) + 4000; // 4–6s

/**
 * Continuously captures browser geolocation and pushes it to the backend
 * so other users appear via /nearby. Web-first; mobile compatible later.
 */
export function useLiveLocation(options: LiveLocationOptions = {}) {
  const { enabled = true, isPilotAvailable, isRiderAvailable, intervalMs } = options;
  const [lastLocation, setLastLocation] = useState<LiveLocationState>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = useCallback(
    async (lat: number, lng: number) => {
      try {
        await api.post('/location/update', {
          lat,
          lng,
          isPilotAvailable,
          isRiderAvailable,
        });
      } catch (err: any) {
        console.warn('Failed to push live location', err?.message || err);
      }
    },
    [isPilotAvailable, isRiderAvailable],
  );

  const captureAndSend = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not available in this environment');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setError(null);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLastLocation({ lat, lng, timestamp: Date.now() });
        sendLocation(lat, lng);
      },
      (geoError) => {
        setError(geoError.message || 'Failed to get location');
      },
      {
        enableHighAccuracy: false,
        maximumAge: 2000,
        timeout: 5000,
      },
    );
  }, [sendLocation]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Immediate push on mount
    captureAndSend();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const tickInterval = intervalMs ?? randomInterval();
    intervalRef.current = setInterval(() => {
      captureAndSend();
    }, tickInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [captureAndSend, enabled, intervalMs]);

  return { lastLocation, error };
}

export default useLiveLocation;













