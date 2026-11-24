import 'server-only';

import { eq } from 'drizzle-orm';

import type { Availability } from '@/lib/availability';
import type { LeadStatus } from '@/lib/lead';
import { consents, leadEvents, leads } from '@/server/db/schema';
import type { DbOrTx } from '@/server/outbox/enqueue';

import type { Lead, NewFormLead, NewManualLead } from './domain';

/** Заявка, факт согласия и событие `created` в журнале. Возвращает номер заявки. */
export async function insertFormLead(
  db: DbOrTx,
  lead: NewFormLead,
  context: { status: LeadStatus; availability: Availability },
): Promise<number> {
  const [row] = await db
    .insert(leads)
    .values({
      tutorId: lead.tutorId,
      source: 'form',
      parentName: lead.parentName,
      phone: lead.phone,
      contactMethod: lead.contactMethod,
      grade: lead.grade,
      subjects: [...lead.subjects],
      goal: lead.goal ?? null,
      contactTime: [...lead.contactTime],
      comment: lead.comment ?? null,
      entry: lead.entry,
      landingPath: lead.landingPath,
      utmSource: lead.utm.utm_source ?? null,
      utmMedium: lead.utm.utm_medium ?? null,
      utmCampaign: lead.utm.utm_campaign ?? null,
      utmTerm: lead.utm.utm_term ?? null,
      utmContent: lead.utm.utm_content ?? null,
      availabilityAtSubmit: context.availability,
      status: context.status,
      statusChangedBy: 'system',
    })
    .returning({ id: leads.id });
  if (!row) throw new Error('Lead insert returned no row');

  await db.insert(consents).values({
    leadId: row.id,
    consentVersion: lead.consent.version,
    consentTextSha256: lead.consent.textSha256,
  });
  await db
    .insert(leadEvents)
    .values({ leadId: row.id, type: 'created', toStatus: context.status, actor: 'system' });
  return row.id;
}

/** Ручная заявка из `/add` и событие `created`: актор – репетитор, который её добавил. */
export async function insertManualLead(
  db: DbOrTx,
  lead: NewManualLead,
  context: { status: LeadStatus; availability: Availability; at: Date },
): Promise<number> {
  const [row] = await db
    .insert(leads)
    .values({
      createdAt: context.at,
      tutorId: lead.tutorId,
      source: lead.source,
      grade: lead.grade,
      subjects: [lead.subject],
      goal: lead.goal ?? null,
      utmSource: lead.referral,
      availabilityAtSubmit: context.availability,
      status: context.status,
      statusChangedAt: context.at,
      statusChangedBy: lead.tutorId,
    })
    .returning({ id: leads.id });
  if (!row) throw new Error('Lead insert returned no row');
  await db.insert(leadEvents).values({
    leadId: row.id,
    at: context.at,
    type: 'created',
    toStatus: context.status,
    actor: lead.tutorId,
  });
  return row.id;
}

export async function findLead(db: DbOrTx, id: number): Promise<Lead | undefined> {
  const [row] = await db.select().from(leads).where(eq(leads.id, id));
  return row;
}

/** Сообщение заявки в общем чате – чтобы потом его редактировать. */
export async function saveTelegramMessageId(db: DbOrTx, id: number, messageId: number) {
  await db.update(leads).set({ telegramMessageId: messageId }).where(eq(leads.id, id));
}
