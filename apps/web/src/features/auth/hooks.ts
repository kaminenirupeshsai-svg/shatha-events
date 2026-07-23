'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  UpdatePasswordInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  UserDto,
  VerifyEmailInput,
} from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/auth-store';

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const user = await apiClient.get<UserDto>(endpoints.users.me);
      setUser(user);
      return user;
    },
    enabled: Boolean(accessToken),
    initialData: storeUser ?? undefined,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.post<AuthResponse>(endpoints.auth.login, input, { skipAuth: true }),
    onSuccess: (data) => {
      setSession(data);
      queryClient.setQueryData(queryKeys.me, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not sign in. Check your email and password.');
    },
  });
}

export function useSignup() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => apiClient.post<AuthResponse>(endpoints.auth.signup, input, { skipAuth: true }),
    onSuccess: (data) => {
      setSession(data);
      queryClient.setQueryData(queryKeys.me, data.user);
      toast.success('Account created — check your email to verify it before booking or listing services.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not create your account.');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      apiClient.post<{ message?: string }>(endpoints.auth.forgotPassword, input, { skipAuth: true }),
    onSuccess: () => {
      toast.success('If that email exists, a reset link is on its way.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not send the reset email.');
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      apiClient.post<{ message?: string }>(endpoints.auth.resetPassword, input, { skipAuth: true }),
    onSuccess: () => {
      toast.success('Password reset. You can sign in now.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'That reset link is invalid or has expired.');
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyEmailInput) =>
      apiClient.post<{ message?: string }>(endpoints.auth.verifyEmail, input, { skipAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success('Email verified — you can now book or list services.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'That verification link is invalid or has expired.');
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => apiClient.post<{ message?: string }>(endpoints.auth.resendVerification, undefined),
    onSuccess: () => {
      toast.success('Verification email sent — check your inbox.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not send the verification email.');
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => apiClient.patch<UserDto>(endpoints.users.updateMe, input),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.me, user);
      toast.success('Profile updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update your profile.'),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: UpdatePasswordInput) => apiClient.patch<void>(endpoints.users.updatePassword, input),
    onSuccess: () => toast.success('Password changed'),
    onError: (err: Error) => toast.error(err.message || 'Could not change your password.'),
  });
}

export function useUpdateSettings() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => apiClient.patch<UserDto>(endpoints.users.updateSettings, input),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.me, user);
      toast.success('Settings saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save your settings.'),
  });
}

export function useUploadAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient.upload<UserDto>(endpoints.users.avatar, formData);
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.me, user);
      toast.success('Avatar updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not upload your avatar.'),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<void>(endpoints.auth.logout, undefined),
    onSettled: () => {
      clearSession();
      queryClient.clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
    },
  });
}
