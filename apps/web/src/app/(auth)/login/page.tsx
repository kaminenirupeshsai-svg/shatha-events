import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">Sign in to manage your bookings and services.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Shatha Events?{' '}
        <Link href="/signup" className="font-medium text-emerald hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
