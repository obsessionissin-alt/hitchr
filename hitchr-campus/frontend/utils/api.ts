import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

// API Methods
export const userAPI = {
  create: (data: { name: string; phone?: string }) => api.post('/users', data),
  get: (userId: string) => api.get(`/users/${userId}`),
};

export const rideAPI = {
  getAll: (status?: string) => api.get('/rides', { params: { status } }),
  get: (rideId: string) => api.get(`/rides/${rideId}`),
  create: (data: any) => api.post('/rides', data),
  join: (rideId: string, data: any) => api.post(`/rides/${rideId}/join`, data),
  complete: (rideId: string, data: any) => api.post(`/rides/${rideId}/complete`, data),
};

export const paymentAPI = {
  simulate: (data: any) => api.post('/payments/simulate', data),
};

export const communityAPI = {
  getAll: () => api.get('/communities'),
  create: (data: any) => api.post('/communities', data),
};

export const seedAPI = {
  seed: () => api.post('/seed'),
};
