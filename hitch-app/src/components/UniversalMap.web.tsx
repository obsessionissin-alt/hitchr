// src/components/UniversalMap.web.tsx
// Web Mapbox GL JS implementation

import React, { useEffect, useRef, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { UniversalMapProps, MapMarkerData } from './UniversalMap.types';
import { MAPBOX_ACCESS_TOKEN } from '../constants/config';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// Check if we have a valid token
const hasValidToken = Boolean(MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN.startsWith('pk.'));

// Default center (Bangalore, India)
const DEFAULT_CENTER = { latitude: 12.9716, longitude: 77.5946 };

// Create marker DOM element
const createMarkerElement = (
  marker: MapMarkerData,
  onClick?: (id: string) => void
): HTMLDivElement => {
  // Create wrapper to handle positioning correctly
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '36px';
  wrapper.style.height = '36px';

  const el = document.createElement('div');
  el.style.backgroundColor = marker.color || '#f97316';
  el.style.width = '36px';
  el.style.height = '36px';
  el.style.borderRadius = '18px';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.25)';
  el.style.border = '3px solid white';
  el.style.cursor = 'pointer';
  el.style.transition = 'box-shadow 0.15s ease-out';
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';

  const label = document.createElement('span');
  label.style.color = '#ffffff';
  label.style.fontSize = '14px';
  label.style.fontWeight = '700';
  label.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  label.style.userSelect = 'none';
  label.textContent = marker.label || '•';
  el.appendChild(label);

  // Hover effect - use box-shadow instead of transform to avoid position issues
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.35)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.25)';
  });

  // Click handler
  if (onClick) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(marker.id);
    });
  }

  wrapper.appendChild(el);
  return wrapper;
};

const UniversalMap: React.FC<UniversalMapProps> = ({
  style,
  center,
  zoom = 13,
  markers = [],
  routes = [],
  onMarkerPress,
  showUserLocation = true, // Enable by default
  onRegionChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);

  // Show fallback UI if no valid token
  if (!hasValidToken) {
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: 24,
      textAlign: 'center' as const,
      ...style,
    };

    return (
      <div style={containerStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
          Mapbox Token Required
        </div>
        <div style={{ fontSize: 14, color: '#64748b', maxWidth: 300 }}>
          Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.
          Get your free token at{' '}
          <a 
            href="https://account.mapbox.com/access-tokens/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3b82f6' }}
          >
            mapbox.com
          </a>
        </div>
        {markers.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            {markers.length} markers ready to display
          </div>
        )}
      </div>
    );
  }

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapCenter = center || DEFAULT_CENTER;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [mapCenter.longitude, mapCenter.latitude],
      zoom,
      attributionControl: true,
      logoPosition: 'bottom-right',
    });

    // Add navigation controls
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    // Add geolocate control if user location is enabled
    if (showUserLocation) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
      });
      map.addControl(geolocate, 'top-right');
      geolocateControlRef.current = geolocate;
      
      // Trigger geolocate after map loads
      map.on('load', () => {
        geolocate.trigger();
      });
    }

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo({
        center: [center.longitude, center.latitude],
        zoom,
        duration: 500,
      });
    }
  }, [center?.latitude, center?.longitude, zoom]);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const el = createMarkerElement(markerData, onMarkerPress);
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(mapRef.current!);

      // Add popup if title exists
      if (markerData.title) {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: true,
        }).setText(markerData.title);
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerPress]);

  // Add routes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Wait for map to load
    const addRoutes = () => {
      routes.forEach((route) => {
        const sourceId = `route-${route.id}`;
        const layerId = `route-layer-${route.id}`;

        // Remove existing route if present
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // Add route source and layer
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates.map((coord) => [
                coord.longitude,
                coord.latitude,
              ]),
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': route.color || '#f59e0b',
            'line-width': route.width || 4,
          },
        });
      });
    };

    if (map.loaded()) {
      addRoutes();
    } else {
      map.on('load', addRoutes);
    }
  }, [routes]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...style,
  };

  return <div ref={containerRef} style={containerStyle} />;
};

export default memo(UniversalMap);
