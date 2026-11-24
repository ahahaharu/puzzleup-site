import { and, asc, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { consents, leadEvents, leads, outbox, tutorAvailability } from '../db/schema';
import type { NewFormLead, NewManualLead } from './domain';
import { changeStatus, createLead, createManualLead } from './service';

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

const at = (iso: string) => ({ now: () => Date.parse(iso) });

const jobsOf = (leadId: number) =>
  db
    .select({ type: outbox.type })
    .from(outbox)
    .where(eq(outbox.payload, { leadId }))
    .orderBy(asc(outbox.id));

describe('changeStatus', () => {
  it('updates the lead, logs the event and enqueues the message edit and the sheet row', async () => {
    const { id } = await createLead(db, lead());
    const clock = at('2026-11-24T12:00:00Z');

    expect(
      await changeStatus(db, clock, { leadId: id, status: 'contacted', actor: 't-maxim' }),
    ).toEqual({ kind: 'changed' });

    const [row] = await db.select().from(leads).where(eq(leads.id, id));
    expect(row).toMatchObject({
      status: 'contacted',
      statusChangedBy: 't-maxim',
      statusChangedAt: new Date('2026-11-24T12:00:00Z'),
      rejectionReason: null,
    });
    const events = await db
      .select({ from: leadEvents.fromStatus, to: leadEvents.toStatus, actor: leadEvents.actor })
      .from(leadEvents)
      .where(and(eq(leadEvents.leadId, id), eq(leadEvents.type, 'status_changed')));
    expect(events).toEqual([{ from: 'new', to: 'contacted', actor: 't-maxim' }]);
    expect((await jobsOf(id)).map((job) => job.type)).toEqual([
      'telegram.lead_created',
      'sheets.upsert',
      'telegram.lead_updated',
      'sheets.upsert',
    ]);
  });

  it('does nothing when the status and the reason are the same', async () => {
    const { id } = await createLead(db, lead());
    const clock = at('2026-11-24T12:00:00Z');
    await changeStatus(db, clock, {
      leadId: id,
      status: 'rejected',
      reason: 'expensive',
      actor: 't-anna',
    });

    expect(
      await changeStatus(db, clock, {
        leadId: id,
        status: 'rejected',
        reason: 'expensive',
        actor: 't-anna',
      }),
    ).toEqual({ kind: 'unchanged' });
    expect(await jobsOf(id)).toHaveLength(4);
  });

  it('stores the rejection reason and clears it on the next status', async () => {
    const { id } = await createLead(db, lead());
    const clock = at('2026-11-24T12:00:00Z');
    await changeStatus(db, clock, {
      leadId: id,
      status: 'rejected',
      reason: 'expensive',
      actor: 't-anna',
    });
    await changeStatus(db, clock, {
      leadId: id,
      status: 'rejected',
      reason: 'schedule',
      actor: 't-anna',
    });
    const reason = async () =>
      (await db.select({ reason: leads.rejectionReason }).from(leads).where(eq(leads.id, id)))[0];
    expect(await reason()).toEqual({ reason: 'schedule' });

    await changeStatus(db, clock, { leadId: id, status: 'trial_scheduled', actor: 't-anna' });
    expect(await reason()).toEqual({ reason: null });
  });

  it('keeps the first trial and student dates', async () => {
    const { id } = await createLead(db, lead());
    const first = at('2026-11-24T12:00:00Z');
    const later = at('2026-12-01T12:00:00Z');
    await changeStatus(db, first, { leadId: id, status: 'trial_done', actor: 't-anna' });
    await changeStatus(db, first, { leadId: id, status: 'student', actor: 't-anna' });
    await changeStatus(db, later, { leadId: id, status: 'trial_done', actor: 't-anna' });
    await changeStatus(db, later, { leadId: id, status: 'student', actor: 't-anna' });

    const [row] = await db.select().from(leads).where(eq(leads.id, id));
    expect(row).toMatchObject({
      trialDoneAt: new Date('2026-11-24T12:00:00Z'),
      studentAt: new Date('2026-11-24T12:00:00Z'),
      statusChangedAt: new Date('2026-12-01T12:00:00Z'),
    });
  });

  it('reports a lead that no longer exists', async () => {
    expect(
      await changeStatus(db, at('2026-11-24T12:00:00Z'), {
        leadId: 999_999,
        status: 'contacted',
        actor: 't-anna',
      }),
    ).toEqual({ kind: 'not_found' });
  });
});

describe('createManualLead', () => {
  const manual = (overrides: Partial<NewManualLead> = {}): NewManualLead => ({
    tutorId: 't-manual',
    source: 'viber',
    grade: 8,
    subject: 'math',
    goal: 'exam9',
    referral: 'word_of_mouth',
    initialAvailability: 'available',
    ...overrides,
  });

  it('stores the lead without contacts as contacted, by the tutor who added it', async () => {
    const created = await createManualLead(db, at('2026-11-24T12:00:00Z'), manual());
    expect(created.status).toBe('contacted');

    const [row] = await db.select().from(leads).where(eq(leads.id, created.id));
    expect(row).toMatchObject({
      source: 'viber',
      parentName: null,
      phone: null,
      contactMethod: null,
      entry: null,
      landingPath: null,
      grade: 8,
      subjects: ['math'],
      goal: 'exam9',
      utmSource: 'word_of_mouth',
      status: 'contacted',
      statusChangedBy: 't-manual',
      createdAt: new Date('2026-11-24T12:00:00Z'),
    });
    expect(await db.select().from(consents).where(eq(consents.leadId, created.id))).toEqual([]);
    expect((await jobsOf(created.id)).map((job) => job.type)).toEqual([
      'telegram.lead_created',
      'sheets.upsert',
    ]);
  });

  it('puts the lead on the waitlist when the tutor is full', async () => {
    await db
      .insert(tutorAvailability)
      .values({ tutorId: 't-full', status: 'full', updatedBy: 'system' });
    const created = await createManualLead(
      db,
      at('2026-11-24T12:00:00Z'),
      manual({ tutorId: 't-full', goal: undefined }),
    );
    expect(created.status).toBe('waitlist');
  });
});
