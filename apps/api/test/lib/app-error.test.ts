import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/lib/app-error.js';

describe('AppError', () => {
  it('is a real Error subclass', () => {
    const err = AppError.badRequest('bad input');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('bad input');
  });

  // Only the zero-arg-callable factories (badRequest/conflict require a
  // message and are covered by their own tests below).
  it.each([
    ['unauthorized', 401, 'UNAUTHORIZED'],
    ['forbidden', 403, 'FORBIDDEN'],
    ['notFound', 404, 'NOT_FOUND'],
    ['internal', 500, 'INTERNAL_ERROR'],
  ] as const)('%s() defaults to status %i and code %s', (factory, status, code) => {
    const err = AppError[factory]();
    expect(err.statusCode).toBe(status);
    expect(err.code).toBe(code);
  });

  it('badRequest() defaults to status 400 and code BAD_REQUEST', () => {
    const err = AppError.badRequest('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('conflict() uses 409 and accepts a custom code', () => {
    const err = AppError.conflict('taken', 'EMAIL_TAKEN');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('EMAIL_TAKEN');
  });

  it('carries structured details through untouched', () => {
    const details = { field: 'email', reason: 'invalid' };
    const err = AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
    expect(err.details).toEqual(details);
  });
});
