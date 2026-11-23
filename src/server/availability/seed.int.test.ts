import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { tutorAvailability } from '../db/schema';
import { seedAvailability } from './seed';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

const statuses = async () =>
  Object.fromEntries(
    (await db.select().from(tutorAvailability)).map((row) => [row.tutorId, row.status]),
  );

describe('seedAvailability', () => {
  it('writes the initial status for tutors missing from the table', async () => {
    const added = await seedAvailability(db, [
      { id: 't-anna', availability: 'available' },
      { id: 't-boris', availability: 'full' },
    ]);
    expect(added).toEqual(['t-anna', 't-boris']);
    expect(await statuses()).toEqual({ 't-anna': 'available', 't-boris': 'full' });
    const [row] = await db
      .select()
      .from(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, 't-anna'));
    expect(row?.updatedBy).toBe('system');
  });

  it('keeps a status already set with /status and adds only new tutors', async () => {
    await db
      .update(tutorAvailability)
      .set({ status: 'few', updatedBy: 't-anna' })
      .where(eq(tutorAvailability.tutorId, 't-anna'));

    const added = await seedAvailability(db, [
      { id: 't-anna', availability: 'available' },
      { id: 't-boris', availability: 'available' },
      { id: 't-vera', availability: 'few' },
    ]);

    expect(added).toEqual(['t-vera']);
    expect(await statuses()).toEqual({ 't-anna': 'few', 't-boris': 'full', 't-vera': 'few' });
  });

  it('does nothing without tutors', async () => {
    expect(await seedAvailability(db, [])).toEqual([]);
  });
});
