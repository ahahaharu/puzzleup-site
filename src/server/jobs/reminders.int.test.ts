import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { leads, outbox } from '../db/schema';
import { enqueueReminders } from './reminders';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

beforeEach(async () => {
  await db.delete(outbox);
  await db.delete(leads);
});

const HOURS = { from: '09:00', to: '22:00' };
const at = (iso: string) => ({ now: () => Date.parse(iso) });

async function addLead(createdAt: string, status: 'new' | 'contacted' = 'new') {
  const [row] = await db
    .insert(leads)
    .values({
      createdAt: new Date(createdAt),
      tutorId: 't-anna',
      source: 'call',
      grade: 7,
      subjects: ['math'],
      status,
    })
    .returning({ id: leads.id });
  if (!row) throw new Error('no row');
  return row.id;
}

const reminders = () =>
  db.select({ payload: outbox.payload }).from(outbox).where(eq(outbox.type, 'telegram.reminder'));

describe('enqueueReminders', () => {
  it('queues one reminder for a lead new for 2 hours', async () => {
    // 12:00 UTC – 15:00 в Минске.
    const due = await addLead('2026-11-24T10:00:00Z');
    await addLead('2026-11-24T10:30:00Z');
    await addLead('2026-11-24T09:00:00Z', 'contacted');

    expect(await enqueueReminders(db, at('2026-11-24T12:00:00Z'), HOURS)).toBe(1);
    expect(await enqueueReminders(db, at('2026-11-24T12:01:00Z'), HOURS)).toBe(0);
    expect(await reminders()).toEqual([{ payload: { leadId: due } }]);
    const [row] = await db.select().from(leads).where(eq(leads.id, due));
    expect(row?.reminderSentAt).toEqual(new Date('2026-11-24T12:00:00Z'));
  });

  it('holds night reminders until 9:00 in Minsk', async () => {
    // Заявка в 23:00 по Минску.
    const id = await addLead('2026-11-24T20:00:00Z');
    expect(await enqueueReminders(db, at('2026-11-25T05:59:00Z'), HOURS)).toBe(0);
    expect(await enqueueReminders(db, at('2026-11-25T06:00:00Z'), HOURS)).toBe(1);
    expect(await reminders()).toEqual([{ payload: { leadId: id } }]);
  });
});
