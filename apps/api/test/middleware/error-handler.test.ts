import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/error-handler.js';
import { AppError } from '../../src/lib/app-error.js';

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('errorHandler', () => {
  it('formats an AppError using its own status/code/message', () => {
    const res = makeRes();
    errorHandler(AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND'), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: 'BOOKING_NOT_FOUND',
      message: 'Booking not found',
      details: undefined,
    });
  });

  it('maps a Mongo duplicate-key error to 409', () => {
    const res = makeRes();
    errorHandler({ code: 11000, keyPattern: { email: 1 } }, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ code: 'DUPLICATE_KEY', message: 'That email is already in use' });
  });

  it('maps a Mongoose CastError to 400', () => {
    const res = makeRes();
    errorHandler({ name: 'CastError', path: '_id' }, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('maps a Mongoose ValidationError to 400 with per-field details', () => {
    const res = makeRes();
    errorHandler(
      { name: 'ValidationError', errors: { title: { message: 'Path `title` is required.' } } },
      {} as Request,
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { title: 'Path `title` is required.' },
    });
  });

  it('masks unknown errors behind a generic 500 - never leaks internals', () => {
    const res = makeRes();
    errorHandler(new Error('raw stack trace, connection string, etc'), { originalUrl: '/x' } as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: 'INTERNAL_ERROR', message: 'Something went wrong' });
  });
});

describe('notFoundHandler', () => {
  it('forwards a 404 AppError to next() for an unmatched route', () => {
    const next = vi.fn();
    notFoundHandler({ method: 'GET', originalUrl: '/nope' } as Request, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(404);
    expect((err as AppError).code).toBe('ROUTE_NOT_FOUND');
  });
});
