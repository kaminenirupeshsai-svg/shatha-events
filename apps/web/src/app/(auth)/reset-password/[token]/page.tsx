import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = { title: 'Set a new password' };

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">Choose a new password for your account.</p>
      <ResetPasswordForm token={params.token} />
    </div>
  );
}
