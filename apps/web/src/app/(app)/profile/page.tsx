'use client';

import { useRef } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CheckCircle2 } from 'lucide-react';
import { UpdatePasswordInputSchema, UpdateProfileInputSchema, type UpdatePasswordInput, type UpdateProfileInput } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { VerificationBanner } from '@/components/shared/verification-banner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { initials } from '@/lib/utils';
import { useMe, useUpdatePassword, useUpdateProfile, useUploadAvatar } from '@/features/auth/hooks';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Account" title="Profile" subtitle="Update your personal details and password." />

      {isLoading || !user ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          <AvatarSection avatarUrl={user.avatarUrl} name={user.name} />
          {user.emailVerified ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm text-ink-soft">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
              Email verified
            </div>
          ) : (
            <VerificationBanner />
          )}
          <ProfileForm defaultValues={{ name: user.name, phone: user.phone ?? '' }} />
          <PasswordForm />
        </>
      )}
    </div>
  );
}

function AvatarSection({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="relative">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-base">{initials(name)}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change avatar"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-emerald text-ivory"
        >
          <Camera className="h-3 w-3" aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar.mutate(file);
            e.target.value = '';
          }}
        />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{name}</p>
        <p className="text-sm text-ink-soft">{uploadAvatar.isPending ? 'Uploading…' : 'JPG or PNG, up to 5MB.'}</p>
      </div>
    </div>
  );
}

function ProfileForm({ defaultValues }: { defaultValues: UpdateProfileInput }) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInputSchema),
    mode: 'onBlur',
    defaultValues,
  });

  const onInvalid = (formErrors: FieldErrors<UpdateProfileInput>) => {
    const first = Object.keys(formErrors)[0] as keyof UpdateProfileInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => updateProfile.mutate(values), onInvalid);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Personal details</h2>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && <p className="mt-1.5 text-sm text-terracotta">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" type="tel" invalid={Boolean(errors.phone)} {...register('phone')} />
        {errors.phone && <p className="mt-1.5 text-sm text-terracotta">{errors.phone.message}</p>}
      </div>
      <Button type="submit" isLoading={updateProfile.isPending}>
        Save changes
      </Button>
    </form>
  );
}

function PasswordForm() {
  const updatePassword = useUpdatePassword();
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordInputSchema),
    mode: 'onBlur',
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onInvalid = (formErrors: FieldErrors<UpdatePasswordInput>) => {
    const first = Object.keys(formErrors)[0] as keyof UpdatePasswordInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    updatePassword.mutate(values, { onSuccess: () => reset() });
  }, onInvalid);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Change password</h2>
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.currentPassword)}
          {...register('currentPassword')}
        />
        {errors.currentPassword && <p className="mt-1.5 text-sm text-terracotta">{errors.currentPassword.message}</p>}
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.newPassword)}
          {...register('newPassword')}
        />
        {errors.newPassword && <p className="mt-1.5 text-sm text-terracotta">{errors.newPassword.message}</p>}
      </div>
      <Button type="submit" isLoading={updatePassword.isPending}>
        Update password
      </Button>
    </form>
  );
}
