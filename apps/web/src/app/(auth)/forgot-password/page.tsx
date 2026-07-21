import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Forgot your password?</h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">
        Enter the email on your account and we&apos;ll send you a link to reset it.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-ink-soft">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-emerald hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
