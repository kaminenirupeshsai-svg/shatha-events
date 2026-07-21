import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { validate } from '../../src/middleware/validate.js';
import { AppError } from '../../src/lib/app-error.js';

const schema = z.object({ name: z.string().min(2), age: z.coerce.number().int().min(0) });

function makeReq(body: unknown): Request {
  return { body } as Request;
}

describe('validate middleware', () => {
  it('calls next() with no error and replaces req.body with the parsed value on success', () => {
    const req = makeReq({ name: 'Ada', age: '30' }); // note: age arrives as a string, like real query/body input
    const next = vi.fn();
    validate(schema)(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ada', age: 30 }); // coerced
  });

  it('throws a 400 AppError on invalid input (Express catches sync throws from non-async middleware and forwards them to next() itself)', () => {
    const req = makeReq({ name: 'A', age: -1 });
    const middleware = validate(schema);

    let caught: unknown;
    try {
      middleware(req, {} as Response, vi.fn());
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).statusCode).toBe(400);
    expect((caught as AppError).code).toBe('VALIDATION_ERROR');
  });

  it('validates the requested source (query/params) rather than body', () => {
    const req = { query: { name: 'Ada', age: '30' } } as unknown as Request;
    const next = vi.fn();
    validate(schema, 'query')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ name: 'Ada', age: 30 });
  });
});
