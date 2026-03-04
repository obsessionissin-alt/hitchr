// src/constants/config.ts

// Read from environment variable
// For web development, use localhost. For mobile, use your local IP
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Check if running on web (browser)
  if (typeof window !== 'undefined' && window.location) {
    // Running on web - use localhost
    return 'http://localhost:3000/api/v1';
  }
  
  // Running on mobile (React Native) - use local network IP
  // Find your IP: hostname -I (Linux) or ipconfig (Windows) or ifconfig (Mac)
  // IMPORTANT: Update this IP to match your computer's local network IP
  // Both your phone and computer must be on the same WiFi network
  return 'http://192.168.1.52:3000/api/v1';
};

export const API_URL = getApiUrl();

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const devModeEnv = process.env.EXPO_PUBLIC_DEV_MODE;
export const DEV_MODE = devModeEnv ? devModeEnv === 'true' : true;

// Firebase Configuration
// Get these values from your Firebase Console > Project Settings > Your Apps
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDevelopmentKeyForTesting123456789',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'hitch-dev.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'hitch-dev',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hitch-dev.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Other config constants
export const DEFAULT_RADIUS = 5000; // meters
export const MIN_RIDE_DISTANCE = 500; // meters
export const OTP_LENGTH = 6;

// Demo mode: include mock pilots/riders from backend
export const WITH_MOCKS = true;

// DEMO MODE: When true, bypasses route filtering and enables auto-progression for smooth demo flow
// Set to false to use real matching logic
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || true; // Default to true for demo

export default {
  API_URL,
  SOCKET_URL,
  MAPBOX_ACCESS_TOKEN,
  DEV_MODE,
  FIREBASE_CONFIG,
  DEFAULT_RADIUS,
  MIN_RIDE_DISTANCE,
  OTP_LENGTH,
  DEMO_MODE,
};