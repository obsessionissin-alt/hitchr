// src/services/socket.ts
// Socket service is disabled in the current demo build to avoid native crashes
// Once the backend real-time features are ready, replace this file with a real implementation

class SocketService {
  async connect() {
    console.log('Socket service disabled in demo build');
  }

  isConnected(): boolean {
    return false;
  }

  disconnect() {
    // no-op
  }

  emit() {
    // no-op
  }

  on() {
    // no-op
  }

  off() {
    // no-op
  }
}

export default new SocketService();