'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarCheck, Clock, TrendingUp, Users } from 'lucide-react';
import type { BookingDto, BookingStatus } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { BookingCard } from '@/components/shared/booking-card';
import { StatCard } from '@/components/charts/stat-card';
import { StatusPieChart, type StatusDatum } from '@/components/charts/status-pie-chart';
import { BookingsOverTimeChart, type WeekDatum } from '@/components/charts/bookings-over-time-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingCardSkeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { useAllBookings } from '@/features/bookings/hooks';

const ALL_STATUSES: BookingStatus[] = ['pending', 'reviewed', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function buildWeeklySeries(bookings: BookingDto[], weeksBack = 8): WeekDatum[] {
  const currentWeekStart = startOfWeek(new Date());
  const buckets = new Map<number, WeekDatum>();
  const order: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const key = weekStart.getTime();
    order.push(key);
    buckets.set(key, {
      weekLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    });
  }

  for (const booking of bookings) {
    const key = startOfWeek(new Date(booking.createdAt)).getTime();
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return order.map((key) => buckets.get(key) as WeekDatum);
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAllBookings({ limit: 100, sort: 'newest' });
  const bookings = useMemo(() => data?.items ?? [], [data]);

  const statusData: StatusDatum[] = useMemo(
    () =>
      ALL_STATUSES.map((status) => ({
        status,
        count: bookings.filter((b) => b.status === status).length,
      })),
    [bookings],
  );

  const weeklyData = useMemo(() => buildWeeklySeries(bookings), [bookings]);

  const pendingReview = bookings.filter((b) => b.status === 'pending' || b.status === 'reviewed').length;
  const active = bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress').length;
  const recent = bookings.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin overview"
        title="Booking pipeline at a glance"
        subtitle="Monitor status distribution, weekly volume, and the newest requests across the platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total bookings" value={data?.total ?? bookings.length} icon={CalendarCheck} />
            <StatCard label="Awaiting review" value={pendingReview} icon={Clock} />
            <StatCard label="Active" value={active} icon={TrendingUp} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Bookings by status</h2>
          {isLoading ? <StatCardSkeleton /> : <StatusPieChart data={statusData} />}
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Bookings over time</h2>
          {isLoading ? <StatCardSkeleton /> : <BookingsOverTimeChart data={weeklyData} />}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-emerald hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState icon={Users} title="No bookings yet" description="New booking requests will appear here." />
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recent.map((booking) => (
              <StaggerItem key={booking.id}>
                <BookingCard booking={booking} />
              </StaggerItem>
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
}
