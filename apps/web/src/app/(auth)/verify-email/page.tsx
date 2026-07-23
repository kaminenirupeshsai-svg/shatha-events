import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyEmailStatus } from '@/features/auth/verify-email-status';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald" aria-hidden="true" />}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
