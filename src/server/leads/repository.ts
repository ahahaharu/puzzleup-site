import 'server-only';

import { eq } from 'drizzle-orm';

import type { Availability } from '@/lib/availability';
import type { LeadStatus } from '@/lib/lead';
import { consents, leadEvents, leads, tutorAvailability } from '@/server/db/schema';
import type { DbOrTx } from '@/server/outbox/enqueue';

import type { NewFormLead } from './domain';

/** Текущий статус занятости репетитора; строки нет – `undefined`. */
export async function findAvailability(
  db: DbOrTx,
  tutorId: string,
): Promise<Availability | undefined> {
  const [row] = await db
    .select({ status: tutorAvailability.status })
    .from(tutorAvailability)
    .where(eq(tutorAvailability.tutorId, tutorId));
  return row?.status;
}

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
