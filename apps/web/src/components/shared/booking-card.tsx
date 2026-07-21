import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';
import type { BookingDto } from '@app/shared';
import { formatDate } from '@/lib/utils';
import { StatusPill } from './status-pill';

const EVENT_TYPE_LABELS: Record<BookingDto['eventType'], string> = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  birthday: 'Birthday',
  social: 'Social',
};

export function BookingCard({ booking }: { booking: BookingDto }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{EVENT_TYPE_LABELS[booking.eventType]}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">
            {booking.services.map((s) => s.title).join(', ') || 'Booking request'}
          </h3>
        </div>
        <StatusPill status={booking.status} />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {formatDate(booking.eventDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" aria-hidden="true" />
          {booking.guestCount} guests
        </span>
      </div>
    </Link>
  );
}
