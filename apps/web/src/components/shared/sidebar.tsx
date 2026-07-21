'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings,
  Store,
  UserRound,
} from 'lucide-react';
import type { UserRole } from '@app/shared';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  client: [
    { href: '/dashboard/client', label: 'Overview', icon: LayoutDashboard },
    { href: '/bookings', label: 'My bookings', icon: CalendarCheck },
    { href: '/services', label: 'Browse services', icon: Store },
    { href: '/notifications', label: 'Notifications', icon: ListChecks },
    { href: '/profile', label: 'Profile', icon: UserRound },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  vendor: [
    { href: '/dashboard/vendor', label: 'Overview', icon: LayoutDashboard },
    { href: '/services', label: 'My services', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: ListChecks },
    { href: '/profile', label: 'Profile', icon: UserRound },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/admin/services', label: 'Services', icon: Package },
    { href: '/admin/vendors', label: 'Vendors', icon: Store },
    { href: '/notifications', label: 'Notifications', icon: ListChecks },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Client',
  vendor: 'Vendor',
  admin: 'Admin',
};

export function SidebarBrand() {
  return (
    <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#4B9A80]">
        <span className="h-3 w-3 rounded-full bg-[#E3B563]" />
      </span>
      <span className="font-display text-base font-semibold text-[#EDE8DC]">Shatha Events</span>
    </Link>
  );
}

export function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <>
      <span className="mb-6 inline-flex w-fit items-center rounded-full bg-[#1B2A24] px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-wide text-[#4B9A80]">
        {ROLE_LABEL[role]}
      </span>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B563]',
                active ? 'bg-[#1F2A1C] text-[#EDE8DC]' : 'text-[#B7BDB6] hover:bg-[#1F2A1C] hover:text-[#EDE8DC]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E3B563]" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-[#12180F] px-4 py-6 lg:flex" aria-label="Dashboard navigation">
      <SidebarBrand />
      <SidebarNav role={role} />
    </aside>
  );
}
