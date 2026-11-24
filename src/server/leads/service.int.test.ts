import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { consents, leadEvents, leads, outbox, tutorAvailability } from '../db/schema';
import type { NewFormLead } from './domain';
import { createLead } from './service';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

// Только выдуманные данные (docs/conventions.md, «Тесты»).
const lead = (overrides: Partial<NewFormLead> = {}): NewFormLead => ({
  tutorId: 't-anna',
  parentName: 'Мария',
  phone: '+375290000000',
  contactMethod: 'telegram',
  grade: 7,
  subjects: ['math'],
  contactTime: ['evening'],
  entry: 'tutors',
  landingPath: '/tutors/anna',
  utm: { utm_source: 'instagram', utm_campaign: 'winter' },
  initialAvailability: 'available',
  consent: { version: '2026-11-12', textSha256: 'a'.repeat(64) },
  ...overrides,
});

describe('createLead', () => {
  it('writes the lead, the consent, the event and two outbox jobs', async () => {
    const created = await createLead(db, lead());
    expect(created).toEqual({ id: expect.any(Number), status: 'new' });
    expect(created.id).toBeGreaterThanOrEqual(1001);

    const [row] = await db.select().from(leads).where(eq(leads.id, created.id));
    expect(row).toMatchObject({
      tutorId: 't-anna',
      source: 'form',
      phone: '+375290000000',
      grade: 7,
      subjects: ['math'],
      goal: null,
      contactTime: ['evening'],
      entry: 'tutors',
      landingPath: '/tutors/anna',
      utmSource: 'instagram',
      utmCampaign: 'winter',
      utmMedium: null,
      availabilityAtSubmit: 'available',
      status: 'new',
    });

    expect(
      await db
        .select({ version: consents.consentVersion })
        .from(consents)
        .where(eq(consents.leadId, created.id)),
    ).toEqual([{ version: '2026-11-12' }]);
    expect(
      await db
        .select({ type: leadEvents.type, to: leadEvents.toStatus, actor: leadEvents.actor })
        .from(leadEvents)
        .where(eq(leadEvents.leadId, created.id)),
    ).toEqual([{ type: 'created', to: 'new', actor: 'system' }]);

    const jobs = await db.select({ type: outbox.type, payload: outbox.payload }).from(outbox);
    expect(jobs.filter((job) => job.payload.leadId === created.id)).toEqual([
      { type: 'telegram.lead_created', payload: { leadId: created.id } },
      { type: 'sheets.upsert', payload: { leadId: created.id } },
    ]);
  });

  it('puts the lead on the waitlist when the tutor status in the database is full', async () => {
    await db
      .insert(tutorAvailability)
      .values({ tutorId: 't-vera', status: 'full', updatedBy: 't-vera' });
    const created = await createLead(
      db,
      lead({ tutorId: 't-vera', initialAvailability: 'available' }),
    );
    expect(created.status).toBe('waitlist');
    const [row] = await db.select().from(leads).where(eq(leads.id, created.id));
    expect(row?.availabilityAtSubmit).toBe('full');
  });

  it('falls back to the initial status from content when the table has no row', async () => {
    const created = await createLead(db, lead({ tutorId: 't-igor', initialAvailability: 'full' }));
    expect(created.status).toBe('waitlist');
  });

  it('rolls everything back when a part of the transaction fails', async () => {
    const before = await db.$count(leads);
    const jobsBefore = await db.$count(outbox);
    // Хеш согласия не проходит CHECK – падает вторая вставка, заявка тоже откатывается.
    await expect(
      createLead(db, lead({ consent: { version: '2026-11-12', textSha256: 'not-a-hash' } })),
    ).rejects.toThrow();
    expect(await db.$count(leads)).toBe(before);
    expect(await db.$count(outbox)).toBe(jobsBefore);
  });
});
