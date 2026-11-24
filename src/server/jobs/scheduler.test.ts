import { describe, expect, it } from 'vitest';

import { startScheduler } from './scheduler';

describe('startScheduler', () => {
  it('runs each job on its interval, logs failures and stops', async () => {
    let runs = 0;
    const logs: unknown[] = [];
    const scheduler = startScheduler(
      [
        { name: 'count', everyMs: 5, run: async () => (runs += 1) },
        {
          name: 'broken',
          everyMs: 1000,
          run: async () => {
            throw new TypeError('Мария');
          },
        },
      ],
      (event, fields) => logs.push({ event, ...fields }),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    await scheduler.stop();
    const stoppedAt = runs;
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(stoppedAt).toBeGreaterThan(1);
    expect(runs).toBe(stoppedAt);
    expect(logs).toEqual([{ event: 'job_error', job: 'broken', code: 'TypeError' }]);
  });
});
