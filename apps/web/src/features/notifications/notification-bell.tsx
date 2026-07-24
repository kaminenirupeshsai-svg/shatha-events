'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime, cn } from '@/lib/utils';
import { useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from './hooks';

export function NotificationBell() {
  const { data } = useNotifications({ limit: 6 });
  const { data: unreadData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const items = data?.items ?? [];
  // The real total across every notification, not just this dropdown's
  // 6-item preview - a user with 12 unread shouldn't see a badge capped at 6.
  const unreadCount = unreadData?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-semibold text-ivory">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-soft">You&apos;re all caught up.</p>
        ) : (
          items.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onSelect={(e) => {
                e.preventDefault();
                if (!notification.isRead) markRead.mutate(notification.id);
              }}
              className={cn('flex-col items-start gap-0.5 whitespace-normal', !notification.isRead && 'bg-emerald-tint/50')}
            >
              <span className="text-sm text-ink">{notification.message}</span>
              <span className="text-xs text-ink-soft">{formatRelativeTime(notification.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center font-medium text-emerald">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
