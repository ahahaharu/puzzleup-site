import { describe, expect, it } from 'vitest';

import { minskYear, shortTime } from './time';

describe('minskYear', () => {
  it('uses Minsk time at the year boundary', () => {
    expect(minskYear(Date.parse('2026-12-31T20:59:59Z'))).toBe(2026);
    expect(minskYear(Date.parse('2026-12-31T21:00:00Z'))).toBe(2027);
  });

  it('returns the calendar year mid-year', () => {
    expect(minskYear(Date.parse('2026-06-15T12:00:00Z'))).toBe(2026);
  });
});

describe('shortTime', () => {
  it('drops the leading zero of the hour', () => {
    expect(shortTime('09:00')).toBe('9:00');
    expect(shortTime('22:00')).toBe('22:00');
  });
});
