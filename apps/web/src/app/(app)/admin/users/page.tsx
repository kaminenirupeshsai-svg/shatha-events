'use client';

import { useState } from 'react';
import { CheckCircle2, Search, Users as UsersIcon } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDate, initials } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useAllUsers, useSetUserActive } from '@/features/admin/users-hooks';
import { useMe } from '@/features/auth/hooks';

const ROLE_TABS: { value: UserDto['role'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'client', label: 'Clients' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'admin', label: 'Admins' },
];

export default function AdminUsersPage() {
  const { data: me } = useMe();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserDto['role'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pendingTarget, setPendingTarget] = useState<UserDto | null>(null);

  const { data, isLoading } = useAllUsers({
    q: debouncedSearch || undefined,
    role: role === 'all' ? undefined : role,
    page,
    limit: 10,
  });
  const users = data?.items ?? [];
  const setActive = useSetUserActive();

  function confirmToggle() {
    if (!pendingTarget) return;
    setActive.mutate(
      { id: pendingTarget.id, isActive: !pendingTarget.isActive },
      { onSuccess: () => setPendingTarget(null) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Users" subtitle="Everyone registered on Shatha Events, across every role." />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            aria-label="Search users"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Tabs
          value={role}
          onValueChange={(value) => {
            setRole(value as UserDto['role'] | 'all');
            setPage(1);
          }}
        >
          <TabsList>
            {ROLE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['User', 'Email', 'Role', 'Status', 'Joined', ''].map((col) => (
                <th key={col} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <EmptyState icon={UsersIcon} title="No users found" description="Try a different search term or filter." />
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                        <AvatarFallback className="text-[11px]">{initials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-ink">{user.name}</span>
                      {user.id === me?.id && (
                        <span className="rounded-full bg-linen px-2 py-0.5 font-label text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">
                    <div className="flex items-center gap-1.5">
                      {user.email}
                      {user.emailVerified && (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" aria-label="Email verified" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft capitalize">{user.role}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-wide',
                        user.isActive ? 'bg-emerald-tint text-emerald' : 'bg-terracotta-tint text-terracotta',
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      {user.id !== me?.id && (
                        <Button
                          size="sm"
                          variant={user.isActive ? 'outline' : 'secondary'}
                          onClick={() => setPendingTarget(user)}
                        >
                          {user.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={Boolean(pendingTarget)}
        onOpenChange={(open) => !open && setPendingTarget(null)}
        title={pendingTarget?.isActive ? `Deactivate ${pendingTarget.name}?` : `Reactivate ${pendingTarget?.name}?`}
        description={
          pendingTarget?.isActive
            ? 'They will be signed out and unable to log in until reactivated. Their existing bookings, reviews, and messages are not affected.'
            : 'They will be able to log in again immediately.'
        }
        confirmLabel={pendingTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        destructive={Boolean(pendingTarget?.isActive)}
        isLoading={setActive.isPending}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
