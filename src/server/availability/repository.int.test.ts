import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { tutorAvailability } from '../db/schema';
import { readAvailability } from './cache';
import { listAvailability, setAvailability } from './repository';
import { seedAvailability } from './seed';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seedAvailability(db, [
    { id: 't-anna', availability: 'available' },
    { id: 't-boris', availability: 'full' },
  ]);
});

const row = async (tutorId: string) =>
  (await db.select().from(tutorAvailability).where(eq(tutorAvailability.tutorId, tutorId)))[0];

describe('availability repository', () => {
  it('lists the current status of every tutor in the table', async () => {
    expect(await listAvailability(db)).toEqual({ 't-anna': 'available', 't-boris': 'full' });
    expect(
      await readAvailability(
        async () => db,
        () => {},
      ),
    ).toEqual({
      't-anna': 'available',
      't-boris': 'full',
    });
  });

  it('changes the status and remembers who and when', async () => {
    const at = new Date('2026-11-24T10:00:00Z');
    expect(await setAvailability(db, { tutorId: 't-anna', status: 'few', by: 't-anna', at })).toBe(
      'changed',
    );
    expect(await row('t-anna')).toEqual({
      tutorId: 't-anna',
      status: 'few',
      updatedAt: at,
      updatedBy: 't-anna',
    });
  });

  it('keeps the last real change when the status is the same', async () => {
    const later = new Date('2026-11-24T12:00:00Z');
    expect(
      await setAvailability(db, { tutorId: 't-anna', status: 'few', by: 't-anna', at: later }),
    ).toBe('unchanged');
    expect((await row('t-anna'))?.updatedAt).toEqual(new Date('2026-11-24T10:00:00Z'));
  });

  it('adds a tutor missing from the table', async () => {
    const at = new Date('2026-11-24T10:00:00Z');
    expect(await setAvailability(db, { tutorId: 't-vera', status: 'full', by: 't-vera', at })).toBe(
      'changed',
    );
    expect((await listAvailability(db))['t-vera']).toBe('full');
  });
});
