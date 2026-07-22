'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { useLogout } from '@/features/auth/hooks';
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
        <AccountMenu user={user} />
      </div>
    </header>
  );
}

function AccountMenu({ user }: { user: UserDto }) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="ml-1 flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
        >
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-ink sm:inline">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block text-sm font-medium text-ink">{user.name}</span>
          <span className="block truncate text-xs font-normal text-ink-soft">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            logout.mutate();
          }}
          disabled={logout.isPending}
          className="text-terracotta data-[highlighted]:bg-terracotta-tint"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {logout.isPending ? 'Logging out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
