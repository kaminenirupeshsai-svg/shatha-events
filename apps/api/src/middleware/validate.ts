import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../lib/app-error.js';

type Source = 'body' | 'query' | 'params';

/**
 * Parses req[source] against `schema`. On success, replaces req[source] with
 * the parsed (and coerced/defaulted) value so downstream handlers get clean,
 * typed data. On failure, throws an AppError that the global error handler
 * turns into a 400 ApiErrorSchema response.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw AppError.badRequest('Validation failed', 'VALIDATION_ERROR', result.error.flatten());
    }
    // query/params are getter-only in newer Express typings in some setups;
    // assigning the parsed object back onto the existing object is safest.
    Object.assign(req[source] as object, result.data);
    next();
  };
}
