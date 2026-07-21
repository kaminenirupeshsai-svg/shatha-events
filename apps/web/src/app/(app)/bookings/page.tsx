'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, PlusCircle, Search } from 'lucide-react';
import type { BookingStatus } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { BookingCard } from '@/components/shared/booking-card';
import { StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingCardSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useMyBookings } from '@/features/bookings/hooks';

const STATUS_TABS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useMyBookings({
    q: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    limit: 9,
    sort: 'newest',
  });
  const bookings = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your requests"
        title="My bookings"
        subtitle="Track the status of every booking request you've submitted."
        action={
          <Button asChild>
            <Link href="/bookings/new">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              New booking
            </Link>
          </Button>
        }
      />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          aria-label="Search bookings"
          placeholder="Search bookings…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as BookingStatus | 'all');
          setPage(1);
        }}
      >
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          description="Try clearing your filters, or submit a new booking request."
          action={
            <Button asChild>
              <Link href="/bookings/new">Create a booking</Link>
            </Button>
          }
        />
      ) : (
        <StaggerReveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <StaggerItem key={booking.id}>
              <BookingCard booking={booking} />
            </StaggerItem>
          ))}
        </StaggerReveal>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} className="pt-4" />
      )}
    </div>
  );
}
