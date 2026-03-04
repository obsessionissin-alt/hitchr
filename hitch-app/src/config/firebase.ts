// src/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../constants/config';

// Initialize Firebase only if not already initialized
// This prevents duplicate initialization errors
const getOrInitializeApp = () => {
  try {
    return getApp();
  } catch {
    return initializeApp(FIREBASE_CONFIG);
  }
};

const app = getOrInitializeApp();

export const auth = getAuth(app);

export default app;
