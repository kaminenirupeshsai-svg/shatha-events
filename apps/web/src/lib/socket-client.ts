'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NotificationDto } from '@app/shared';
import { useAuthStore } from './auth-store';
import { queryKeys } from './query-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(token: string | null): Socket | null {
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socket.auth && (socket.auth as { token?: string }).token === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

/**
 * Connects the socket once authenticated, listens for real-time booking and
 * notification events, invalidates the relevant React Query caches, and
 * surfaces a toast. Mount once near the root of the authenticated app shell.
 */
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const activeSocket = getSocket(accessToken);
    if (!activeSocket) return;

    function handleStatusChanged(payload: { bookingId: string; status: string }) {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.info(`Booking status updated to "${payload.status.replace('_', ' ')}"`);
    }

    function handleNotification(payload: { notification: NotificationDto }) {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      toast.message(payload.notification.message);
    }

    activeSocket.on('booking:status-changed', handleStatusChanged);
    activeSocket.on('notification:new', handleNotification);

    return () => {
      activeSocket.off('booking:status-changed', handleStatusChanged);
      activeSocket.off('notification:new', handleNotification);
    };
  }, [accessToken, queryClient]);
}
