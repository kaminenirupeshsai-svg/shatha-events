'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { BOOKING_STATUS_TRANSITIONS, type BookingStatus } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { StatusPill } from '@/components/shared/status-pill';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useAllBookings } from '@/features/bookings/hooks';
import { AdminStatusControl } from '@/features/bookings/status-control';

const STATUS_TABS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'event_date', label: 'Event date' },
] as const;

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('newest');
  const [page, setPage] = useState(1);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useAllBookings({
    q: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    sort,
    page,
    limit: 10,
  });
  const bookings = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Bookings" subtitle="Search, filter, and move bookings through the pipeline." />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            aria-label="Search bookings"
            placeholder="Search by client or service…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Sort bookings">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={status} onValueChange={(v) => { setStatus(v as BookingStatus | 'all'); setPage(1); }}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Client', 'Event', 'Date', 'Guests', 'Budget', 'Status'].map((col) => (
                <th key={col} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <EmptyState title="No bookings match your filters" description="Try a different search term or status." />
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const canChangeStatus = BOOKING_STATUS_TRANSITIONS[booking.status].length > 0;
                return (
                  <tr
                    key={booking.id}
                    onClick={() => canChangeStatus && setActiveRowId(booking.id)}
                    className={cn(
                      'border-b border-line last:border-0 transition-colors hover:bg-linen/60',
                      canChangeStatus && 'cursor-pointer',
                    )}
                  >
                    <td className="px-4 py-3.5 font-medium text-ink">{booking.clientName}</td>
                    <td className="px-4 py-3.5 text-ink-soft">
                      <Link
                        href={`/bookings/${booking.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald hover:underline"
                      >
                        {booking.services.map((s) => s.title).join(', ') || booking.eventType}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">{formatDate(booking.eventDate)}</td>
                    <td className="px-4 py-3.5 text-ink-soft">{booking.guestCount}</td>
                    <td className="px-4 py-3.5 text-ink-soft">{formatCurrency(booking.budget)}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={booking.status} />
                    </td>
                    {activeRowId === booking.id && (
                      <AdminStatusControl
                        bookingId={booking.id}
                        currentStatus={booking.status}
                        open={activeRowId === booking.id}
                        onOpenChange={(open) => setActiveRowId(open ? booking.id : null)}
                      />
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
