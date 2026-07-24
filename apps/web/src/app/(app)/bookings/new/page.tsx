'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Reveal } from '@/components/shared/reveal';
import { VerificationBanner } from '@/components/shared/verification-banner';
import { BookingForm } from '@/features/bookings/booking-form';
import { useCreateBooking } from '@/features/bookings/hooks';
import { useMe } from '@/features/auth/hooks';

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId') ?? undefined;
  const createBooking = useCreateBooking();

  return (
    <BookingForm
      preselectedServiceId={preselectedServiceId}
      isSubmitting={createBooking.isPending}
      onSubmit={(values) => {
        createBooking.mutate(values, {
          onSuccess: (booking) => router.push(`/bookings/${booking.id}`),
        });
      }}
    />
  );
}

export default function NewBookingPage() {
  const { data: user } = useMe();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="New request"
        title="Request a booking"
        subtitle="Tell us about your event and we'll match you with the right vendors."
        className="mb-8"
      />
      {user && !user.emailVerified && (
        <div className="mb-6">
          <VerificationBanner email={user.email} />
        </div>
      )}
      <Reveal>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <Suspense fallback={null}>
            <NewBookingForm />
          </Suspense>
        </div>
      </Reveal>
    </div>
  );
}
