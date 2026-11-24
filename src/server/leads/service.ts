import 'server-only';

import type { Db } from '@/server/db/client';
import { enqueue } from '@/server/outbox/enqueue';

import { initialStatus, type CreatedLead, type NewFormLead } from './domain';
import { findAvailability, insertFormLead } from './repository';

/**
 * Заявка с сайта – одна транзакция: `leads` + `consents` + `lead_events` + задания outbox
 * для Telegram и Таблицы (docs/architecture.md, раздел 5). Если у репетитора «Мест нет»,
 * заявка сразу получает статус `waitlist`. Ошибка откатывает всё: полузаписанной заявки нет.
 */
export async function createLead(db: Db, lead: NewFormLead): Promise<CreatedLead> {
  return db.transaction(async (tx) => {
    const availability = (await findAvailability(tx, lead.tutorId)) ?? lead.initialAvailability;
    const status = initialStatus(availability);
    const id = await insertFormLead(tx, lead, { status, availability });
    await enqueue(tx, [
      { type: 'telegram.lead_created', payload: { leadId: id } },
      { type: 'sheets.upsert', payload: { leadId: id } },
    ]);
    return { id, status };
  });
}
