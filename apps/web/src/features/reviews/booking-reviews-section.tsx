'use client';

import { useState } from 'react';
import type { BookingDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StarRating } from '@/components/shared/star-rating';
import { useBookingReviews, useCreateReview } from './hooks';
import { ReviewForm, type ReviewFormValues } from './review-form';

/**
 * Only meaningful once a booking is completed - shown on the booking detail
 * page. `canReview` should be true only for the client who owns the booking
 * (the only role the backend lets create a review); vendors/admins viewing
 * the same page still see the read-only results.
 */
export function BookingReviewsSection({ booking, canReview }: { booking: BookingDto; canReview: boolean }) {
  const { data: reviews } = useBookingReviews(booking.id);

  if (booking.status !== 'completed') return null;

  const reviewByServiceId = new Map((reviews ?? []).map((r) => [r.serviceId, r]));

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h2 className="mb-5 font-display text-lg font-semibold text-ink">Reviews</h2>
      <ul className="space-y-3">
        {booking.services.map((service) => {
          const review = reviewByServiceId.get(service.serviceId);
          return (
            <li
              key={service.serviceId}
              className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-ink">{service.title}</span>
              {review ? (
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <StarRating value={review.rating} size="sm" />
                  {review.comment && <p className="max-w-sm text-xs text-ink-soft">{review.comment}</p>}
                </div>
              ) : canReview ? (
                <ReviewDialog bookingId={booking.id} serviceId={service.serviceId} serviceTitle={service.title} />
              ) : (
                <span className="text-xs text-ink-soft">Not yet reviewed</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewDialog({
  bookingId,
  serviceId,
  serviceTitle,
}: {
  bookingId: string;
  serviceId: string;
  serviceTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const createReview = useCreateReview(bookingId);

  function handleSubmit(values: ReviewFormValues) {
    createReview.mutate({ serviceId, ...values }, { onSuccess: () => setOpen(false) });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Rate this vendor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate {serviceTitle}</DialogTitle>
        </DialogHeader>
        <ReviewForm onSubmit={handleSubmit} isSubmitting={createReview.isPending} />
      </DialogContent>
    </Dialog>
  );
}
