// src/constants/config.ts

// Read from environment variable
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

// Other config constants
export const DEFAULT_RADIUS = 2000; // meters
export const MIN_RIDE_DISTANCE = 500; // meters
export const OTP_LENGTH = 6;

export default {
  API_URL,
  SOCKET_URL,
  MAPBOX_ACCESS_TOKEN,
  DEFAULT_RADIUS,
  MIN_RIDE_DISTANCE,
  OTP_LENGTH,
};