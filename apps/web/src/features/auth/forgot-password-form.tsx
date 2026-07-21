'use client';

import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { ForgotPasswordInputSchema, type ForgotPasswordInput } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForgotPassword } from './hooks';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInputSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onInvalid = (formErrors: FieldErrors<ForgotPasswordInput>) => {
    const first = Object.keys(formErrors)[0] as keyof ForgotPasswordInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    forgotPassword.mutate(values, { onSuccess: () => setSent(true) });
  }, onInvalid);

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-emerald-tint p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald" aria-hidden="true" />
        <p className="text-sm text-ink">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

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
      <Button type="submit" className="w-full" isLoading={forgotPassword.isPending}>
        Send reset link
      </Button>
    </form>
  );
}
