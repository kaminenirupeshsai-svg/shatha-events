'use client';

import { useRouter } from 'next/navigation';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordInputSchema, type ResetPasswordInput } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResetPassword } from './hooks';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInputSchema),
    mode: 'onBlur',
    defaultValues: { token, password: '' },
  });

  const onInvalid = (formErrors: FieldErrors<ResetPasswordInput>) => {
    const first = Object.keys(formErrors)[0] as keyof ResetPasswordInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    resetPassword.mutate(values, {
      onSuccess: () => router.push('/login'),
    });
  }, onInvalid);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <input type="hidden" {...register('token')} />
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
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
      <Button type="submit" className="w-full" isLoading={resetPassword.isPending}>
        Reset password
      </Button>
    </form>
  );
}
