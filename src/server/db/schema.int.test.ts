import { eq, sql } from 'drizzle-orm';
import { Client } from 'pg';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from './client';
import { consents, leadEvents, leads, outbox } from './schema';

// Выдуманные данные (docs/conventions.md, «Тесты»).
const formLead = {
  tutorId: 't-andrei',
  source: 'form',
  parentName: 'Мария',
  phone: '+375290000000',
  contactMethod: 'telegram',
  grade: 7,
  subjects: ['math'],
  entry: 'hero',
  landingPath: '/tutors/andrei',
} satisfies typeof leads.$inferInsert;

let db: Db;
let url: string;

beforeAll(async () => {
  ({ db, url } = await createTestDb());
});

/** Код нарушения из Postgres: drizzle заворачивает ошибку драйвера в `cause`. */
async function pgError(promise: Promise<unknown>) {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  const cause = error instanceof Error ? error.cause : undefined;
  return cause !== null && typeof cause === 'object' && 'constraint' in cause
    ? cause.constraint
    : error;
}

describe('leads', () => {
  it('numbers leads from 1001 with defaults from the data model', async () => {
    const [lead] = await db.insert(leads).values(formLead).returning();
    expect(lead).toMatchObject({ id: 1001, status: 'new', contactTime: [], goal: null });
    expect(lead?.statusChangedAt).toBeInstanceOf(Date);
  });

  it('accepts a manual lead from /add without name, contact and entry', async () => {
    const [lead] = await db
      .insert(leads)
      .values({ tutorId: 't-maxim', source: 'telegram', grade: 10, subjects: ['math'] })
      .returning({ entry: leads.entry, parentName: leads.parentName });
    expect(lead).toEqual({ entry: null, parentName: null });
  });

  it.each(['parentName', 'phone', 'contactMethod', 'entry', 'landingPath'] as const)(
    'requires %s for a form lead',
    async (field) => {
      expect(await pgError(db.insert(leads).values({ ...formLead, [field]: null }))).toBe(
        'leads_form_fields_check',
      );
    },
  );

  it.each([
    ['phone', { phone: '80290000000' }, 'leads_phone_check'],
    ['grade', { grade: 12 }, 'leads_grade_check'],
    ['subjects', { subjects: [] }, 'leads_subjects_check'],
    ['comment', { comment: 'а'.repeat(1001) }, 'leads_comment_check'],
  ] satisfies [string, Partial<typeof leads.$inferInsert>, string][])(
    'rejects invalid %s',
    async (_, patch, constraint) => {
      expect(await pgError(db.insert(leads).values({ ...formLead, ...patch }))).toBe(constraint);
    },
  );

  it('deletes consents and events together with the lead', async () => {
    const [lead] = await db.insert(leads).values(formLead).returning({ id: leads.id });
    const leadId = lead!.id;
    await db.insert(consents).values({
      leadId,
      consentVersion: '2026-12-01',
      consentTextSha256: 'a'.repeat(64),
    });
    await db
      .insert(leadEvents)
      .values({ leadId, type: 'created', toStatus: 'new', actor: 'system' });

    await db.delete(leads).where(eq(leads.id, leadId));

    const left = await db.execute<{ count: number }>(
      sql`SELECT (SELECT count(*) FROM consents WHERE lead_id = ${leadId})
               + (SELECT count(*) FROM lead_events WHERE lead_id = ${leadId}) AS count`,
    );
    expect(Number(left.rows[0]?.count)).toBe(0);
  });
});

describe('outbox', () => {
  it('notifies the worker channel with the job id on insert', async () => {
    const listener = new Client({ connectionString: url });
    await listener.connect();
    try {
      await listener.query('LISTEN outbox');
      const notified = new Promise<string | undefined>((resolve) =>
        listener.once('notification', (message) => resolve(message.payload)),
      );

      const [job] = await db
        .insert(outbox)
        .values({ type: 'telegram.lead_created', payload: { leadId: 1001 } })
        .returning();

      expect(await notified).toBe(String(job!.id));
      expect(job).toMatchObject({ status: 'pending', attempts: 0, lockedAt: null });
    } finally {
      await listener.end();
    }
  });
});
