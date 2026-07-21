import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/features/auth/signup-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">Join as a client to book vendors, or as a vendor to list your services.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-emerald hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
