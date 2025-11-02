import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../constants/config';

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<void> {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('No access token found');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
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