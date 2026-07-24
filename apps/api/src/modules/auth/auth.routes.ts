import { Router } from 'express';
import {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  ResetPasswordInputSchema,
  SignupInputSchema,
  VerifyEmailInputSchema,
} from '@app/shared';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', authRateLimiter, validate(SignupInputSchema), authController.signup);
authRouter.post('/login', authRateLimiter, validate(LoginInputSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate(ForgotPasswordInputSchema),
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validate(ResetPasswordInputSchema),
  authController.resetPassword,
);
authRouter.post(
  '/verify-email',
  authRateLimiter,
  validate(VerifyEmailInputSchema),
  authController.verifyEmail,
);
// Not authenticated - a user who's blocked at login for being unverified has
// no session to authenticate this with, so it takes an email in the body
// instead (same non-leaking pattern as forgot-password).
authRouter.post(
  '/resend-verification',
  authRateLimiter,
  validate(ForgotPasswordInputSchema),
  authController.resendVerification,
);
