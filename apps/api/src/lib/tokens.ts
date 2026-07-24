import crypto from 'node:crypto';

/**
 * Shared helpers for any "opaque random token" the API hands out - refresh
 * tokens and password-reset tokens alike. The raw token is what leaves the
 * server (as a cookie or an emailed link); only its SHA-256 hash is ever
 * persisted, so a database leak doesn't hand out usable credentials.
 */
export function generateRawToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * A 6-digit numeric one-time code (e.g. email verification) - short enough
 * to type by hand, unlike the hex tokens above which only ever travel as a
 * URL. Hashed and persisted the same way via hashToken() before storage.
 */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}
