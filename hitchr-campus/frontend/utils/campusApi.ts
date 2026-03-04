import axios from 'axios';

// Use same-origin for deployed preview, localhost for dev
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

export const campusUserAPI = {
  create: (data: any) => api.post('/users', data),
  get: (userId: string) => api.get(`/users/${userId}`),
  toggleRole: (userId: string, role: string) => api.patch(`/users/${userId}/role?role=${role}`),
};

export const campusRouteAPI = {
  getAll: (status?: string, destination?: string) => api.get('/routes', { params: { status, destination } }),
  get: (routeId: string) => api.get(`/routes/${routeId}`),
  create: (data: any) => api.post('/routes', data),
  getByPilot: (pilotId: string) => api.get(`/routes/pilot/${pilotId}`),
  updateStatus: (routeId: string, status: string) => api.patch(`/routes/${routeId}/status?status=${status}`),
};

export const campusJoinRequestAPI = {
  create: (data: any) => api.post('/join-requests', data),
  getByRoute: (routeId: string, status?: string) => api.get(`/join-requests/route/${routeId}`, { params: { status } }),
  getByRider: (riderId: string) => api.get(`/join-requests/rider/${riderId}`),
  respond: (requestId: string, action: 'accept' | 'decline') => api.patch(`/join-requests/${requestId}/respond?action=${action}`),
};

export const campusRideAPI = {
  getByRider: (riderId: string) => api.get(`/rides/rider/${riderId}`),
  getByPilot: (pilotId: string) => api.get(`/rides/pilot/${pilotId}`),
  get: (rideId: string) => api.get(`/rides/${rideId}`),
  start: (rideId: string) => api.patch(`/rides/${rideId}/start`),
  complete: (rideId: string) => api.patch(`/rides/${rideId}/complete`),
};

export const campusContributionAPI = {
  submit: (data: any) => api.post('/contributions', data),
};

export const campusPlannedTripAPI = {
  create: (data: any) => api.post('/planned-trips', data),
  getAll: () => api.get('/planned-trips'),
  getByCommunity: (communityId: string) => api.get(`/communities/${communityId}/planned-trips`),
};

export const campusMemoryAPI = {
  create: (data: any) => api.post('/memories', data),
  getAll: () => api.get('/memories'),
  getByCommunity: (communityId: string) => api.get(`/communities/${communityId}/memories`),
};

export const campusCommunityAPI = {
  getAll: () => api.get('/communities'),
};

export const campusSeedAPI = {
  seed: () => api.post('/seed-campus'),
};
