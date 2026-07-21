import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@app/shared';
import { AppError } from '../lib/app-error.js';

/** Must run after `auth`. Rejects with 403 unless req.user.role is one of `roles`. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
