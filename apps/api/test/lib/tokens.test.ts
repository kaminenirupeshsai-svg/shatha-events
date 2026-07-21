import { describe, expect, it } from 'vitest';
import { generateRawToken, hashToken } from '../../src/lib/tokens.js';

describe('tokens', () => {
  it('generateRawToken returns a hex string of the requested byte length', () => {
    const token = generateRawToken(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).toHaveLength(64); // 32 bytes -> 64 hex chars
  });

  it('generateRawToken is not deterministic', () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it('hashToken is deterministic and produces a sha256 hex digest', () => {
    const raw = 'a-known-raw-token';
    const first = hashToken(raw);
    const second = hashToken(raw);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashToken output never equals its input (not a no-op)', () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).not.toBe(raw);
  });
});
