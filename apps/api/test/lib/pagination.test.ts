import { describe, expect, it } from 'vitest';
import { buildPaginatedResult, escapeRegex } from '../../src/lib/pagination.js';

describe('buildPaginatedResult', () => {
  it('computes totalPages by rounding up', () => {
    const result = buildPaginatedResult(['a', 'b'], 25, 1, 12);
    expect(result).toEqual({ items: ['a', 'b'], page: 1, limit: 12, total: 25, totalPages: 3 });
  });

  it('never reports fewer than 1 total page, even with zero results', () => {
    const result = buildPaginatedResult([], 0, 1, 12);
    expect(result.totalPages).toBe(1);
  });
});

describe('escapeRegex', () => {
  it('escapes regex metacharacters so they are treated literally', () => {
    expect(escapeRegex('a.b*c?')).toBe('a\\.b\\*c\\?');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeRegex('wedding photographer')).toBe('wedding photographer');
  });
});
