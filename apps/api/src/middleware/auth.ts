import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@app/shared';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from '../lib/app-error.js';

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the access token from the Authorization header only - the refresh
 * cookie is never read here. Attaches req.user = { id, role } on success.
 */
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw AppError.unauthorized('Missing access token');
  }
  const payload = verifyAccessToken(token);
  req.user = { id: payload.userId, role: payload.role };
  next();
}
