import { useCallback, useEffect, useMemo, useState } from 'react';
import socket, { connectSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import type { UserMarker } from '../types/userMarker';

export type NotifyStatus = 'sent' | 'accepted' | 'declined';

export interface NotifyPayload {
  fromUserId: string;
  toUserId: string;
  rideRequestId?: string;
  marker?: UserMarker;
  status?: NotifyStatus;
}

interface UseNotifySocketsResult {
  sendNotify: (payload: Omit<NotifyPayload, 'fromUserId'> & { fromUserId?: string }) => Promise<void>;
  acceptNotify: (payload: NotifyPayload) => Promise<void>;
  declineNotify: (payload: NotifyPayload) => Promise<void>;
  incomingNotify: NotifyPayload | null;
  statusUpdate: NotifyPayload | null;
}

export const useNotifySockets = (): UseNotifySocketsResult => {
  const { accessToken, user } = useAuth();
  const { profile } = useUser();
  const [incomingNotify, setIncomingNotify] = useState<NotifyPayload | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<NotifyPayload | null>(null);

  const currentUserId = useMemo(() => profile?.id || user?.id || '', [profile?.id, user?.id]);

  useEffect(() => {
    if (!accessToken) return;
    connectSocket(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const handleReceived = (payload: NotifyPayload) => {
      console.log('[notify] received', payload);
      setIncomingNotify(payload);
    };

    const handleUpdated = (payload: NotifyPayload) => {
      console.log('[notify] updated', payload);
      setStatusUpdate(payload);
    };

    socket.on('notify:received', handleReceived);
    socket.on('notify:updated', handleUpdated);

    return () => {
      socket.off('notify:received', handleReceived);
      socket.off('notify:updated', handleUpdated);
    };
  }, []);

  const emitWithAck = useCallback(
    (event: string, payload: NotifyPayload) =>
      new Promise<void>((resolve, reject) => {
        if (!payload.fromUserId || !payload.toUserId) {
          reject(new Error('Missing user information for notify event'));
          return;
        }

        const token = accessToken || (socket as any).auth?.token;
        if (!token) {
          reject(new Error('Socket is not authenticated'));
          return;
        }

        if (!socket.connected) {
          connectSocket(token);
        }

        socket.timeout(5000).emit(event, payload, (err: unknown, response?: { ok?: boolean; error?: string }) => {
          if (err) {
            reject(err instanceof Error ? err : new Error('Socket emit failed'));
            return;
          }

          if (response?.ok === false) {
            reject(new Error(response.error || 'Socket event failed'));
            return;
          }

          resolve();
        });
      }),
    [accessToken],
  );

  const sendNotify = useCallback(
    async (payload: Omit<NotifyPayload, 'fromUserId'> & { fromUserId?: string }) => {
      const data: NotifyPayload = {
        ...payload,
        fromUserId: payload.fromUserId || currentUserId,
        status: 'sent',
      };
      await emitWithAck('notify:send', data);
    },
    [currentUserId, emitWithAck],
  );

  const acceptNotify = useCallback(
    async (payload: NotifyPayload) => {
      await emitWithAck('notify:accept', { ...payload, fromUserId: currentUserId, status: 'accepted' });
    },
    [currentUserId, emitWithAck],
  );

  const declineNotify = useCallback(
    async (payload: NotifyPayload) => {
      await emitWithAck('notify:decline', { ...payload, fromUserId: currentUserId, status: 'declined' });
    },
    [currentUserId, emitWithAck],
  );

  return {
    sendNotify,
    acceptNotify,
    declineNotify,
    incomingNotify,
    statusUpdate,
  };
};

export default useNotifySockets;

