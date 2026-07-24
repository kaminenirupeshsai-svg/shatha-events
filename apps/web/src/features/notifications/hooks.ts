'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NotificationDto, NotificationListQuery } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';
import type { Paginated } from '@/features/services/hooks';

export function useNotifications(query: Partial<NotificationListQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(query),
    queryFn: () =>
      apiClient.get<Paginated<NotificationDto>>(`${endpoints.notifications.list}${toQueryString(query)}`),
    refetchInterval: 60_000,
  });
}

// The true unread count across ALL of a user's notifications, not just
// whatever page/limit happens to be loaded elsewhere - the bell badge and
// the notifications page's "mark all read" button both need this real
// total, not a count derived from a partial, paginated list.
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: () => apiClient.get<{ count: number }>(endpoints.notifications.unreadCount),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch<NotificationDto>(endpoints.notifications.markRead(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the notification.'),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch<void>(endpoints.notifications.markAllRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not mark all as read.'),
  });
}
