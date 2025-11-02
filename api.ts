import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add JWT token to all requests
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const response = await this.client.post('/auth/refresh-token');
            const { token } = response.data;

            // Store new token
            await AsyncStorage.setItem('authToken', token);

            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${token}`;

            // Retry original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear auth and redirect to login
            await AsyncStorage.multiRemove(['authToken', 'user']);
            // The AuthContext will handle navigation
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          console.error('Request timeout');
          return Promise.reject(new Error('Request timeout. Please try again.'));
        }

        if (!error.response) {
          console.error('Network error');
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Return structured error
        // return Promise.reject({
        //   message: error.response?.data?.message || error.message || 'An error occurred',
        //   status: error.response?.status,
        //   data: error.response?.data,
        // });
        return Promise.reject({ message: 'Network error. Please check your connection.' });
      }
    );
  }

  // GET request
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Set auth token manually (used after login)
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Clear auth token (used on logout)
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Get axios instance (for advanced usage)
  getClient(): AxiosInstance {
    return this.client;
  }

  // Auth endpoints
  async verifyToken(firebaseToken: string) {
    return this.post('/auth/verify-token', { firebaseToken });
  }

  async requestOTP(phone: string) {
    return this.post('/auth/request-otp', { phone });
  }

  async verifyOTP(phone: string, otp: string) {
    return this.post('/auth/verify-otp', { phone, otp });
  }

  // User endpoints
  async getMe() {
    return this.get('/users/me');
  }

  async updateProfile(data: any) {
    return this.patch('/users/me', data);
  }

  // Pilot endpoints
  async updateLocation(location: { latitude: number; longitude: number }) {
    return this.post('/pilot/location', {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  async getNearbyPilots(latitude: number, longitude: number, radius: number = 2000) {
    return this.get(`/nearby/pilots?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  // Ride endpoints
  async notifyRide(rideData: {
    pilotId: string;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  }) {
    return this.post('/rides/notify', {
      pilotId: rideData.pilotId,
      origin: {
        lat: rideData.origin.latitude,
        lng: rideData.origin.longitude,
      },
      destination: {
        lat: rideData.destination.latitude,
        lng: rideData.destination.longitude,
      },
    });
  }

  async getRide(rideId: string) {
    return this.get(`/rides/${rideId}`);
  }

  async confirmRide(rideId: string) {
    return this.patch(`/rides/${rideId}/confirm`);
  }

  async startRide(rideId: string) {
    return this.patch(`/rides/${rideId}/start`);
  }

  async endRide(rideId: string) {
    return this.patch(`/rides/${rideId}/end`);
  }

  async sendTelemetry(rideId: string, telemetryData: any) {
    return this.post(`/rides/${rideId}/telemetry`, telemetryData);
  }

  // Token endpoints
  async getTokens() {
    return this.get('/tokens/me');
  }
}

export default new ApiService();