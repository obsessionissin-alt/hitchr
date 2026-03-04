// src/contexts/SocketContext.tsx
// Socket context - disabled in DEV_MODE to avoid Hermes engine issues
import React, { createContext, useContext, ReactNode } from 'react';
import { DEV_MODE } from '../constants/config';

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Simple provider that does nothing in DEV_MODE
// This completely avoids loading socket.io-client which causes Hermes issues
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  // In DEV_MODE, provide a no-op socket context
  const value: SocketContextType = {
    socket: null,
    isConnected: false,
    emit: (event: string, data: any) => {
      if (!DEV_MODE) {
        console.warn('Socket not connected - cannot emit:', event);
      }
    },
    on: (event: string, handler: (...args: any[]) => void) => {
      // No-op in dev mode
    },
    off: (event: string, handler?: (...args: any[]) => void) => {
      // No-op in dev mode
    },
  };

  // Only load socket.io in production mode
  // For now, always use the simple provider to avoid the NONE error
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
