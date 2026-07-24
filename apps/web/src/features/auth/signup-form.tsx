'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, MailCheck, User } from 'lucide-react';
import { SignupInputSchema, type SignupInput } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSignup } from './hooks';

const ROLES: { value: SignupInput['role']; label: string; description: string; icon: typeof User }[] = [
  { value: 'client', label: "I'm a client", description: 'Book vendors for my event', icon: User },
  { value: 'vendor', label: "I'm a vendor", description: 'List my services — requires admin approval', icon: Briefcase },
];

export function SignupForm() {
  const signup = useSignup();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupInputSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', role: 'client' },
  });

  const onInvalid = (formErrors: FieldErrors<SignupInput>) => {
    const first = Object.keys(formErrors)[0] as keyof SignupInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    signup.mutate(values, {
      onSuccess: (data) => setSubmittedEmail(data.email),
    });
  }, onInvalid);

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-emerald-tint p-6 text-center">
        <MailCheck className="h-8 w-8 text-emerald" aria-hidden="true" />
        <p className="text-sm text-ink">
          We sent a verification link to <span className="font-semibold">{submittedEmail}</span>. Click it to
          activate your account, then sign in.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="role-group">I&apos;m joining as</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div id="role-group" role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const selected = field.value === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(role.value)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                      selected ? 'border-emerald bg-emerald-tint' : 'border-line bg-surface hover:bg-linen',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', selected ? 'text-emerald' : 'text-ink-soft')} aria-hidden="true" />
                    <span className="font-body text-sm font-semibold text-ink">{role.label}</span>
                    <span className="text-xs text-ink-soft">{role.description}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="name-error" className="mt-1.5 text-sm text-terracotta">
            {errors.name.message}
          </p>
        )}
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-sm text-terracotta">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="mt-1.5 text-xs text-ink-soft">
            At least 8 characters.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={signup.isPending}>
        Create account
      </Button>
    </form>
  );
}
