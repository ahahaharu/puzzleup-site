import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { systemClock } from '@/lib/time';

import { createTestDb } from '../../../../tests/setup/db';
import { directory } from '../../bot/fixtures';
import type { Db } from '../../db/client';
import { leads } from '../../db/schema';
import { changeStatus, createLead } from '../../leads/service';
import { fakeSheets } from '../../sheets/fixtures';
import { LEAD_COLUMNS } from '../../sheets/row';
import type { OutboxJob } from '../worker';
import { sheetsHandlers } from './sheets';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

const signal = new AbortController().signal;

function setup(options: Parameters<typeof fakeSheets>[0] = {}) {
  const sheets = fakeSheets({ rows: [[...LEAD_COLUMNS]], ...options });
  const handler = sheetsHandlers({ db, sheets: sheets.port, directory })['sheets.upsert'];
  const run = async (payload: Record<string, number>) => {
    if (!handler) throw new Error('no handler for sheets.upsert');
    const job: OutboxJob = { id: 1, type: 'sheets.upsert', payload, attempts: 1 };
    await handler(job, signal);
  };
  return { sheets, run };
}

const newLead = async () =>
  (
    await createLead(db, {
      tutorId: 't-anna',
      parentName: 'Мария',
      phone: '+375290000000',
      contactMethod: 'viber',
      grade: 9,
      subjects: ['math'],
      comment: 'Сложно с дробями',
      contactTime: ['day'],
      entry: 'tutors',
      landingPath: '/',
      utm: { utm_source: 'instagram', utm_medium: 'cpc' },
      initialAvailability: 'available',
      consent: { version: '2026-11-12', textSha256: 'a'.repeat(64) },
    })
  ).id;

describe('sheets.upsert', () => {
  it('appends the anonymised row of a new lead', async () => {
    const { sheets, run } = setup();
    const id = await newLead();
    await run({ leadId: id });

    expect(sheets.rows).toHaveLength(2);
    const row = sheets.rows[1] ?? [];
    expect(row).toHaveLength(LEAD_COLUMNS.length);
    expect([row[0], row[2], row[3], row[6], row[7], row[8], row[9], row[12]]).toEqual([
      id,
      'Анна',
      9,
      'форма',
      'tutors',
      'instagram',
      'cpc',
      'новая',
    ]);
    expect(row.join('|')).not.toMatch(/Мария|375290000000|дробями/);
  });

  it('rewrites the same row after a status change', async () => {
    const { sheets, run } = setup();
    const id = await newLead();
    await run({ leadId: id });
    await changeStatus(db, systemClock, { leadId: id, actor: 't-anna', status: 'trial_done' });
    await run({ leadId: id });

    expect(sheets.calls).toEqual(['readKeys', 'appendRow', 'readKeys', 'updateRows:2']);
    expect(sheets.rows).toHaveLength(2);
    expect(sheets.rows[1]?.[12]).toBe('пробное проведено');
    expect(typeof sheets.rows[1]?.[13]).toBe('number');
  });

  it('leaves the row alone when the lead was deleted by retention', async () => {
    const { sheets, run } = setup();
    const id = await newLead();
    await db.delete(leads).where(eq(leads.id, id));
    await run({ leadId: id });
    expect(sheets.calls).toEqual([]);
  });

  it('rejects a payload without leadId', async () => {
    const { run } = setup();
    await expect(run({ outboxId: 1 })).rejects.toMatchObject({ code: 'bad_payload' });
  });

  it('lets the worker retry when the API fails', async () => {
    const { run } = setup({ fail: true });
    const id = await newLead();
    await expect(run({ leadId: id })).rejects.toMatchObject({ code: '503' });
  });
});
