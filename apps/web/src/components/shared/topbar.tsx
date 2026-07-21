'use client';

import { usePathname } from 'next/navigation';
import type { UserDto } from '@app/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { initials } from '@/lib/utils';

const TITLE_MAP: [pattern: RegExp, title: string][] = [
  [/^\/dashboard\/client/, 'Overview'],
  [/^\/dashboard\/vendor/, 'Overview'],
  [/^\/dashboard\/admin/, 'Overview'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/bookings\/new/, 'New booking'],
  [/^\/bookings\/[^/]+$/, 'Booking details'],
  [/^\/bookings/, 'My bookings'],
  [/^\/services\/[^/]+$/, 'Service details'],
  [/^\/services/, 'Services'],
  [/^\/profile/, 'Profile'],
  [/^\/settings/, 'Settings'],
  [/^\/notifications/, 'Notifications'],
  [/^\/admin\/bookings/, 'Bookings'],
  [/^\/admin\/services/, 'Services'],
  [/^\/admin\/vendors/, 'Vendors'],
];

function getPageTitle(pathname: string): string {
  for (const [pattern, title] of TITLE_MAP) {
    if (pattern.test(pathname)) return title;
  }
  return 'Dashboard';
}

export function Topbar({ user }: { user: UserDto }) {
  const pathname = usePathname() ?? '/dashboard';
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-18 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={user.role} />
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <div className="ml-1 flex items-center gap-2.5">
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-ink sm:inline">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
