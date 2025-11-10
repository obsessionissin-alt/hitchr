import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../constants/config';

class SocketService {
  private socket: Socket | null = null;

  async connect(token?: string): Promise<void> {
    // Get token from parameter or storage
    const authToken = token || await AsyncStorage.getItem('@auth_token');
    
    if (!authToken) {
      console.warn('No access token found for socket connection');
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: any) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: any) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();