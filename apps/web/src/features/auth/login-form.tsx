'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailWarning } from 'lucide-react';
import { LoginInputSchema, type LoginInput } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { useLogin, useResendVerification } from './hooks';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const resend = useResendVerification();

  const {
    register,
    handleSubmit,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const onInvalid = (formErrors: FieldErrors<LoginInput>) => {
    const first = Object.keys(formErrors)[0] as keyof LoginInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        router.push(searchParams.get('next') || '/dashboard');
      },
    });
  }, onInvalid);

  const unverified = login.error instanceof ApiError && login.error.code === 'EMAIL_NOT_VERIFIED';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-sm text-terracotta">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm font-medium text-emerald hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="mt-1.5 text-sm text-terracotta">
            {errors.password.message}
          </p>
        )}
      </div>

      {unverified && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-amber/40 bg-amber-tint px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#8C6A22] dark:text-amber" aria-hidden="true" />
            <p className="text-sm text-[#8C6A22] dark:text-amber">
              Verify your email before signing in — check your inbox for the link.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            isLoading={resend.isPending}
            onClick={() => resend.mutate(getValues('email'))}
          >
            Resend email
          </Button>
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}
