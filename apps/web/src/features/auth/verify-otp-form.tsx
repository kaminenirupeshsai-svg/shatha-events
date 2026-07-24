'use client';

import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerifyEmailInputSchema } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResendVerification, useVerifyEmail } from './hooks';

const OtpOnlySchema = VerifyEmailInputSchema.pick({ otp: true });
interface OtpOnlyInput {
  otp: string;
}

/**
 * Reusable 6-digit code entry, used right after signup (email already known)
 * and inline on the login form when a login attempt is blocked for being
 * unverified (email known from what they just typed).
 */
export function VerifyOtpForm({ email, onVerified }: { email: string; onVerified: () => void }) {
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<OtpOnlyInput>({
    resolver: zodResolver(OtpOnlySchema),
    mode: 'onBlur',
    defaultValues: { otp: '' },
  });

  const onInvalid = (formErrors: FieldErrors<OtpOnlyInput>) => {
    if (formErrors.otp) setFocus('otp');
  };

  const onSubmit = handleSubmit((values) => {
    verifyEmail.mutate({ email, otp: values.otp }, { onSuccess: onVerified });
  }, onInvalid);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="otp">6-digit code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className="text-center font-mono text-lg tracking-[0.5em]"
          invalid={Boolean(errors.otp)}
          aria-describedby={errors.otp ? 'otp-error' : undefined}
          {...register('otp')}
        />
        {errors.otp && (
          <p id="otp-error" className="mt-1.5 text-sm text-terracotta">
            {errors.otp.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={verifyEmail.isPending}>
          Verify
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          isLoading={resend.isPending}
          onClick={() => resend.mutate(email)}
        >
          Resend code
        </Button>
      </div>
    </form>
  );
}
