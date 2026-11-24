import { describe, expect, it } from 'vitest';

import { backoffMs, MAX_ATTEMPTS } from './backoff';

describe('backoffMs', () => {
  it('waits 10 s, 30 s, 1 min, 5 min, 15 min, 1 h and then hourly', () => {
    const delays = Array.from({ length: MAX_ATTEMPTS }, (_, i) => backoffMs(i + 1) / 1000);
    expect(delays).toEqual([10, 30, 60, 300, 900, 3600, 3600, 3600, 3600, 3600]);
  });

  it('treats zero attempts as the first one', () => {
    expect(backoffMs(0)).toBe(10_000);
  });
});
