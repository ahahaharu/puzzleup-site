import { asc } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { consents, leadEvents, leads, outbox } from '../db/schema';
import { deleteExpiredLeads, deleteOldOutboxJobs } from './retention';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

beforeEach(async () => {
  await db.delete(outbox);
  await db.delete(leads);
});

const at = (iso: string) => ({ now: () => Date.parse(iso) });

async function addLead(statusChangedAt: string) {
  const [row] = await db
    .insert(leads)
    .values({
      tutorId: 't-anna',
      source: 'call',
      grade: 7,
      subjects: ['math'],
      status: 'contacted',
      createdAt: new Date('2025-01-10T10:00:00Z'),
      statusChangedAt: new Date(statusChangedAt),
    })
    .returning({ id: leads.id });
  if (!row) throw new Error('no row');
  await db.insert(consents).values({
    leadId: row.id,
    consentVersion: '2026-11-11',
    consentTextSha256: 'a'.repeat(64),
  });
  await db
    .insert(leadEvents)
    .values({ leadId: row.id, type: 'created', toStatus: 'contacted', actor: 't-anna' });
  return row.id;
}

const leadIds = async () =>
  (await db.select({ id: leads.id }).from(leads).orderBy(asc(leads.id))).map((row) => row.id);

describe('deleteExpiredLeads', () => {
  it('deletes leads 6 calendar months after the last status change, with cascade', async () => {
    // 24 ноября − 6 месяцев – 24 мая по календарю Postgres; 180 дней дали бы 28 мая.
    await addLead('2026-05-23T23:59:59Z');
    const kept = await addLead('2026-05-24T00:00:00Z');
    const fresh = await addLead('2026-11-20T09:00:00Z');

    expect(await deleteExpiredLeads(db, at('2026-11-24T00:00:00Z'))).toBe(1);
    expect(await leadIds()).toEqual([kept, fresh]);
    const left = (rows: { leadId: number }[]) => rows.map((row) => row.leadId).sort();
    expect(left(await db.select({ leadId: consents.leadId }).from(consents))).toEqual([
      kept,
      fresh,
    ]);
    expect(left(await db.select({ leadId: leadEvents.leadId }).from(leadEvents))).toEqual([
      kept,
      fresh,
    ]);

    expect(await deleteExpiredLeads(db, at('2026-11-24T00:00:00Z'))).toBe(0);
  });

  it('closes unfinished outbox jobs of deleted leads as lead_deleted', async () => {
    const expired = await addLead('2026-01-01T00:00:00Z');
    const kept = await addLead('2026-11-01T00:00:00Z');
    await db.insert(outbox).values([
      { type: 'sheets.upsert', payload: { leadId: expired }, status: 'pending' },
      { type: 'telegram.lead_updated', payload: { leadId: expired }, status: 'dead' },
      { type: 'telegram.reminder', payload: { leadId: expired }, status: 'processing' },
      { type: 'sheets.upsert', payload: { leadId: kept }, status: 'pending' },
      { type: 'telegram.alert', payload: { outboxId: expired }, status: 'pending' },
    ]);

    await deleteExpiredLeads(db, at('2026-11-24T00:00:00Z'));

    const jobs = await db
      .select({ status: outbox.status, lastError: outbox.lastError, doneAt: outbox.doneAt })
      .from(outbox)
      .orderBy(asc(outbox.id));
    const done = { status: 'done', lastError: 'lead_deleted', doneAt: new Date('2026-11-24') };
    expect(jobs).toEqual([
      done,
      done,
      { status: 'processing', lastError: null, doneAt: null },
      { status: 'pending', lastError: null, doneAt: null },
      { status: 'pending', lastError: null, doneAt: null },
    ]);
  });
});

describe('deleteOldOutboxJobs', () => {
  it('deletes done jobs older than 30 days and keeps the rest', async () => {
    const job = (status: 'pending' | 'done' | 'dead', doneAt: string | null) => ({
      type: 'sheets.upsert' as const,
      payload: { leadId: 1001 },
      status,
      doneAt: doneAt === null ? null : new Date(doneAt),
    });
    await db
      .insert(outbox)
      .values([
        job('done', '2026-10-24T23:59:59Z'),
        job('done', '2026-10-25T00:00:00Z'),
        job('dead', null),
        job('pending', null),
      ]);

    expect(await deleteOldOutboxJobs(db, at('2026-11-24T00:00:00Z'))).toBe(1);
    const left = await db.select({ status: outbox.status }).from(outbox).orderBy(asc(outbox.id));
    expect(left).toEqual([{ status: 'done' }, { status: 'dead' }, { status: 'pending' }]);
  });
});
