import type { Request, Response } from 'express';
import type { AuthResponse } from '@app/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';
// Scoped to /api/auth so the browser only ever sends it to the handful of
// routes that need it (refresh, logout) - never leaked to every API call.
const REFRESH_COOKIE_PATH = '/api/auth';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    // In production the web app and API are on different Render domains,
    // which is cross-site for cookie purposes - the browser only sends the
    // refresh cookie on a cross-site fetch if SameSite=None, which in turn
    // requires Secure. Locally both run on http://localhost with the same
    // effective site, so Lax (and no HTTPS requirement) is both sufficient
    // and necessary (Secure cookies are dropped over plain http://localhost).
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    path: REFRESH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function sendAuthResult(
  res: Response,
  result: { user: AuthResponse['user']; accessToken: string; accessTokenExpiresAt: string; refreshTokenRaw: string },
  status = 200,
): void {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenRaw, refreshCookieOptions());
  const body: AuthResponse = {
    accessToken: result.accessToken,
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    user: result.user,
  };
  res.status(status).json(body);
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendAuthResult(res, result, 200);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const result = await authService.refresh(raw);
  sendAuthResult(res, result, 200);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(raw);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(204).send();
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({ message: 'If that email exists, a reset link is on its way.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ message: 'Password reset. You can sign in now.' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.email, req.body.otp);
  res.status(200).json({ message: 'Email verified. You can now sign in.' });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerification(req.body.email);
  res.status(200).json({ message: 'If that email exists and needs verifying, a new code is on its way.' });
});
