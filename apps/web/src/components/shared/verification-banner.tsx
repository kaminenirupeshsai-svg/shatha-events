'use client';

import { MailWarning } from 'lucide-react';
import { VerifyOtpForm } from '@/features/auth/verify-otp-form';

/**
 * Defense-in-depth: login now requires a verified email, and signup no
 * longer issues a session, so a genuinely unverified user shouldn't be able
 * to hold an authenticated session anymore. This stays in place for any
 * session issued before that change was deployed, until it naturally expires.
 * Verifying refreshes the current-user query, so this banner disappears on
 * its own once the account is confirmed - no extra local state needed here.
 */
export function VerificationBanner({ email }: { email: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-amber/40 bg-amber-tint px-4 py-3.5">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#8C6A22] dark:text-amber" aria-hidden="true" />
        <p className="text-sm text-[#8C6A22] dark:text-amber">
          Verify your email — enter the code we sent when you signed up.
        </p>
      </div>
      <VerifyOtpForm email={email} onVerified={() => {}} />
    </div>
  );
}
