'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from './hooks';

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const verifyEmail = useVerifyEmail();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    verifyEmail.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <StatusMessage
        icon={<XCircle className="h-8 w-8 text-terracotta" aria-hidden="true" />}
        title="Missing verification link"
        description="This page needs a verification token — use the link from your email."
      />
    );
  }

  if (verifyEmail.isPending || verifyEmail.isIdle) {
    return (
      <StatusMessage
        icon={<Loader2 className="h-8 w-8 animate-spin text-emerald" aria-hidden="true" />}
        title="Verifying your email…"
      />
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <StatusMessage
        icon={<CheckCircle2 className="h-8 w-8 text-emerald" aria-hidden="true" />}
        title="Email verified"
        description="You can now book or list services on Shatha Events."
        action={
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <StatusMessage
      icon={<XCircle className="h-8 w-8 text-terracotta" aria-hidden="true" />}
      title="That link is invalid or has expired"
      description="Sign in and use the resend option to get a fresh verification email."
      action={
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      }
    />
  );
}

function StatusMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {icon}
      <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
