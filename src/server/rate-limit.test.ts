import { describe, expect, it } from 'vitest';

import { createMemoryRateLimiter } from './rate-limit';

describe('createMemoryRateLimiter', () => {
  const minute = 60_000;

  it('allows five attempts in ten minutes and blocks the sixth', () => {
    const limiter = createMemoryRateLimiter({ limit: 5, windowMs: 10 * minute });
    const results = Array.from({ length: 6 }, (_, index) => limiter.hit('ip', index * minute));
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it('allows again once the oldest attempt leaves the window', () => {
    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 10 * minute });
    limiter.hit('ip', 0);
    limiter.hit('ip', minute);
    expect(limiter.hit('ip', 5 * minute)).toBe(false);
    expect(limiter.hit('ip', 10 * minute + 1)).toBe(true);
  });

  it('counts each key separately', () => {
    const limiter = createMemoryRateLimiter({ limit: 1, windowMs: minute });
    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('b', 0)).toBe(true);
    expect(limiter.hit('a', 1)).toBe(false);
  });
});
