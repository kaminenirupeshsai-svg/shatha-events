'use client';

import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/hooks';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications({ page, limit: 15 });
  const { data: unreadData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.items ?? [];
  // The real total, not just this page - otherwise "Mark all read" can end
  // up disabled while unread notifications still exist on other pages.
  const hasUnread = (unreadData?.count ?? 0) > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Stay on top of booking updates and account activity."
        action={
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={!hasUnread || markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all read
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-4',
                !notification.isRead && 'bg-emerald-tint/40',
              )}
            >
              <div>
                <p className="text-sm text-ink">{notification.message}</p>
                <p className="mt-1 text-xs text-ink-soft">{formatDateTime(notification.createdAt)}</p>
              </div>
              {!notification.isRead && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate(notification.id)}>
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} className="pt-2" />
      )}
    </div>
  );
}
