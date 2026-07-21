import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import type { ApiError } from '@app/shared';
import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

/** Mounted after all routes. Turns an unmatched route into a 404 AppError. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`No route matches ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

interface MongoDuplicateKeyError {
  code: number;
  keyPattern?: Record<string, unknown>;
}

interface MongooseCastError {
  name: 'CastError';
  path: string;
}

interface MongooseValidationError {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function isCastError(err: unknown): err is MongooseCastError {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'CastError';
}

function isMongooseValidationError(err: unknown): err is MongooseValidationError {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError';
}

/**
 * The single place a raw thrown value becomes an HTTP response. Every
 * expected failure across modules/* is an AppError; anything else (a driver
 * error, a bug) is logged in full but the client only ever sees a generic
 * 500 - stack traces and internals never leak into the response body.
 *
 * Must keep all four parameters (including the unused `_next`) - Express
 * only treats a middleware as an error handler when its arity is 4.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiError = { code: err.code, message: err.message, details: err.details };
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.originalUrl }, 'AppError (5xx)');
    }
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof MulterError) {
    const body: ApiError = { code: `UPLOAD_${err.code}`, message: err.message };
    res.status(400).json(body);
    return;
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'value';
    const body: ApiError = { code: 'DUPLICATE_KEY', message: `That ${field} is already in use` };
    res.status(409).json(body);
    return;
  }

  if (isCastError(err)) {
    const body: ApiError = { code: 'INVALID_ID', message: `Invalid identifier for "${err.path}"` };
    res.status(400).json(body);
    return;
  }

  if (isMongooseValidationError(err)) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message]),
    );
    const body: ApiError = { code: 'VALIDATION_ERROR', message: 'Validation failed', details };
    res.status(400).json(body);
    return;
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  const body: ApiError = { code: 'INTERNAL_ERROR', message: 'Something went wrong' };
  res.status(500).json(body);
}
