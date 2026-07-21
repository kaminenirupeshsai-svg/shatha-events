import jwt from 'jsonwebtoken';
import type { UserRole } from '@app/shared';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === 'string' || !decoded.userId || !decoded.role) {
      throw new Error('Malformed token payload');
    }
    return { userId: decoded.userId as string, role: decoded.role as UserRole };
  } catch {
    throw AppError.unauthorized('Invalid or expired access token', 'INVALID_ACCESS_TOKEN');
  }
}

/** Returns the epoch-ms expiry implied by ACCESS_TOKEN_TTL, for AuthResponse.accessTokenExpiresAt. */
export function accessTokenExpiryDate(): Date {
  const ms = parseTtlToMs(env.ACCESS_TOKEN_TTL);
  return new Date(Date.now() + ms);
}

function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) return 15 * 60 * 1000;
  const [, numStr, unit] = match;
  const num = Number(numStr);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return num * (unitMs[unit as string] ?? 60_000);
}
