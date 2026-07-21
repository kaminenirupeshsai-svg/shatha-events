import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../src/lib/jwt.js';
import { AppError } from '../../src/lib/app-error.js';

describe('jwt', () => {
  it('round-trips a payload through sign and verify', () => {
    const token = signAccessToken({ userId: '507f1f77bcf86cd799439011', role: 'admin' });
    const decoded = verifyAccessToken(token);
    expect(decoded).toEqual({ userId: '507f1f77bcf86cd799439011', role: 'admin' });
  });

  it('throws an unauthorized AppError for a garbage token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow(AppError);
    try {
      verifyAccessToken('not-a-real-token');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it('rejects a token signed with a different secret', () => {
    // A syntactically valid JWT (three base64 segments) but garbage signature.
    const forged = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4Iiwicm9sZSI6ImFkbWluIn0.invalidsignature';
    expect(() => verifyAccessToken(forged)).toThrow(AppError);
  });
});
