import { useCallback, useState } from 'react';
import { fetchRoute, RouteResult } from '../services/routeService';

interface UseRouteGenerationParams {
  origin: { latitude: number; longitude: number } | null;
}

export function useRouteGeneration({ origin }: UseRouteGenerationParams) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoute = useCallback(
    async (dest: { latitude: number; longitude: number }) => {
      if (!origin) {
        setError('Current location not available');
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchRoute(origin, dest);
        setRoute(result);
        setDestination(dest);
        return result;
      } catch (err: any) {
        const message = err?.message || 'Failed to generate route';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [origin]
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setDestination(null);
    setError(null);
  }, []);

  return {
    route,
    destination,
    loading,
    error,
    generateRoute,
    clearRoute,
  };
}

export default useRouteGeneration;


