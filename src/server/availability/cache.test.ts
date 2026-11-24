import { describe, expect, it, vi } from 'vitest';

import { readAvailability } from './cache';

describe('readAvailability', () => {
  it('returns nothing without a database, silently', async () => {
    const log = vi.fn();
    expect(await readAvailability(async () => undefined, log)).toBeUndefined();
    expect(log).not.toHaveBeenCalled();
  });

  it('returns nothing and logs the code when the database fails', async () => {
    const log = vi.fn();
    const refused = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
      code: 'ECONNREFUSED',
    });
    expect(
      await readAvailability(async () => {
        throw refused;
      }, log),
    ).toBeUndefined();
    expect(log).toHaveBeenCalledWith('Error:ECONNREFUSED');
  });
});
