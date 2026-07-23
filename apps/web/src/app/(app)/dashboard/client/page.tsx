'use client';

import Link from 'next/link';
import { CalendarCheck, Clock, PlusCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { BookingCard } from '@/components/shared/booking-card';
import { StatCard } from '@/components/charts/stat-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingCardSkeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { VerificationBanner } from '@/components/shared/verification-banner';
import { useMyBookings } from '@/features/bookings/hooks';
import { useMe } from '@/features/auth/hooks';

export default function ClientDashboardPage() {
  const { data: user } = useMe();
  const { data, isLoading } = useMyBookings({ limit: 50, sort: 'newest' });
  const bookings = data?.items ?? [];

  const upcoming = bookings.filter(
    (b) => new Date(b.eventDate).getTime() > Date.now() && b.status !== 'cancelled' && b.status !== 'completed',
  ).length;
  const pendingReview = bookings.filter((b) => b.status === 'pending' || b.status === 'reviewed').length;
  const recent = bookings.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Client overview"
        title={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Track your booking requests and start a new one whenever you're ready."
        action={
          <Button asChild>
            <Link href="/bookings/new">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              New booking
            </Link>
          </Button>
        }
      />

      {user && !user.emailVerified && <VerificationBanner />}

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
            <StatCard label="Upcoming events" value={upcoming} icon={Sparkles} />
            <StatCard label="Awaiting review" value={pendingReview} icon={Clock} />
          </>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
          <Link href="/bookings" className="text-sm font-medium text-emerald hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="Submit your first booking request to start planning your event."
            action={
              <Button asChild>
                <Link href="/bookings/new">Create a booking</Link>
              </Button>
            }
          />
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
