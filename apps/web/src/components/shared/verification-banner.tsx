'use client';

import { MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResendVerification } from '@/features/auth/hooks';

/** Shown wherever an unverified account is about to hit the email-verification
 * gate (see createBooking/createService) — a heads-up before they submit,
 * not a page-level block, since browsing/login stay open while unverified. */
export function VerificationBanner() {
  const resend = useResendVerification();

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber/40 bg-amber-tint px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#8C6A22] dark:text-amber" aria-hidden="true" />
        <p className="text-sm text-[#8C6A22] dark:text-amber">
          Verify your email to book or list services — check your inbox for the link we sent when you signed up.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        isLoading={resend.isPending}
        onClick={() => resend.mutate()}
      >
        Resend email
      </Button>
    </div>
  );
}
