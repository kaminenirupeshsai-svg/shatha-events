import rateLimit from 'express-rate-limit';
import type { ApiError } from '@app/shared';
import { env } from '../config/env.js';

// Bodies here deliberately match ApiErrorSchema by hand rather than throwing
// an AppError - express-rate-limit's `handler` runs outside the normal
// controller -> asyncHandler -> errorHandler flow, so this is the response
// itself, not something forwarded to next().
function tooManyRequests(message: string) {
  return (_req: unknown, res: import('express').Response) => {
    const body: ApiError = { code: 'TOO_MANY_REQUESTS', message };
    res.status(429).json(body);
  };
}

// Generous ceiling for ordinary API traffic; only meant to blunt runaway
// clients/scripts, not to throttle normal usage.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests('Too many requests. Please slow down and try again shortly.'),
});

// Tight limit on the credential-guessing surface: login, signup, and the
// password-reset request/confirm endpoints.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests('Too many attempts. Please wait a few minutes and try again.'),
});

// File uploads are more expensive (disk/network I/O) than a typical request.
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests('Too many uploads. Please wait a few minutes and try again.'),
});
