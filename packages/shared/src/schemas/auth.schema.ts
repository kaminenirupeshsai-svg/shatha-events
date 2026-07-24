import { z } from 'zod';
import { UserDtoSchema } from './user.schema.js';

// Only client/vendor can self-register — admin accounts are seeded/promoted, never signed up.
export const SignupRoleSchema = z.enum(['client', 'vendor']);

export const SignupInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: SignupRoleSchema,
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const VerifyEmailInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;

// Signup no longer logs the user in (see auth.service.ts signup) - an
// account can't be used until its email is verified, so there's no session
// to issue yet. This just confirms the account was created and where the
// verification code went.
export const SignupResponseSchema = z.object({
  message: z.string(),
  email: z.string(),
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// Returned by login/signup/refresh — the access token is held in memory on
// the client (React Query cache), never localStorage; the refresh token
// travels only as an httpOnly cookie and never appears in this body.
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  user: UserDtoSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
