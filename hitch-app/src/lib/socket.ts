import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../constants/config';

// Derive a base URL that works for both API and sockets
const API_BASE_URL = SOCKET_URL || API_URL.replace(/\/api\/v1$/, '');

// Shared Socket.IO client configured for web + mobile
const socket: Socket = io(API_BASE_URL, {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  forceNew: false,
  withCredentials: true,
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Basic diagnostics to help during development
socket.on('connect', () => {
  console.log('✅ Socket connected', socket.id);
});

socket.on('connect_error', (error) => {
  console.warn('⚠️ Socket connect_error', error.message);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('♻️  Socket reconnect attempt', attempt);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Socket reconnect failed');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

export const connectSocket = (token?: string | null) => {
  if (token) {
    socket.auth = { ...(socket as any).auth, token };
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export { API_BASE_URL, socket };
export default socket;













