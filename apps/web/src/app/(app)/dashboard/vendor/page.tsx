'use client';

import Link from 'next/link';
import { CalendarCheck, Clock, Package, PlusCircle, ShieldAlert, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { BookingCard } from '@/components/shared/booking-card';
import { StatCard } from '@/components/charts/stat-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingCardSkeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { VerificationBanner } from '@/components/shared/verification-banner';
import { useVendorBookings } from '@/features/bookings/hooks';
import { useServices } from '@/features/services/hooks';
import { useMe } from '@/features/auth/hooks';

export default function VendorDashboardPage() {
  const { data: user } = useMe();
  const { data: bookingsPage, isLoading: bookingsLoading } = useVendorBookings({ limit: 50, sort: 'newest' });
  const { data: servicesPage, isLoading: servicesLoading } = useServices({ vendorId: user?.id, limit: 100 });

  const bookings = bookingsPage?.items ?? [];
  const activeServices = (servicesPage?.items ?? []).filter((s) => s.isActive).length;
  const inProgress = bookings.filter((b) => b.status === 'in_progress' || b.status === 'confirmed').length;
  const recent = bookings.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendor overview"
        title={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="See how bookings referencing your services are progressing."
        action={
          <Button asChild variant="outline">
            <Link href="/services">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Manage services
            </Link>
          </Button>
        }
      />

      {user && !user.emailVerified && <VerificationBanner />}

      {user && user.vendorStatus !== 'approved' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber-tint px-4 py-3.5">
          {user.vendorStatus === 'pending' ? (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#8C6A22] dark:text-amber" aria-hidden="true" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#8C6A22] dark:text-amber" aria-hidden="true" />
          )}
          <p className="text-sm text-[#8C6A22] dark:text-amber">
            {user.vendorStatus === 'pending'
              ? "Your vendor account is awaiting admin approval — you'll be able to list services once it's approved."
              : 'Your vendor application was not approved, so you cannot list services. Contact us if you think this was a mistake.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {bookingsLoading || servicesLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Active listings" value={activeServices} icon={Package} />
            <StatCard label="Bookings referencing you" value={bookingsPage?.total ?? bookings.length} icon={CalendarCheck} />
            <StatCard label="In progress" value={inProgress} icon={TrendingUp} />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent bookings</h2>
        {bookingsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="Once a client books one of your services, it will show up here."
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
