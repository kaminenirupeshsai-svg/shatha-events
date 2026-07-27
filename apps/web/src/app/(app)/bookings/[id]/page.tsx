'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, MessageSquare, Users, Wallet } from 'lucide-react';
import { BOOKING_STATUS_TRANSITIONS } from '@app/shared';
import { StatusPill } from '@/components/shared/status-pill';
import { Reveal } from '@/components/shared/reveal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useBooking, useCancelBooking } from '@/features/bookings/hooks';
import { AdminStatusControl, BOOKING_STATUS_LABELS } from '@/features/bookings/status-control';
import { BookingReviewsSection } from '@/features/reviews/booking-reviews-section';
import { useMe } from '@/features/auth/hooks';

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  birthday: 'Birthday',
  social: 'Social',
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user } = useMe();
  const { data: booking, isLoading, isError } = useBooking(params.id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelBooking = useCancelBooking(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <EmptyState
        title="Booking not found"
        description="This booking may have been removed, or you don't have access to it."
        action={
          <Button variant="outline" onClick={() => router.push('/bookings')}>
            Back to bookings
          </Button>
        }
      />
    );
  }

  const canCancel = user?.role === 'client' && BOOKING_STATUS_TRANSITIONS[booking.status].includes('cancelled');
  // Vendors have no standalone bookings list (only /api/bookings/my exists,
  // and it's client-only) - they reach a booking's detail page from a
  // BookingCard on their dashboard, so that's where "back" should return to.
  const backHref = user?.role === 'admin' ? '/admin/bookings' : user?.role === 'vendor' ? '/dashboard/vendor' : '/bookings';

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-emerald">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to bookings
      </Link>

      <Reveal>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{EVENT_TYPE_LABELS[booking.eventType] ?? booking.eventType}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {booking.services.map((s) => s.title).join(', ') || 'Booking request'}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">Requested by {booking.clientName}</p>
            </div>
            <StatusPill status={booking.status} className="text-sm" />
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DetailItem icon={CalendarDays} label="Event date" value={formatDate(booking.eventDate)} />
            <DetailItem icon={Users} label="Guests" value={String(booking.guestCount)} />
            <DetailItem icon={Wallet} label="Budget" value={formatCurrency(booking.budget)} />
          </dl>

          {booking.message && (
            <div className="mt-6 rounded-xl bg-linen p-4">
              <p className="mb-1.5 flex items-center gap-1.5 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Message
              </p>
              <p className="text-sm text-ink">{booking.message}</p>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">Services requested</p>
            <ul className="space-y-2">
              {booking.services.map((s) => (
                <li key={s.serviceId} className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink">
                  {s.title}
                  {s.notes && <span className="text-ink-soft"> — {s.notes}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {user?.role === 'admin' && <AdminStatusControl bookingId={booking.id} currentStatus={booking.status} />}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel booking
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-6">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">Status timeline</h2>
          <ol className="space-y-5">
            {[...booking.statusHistory].reverse().map((entry, idx) => (
              <li key={`${entry.status}-${entry.changedAt}`} className="relative flex gap-4 pl-1">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald" aria-hidden="true" />
                  {idx < booking.statusHistory.length - 1 && <span className="mt-1 w-px flex-1 bg-line" aria-hidden="true" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-ink">{BOOKING_STATUS_LABELS[entry.status]}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(entry.changedAt)}</p>
                  {entry.note && <p className="mt-1 text-sm text-ink-soft">{entry.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {booking.status === 'completed' && (
        <Reveal delay={0.1} className="mt-6">
          <BookingReviewsSection booking={booking} canReview={user?.role === 'client'} />
        </Reveal>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="This cancels your booking request and notifies our team. This cannot be undone."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        isLoading={cancelBooking.isPending}
        onConfirm={() => cancelBooking.mutate(undefined, { onSuccess: () => setCancelOpen(false) })}
      />
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
