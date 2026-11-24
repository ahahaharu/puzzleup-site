import { describe, expect, it } from 'vitest';

import {
  formatDateTime,
  formatLongDate,
  isWithinHours,
  minskYear,
  msUntilMinskTime,
  shortTime,
} from './time';

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

describe('formatLongDate', () => {
  it('writes the month in words without «г.»', () => {
    expect(formatLongDate('2026-10-12')).toBe('12 октября 2026');
    expect(formatLongDate('2026-01-01')).toBe('1 января 2026');
  });
});

describe('isWithinHours', () => {
  const hours = { from: '09:00', to: '22:00' };

  it('uses Minsk time (UTC+3)', () => {
    expect(isWithinHours(Date.parse('2026-11-24T05:59:59Z'), hours)).toBe(false);
    expect(isWithinHours(Date.parse('2026-11-24T06:00:00Z'), hours)).toBe(true);
  });

  it('includes the start and excludes the end', () => {
    expect(isWithinHours(Date.parse('2026-11-24T18:59:00Z'), hours)).toBe(true);
    expect(isWithinHours(Date.parse('2026-11-24T19:00:00Z'), hours)).toBe(false);
  });

  it('treats the night after midnight as outside the hours', () => {
    expect(isWithinHours(Date.parse('2026-11-24T23:30:00Z'), hours)).toBe(false);
  });
});

describe('formatDateTime', () => {
  it('formats the moment in Minsk time', () => {
    // 11:05 UTC – 14:05 в Минске (UTC+3).
    expect(formatDateTime(Date.parse('2026-11-24T11:05:00Z'))).toBe('24 ноября, 14:05');
  });

  it('uses the Minsk date after 21:00 UTC', () => {
    expect(formatDateTime(Date.parse('2026-12-31T21:30:00Z'))).toBe('1 января, 00:30');
  });
});

describe('msUntilMinskTime', () => {
  const minutes = (ms: number) => ms / 60_000;

  it('waits until today when the time is ahead', () => {
    // 00:30 UTC – 03:30 в Минске.
    expect(minutes(msUntilMinskTime('03:30', Date.parse('2026-11-24T00:00:00Z')))).toBe(30);
  });

  it('waits until tomorrow when the time has passed or is now', () => {
    expect(minutes(msUntilMinskTime('03:30', Date.parse('2026-11-24T00:30:00Z')))).toBe(24 * 60);
    expect(minutes(msUntilMinskTime('03:30', Date.parse('2026-11-24T12:00:00Z')))).toBe(12.5 * 60);
  });

  it('counts across the Minsk midnight', () => {
    // 21:00 UTC – 00:00 в Минске следующего дня.
    expect(minutes(msUntilMinskTime('03:30', Date.parse('2026-12-31T21:00:00Z')))).toBe(210);
  });
});
