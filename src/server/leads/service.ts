import 'server-only';

import { eq, sql } from 'drizzle-orm';

import type { Clock } from '@/lib/time';
import type { Db } from '@/server/db/client';
import { leadEvents, leads } from '@/server/db/schema';
import { enqueue } from '@/server/outbox/enqueue';

import {
  initialStatus,
  manualInitialStatus,
  type CreatedLead,
  type NewFormLead,
  type NewManualLead,
  type StatusChange,
  type StatusChangeResult,
} from './domain';
import { findAvailability, insertFormLead, insertManualLead } from './repository';

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

/**
 * Ручная заявка из `/add` (ТЗ главной, раздел 8): без имени и контакта, статус «связался»
 * или «лист ожидания», если у репетитора «Мест нет». Та же транзакция с outbox, что у формы:
 * сообщение в общем чате и строка Таблицы появятся из очереди.
 */
export async function createManualLead(
  db: Db,
  clock: Clock,
  lead: NewManualLead,
): Promise<CreatedLead> {
  return db.transaction(async (tx) => {
    const availability = (await findAvailability(tx, lead.tutorId)) ?? lead.initialAvailability;
    const status = manualInitialStatus(availability);
    const id = await insertManualLead(tx, lead, {
      status,
      availability,
      at: new Date(clock.now()),
    });
    await enqueue(tx, [
      { type: 'telegram.lead_created', payload: { leadId: id } },
      { type: 'sheets.upsert', payload: { leadId: id } },
    ]);
    return { id, status };
  });
}

/**
 * Смена статуса кнопкой бота (docs/architecture.md, раздел 6): заявка, событие в журнале и
 * задания на правку сообщения и строки Таблицы – одной транзакцией. Строка блокируется, чтобы
 * одновременные нажатия двух репетиторов не разошлись с журналом. Причина хранится только
 * у отказа; даты первого пробного и первого «ученика» не перезаписываются.
 */
export async function changeStatus(
  db: Db,
  clock: Clock,
  change: StatusChange,
): Promise<StatusChangeResult> {
  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select({ status: leads.status, rejectionReason: leads.rejectionReason })
      .from(leads)
      .where(eq(leads.id, change.leadId))
      .for('update');
    if (!lead) return { kind: 'not_found' };

    const reason = change.status === 'rejected' ? change.reason : null;
    if (lead.status === change.status && lead.rejectionReason === reason) {
      return { kind: 'unchanged' };
    }

    const at = new Date(clock.now());
    await tx
      .update(leads)
      .set({
        status: change.status,
        rejectionReason: reason,
        statusChangedAt: at,
        statusChangedBy: change.actor,
        ...(change.status === 'trial_done' && {
          trialDoneAt: sql`coalesce(${leads.trialDoneAt}, ${at.toISOString()}::timestamptz)`,
        }),
        ...(change.status === 'student' && {
          studentAt: sql`coalesce(${leads.studentAt}, ${at.toISOString()}::timestamptz)`,
        }),
      })
      .where(eq(leads.id, change.leadId));
    await tx.insert(leadEvents).values({
      leadId: change.leadId,
      at,
      type: 'status_changed',
      fromStatus: lead.status,
      toStatus: change.status,
      actor: change.actor,
    });
    await enqueue(tx, [
      { type: 'telegram.lead_updated', payload: { leadId: change.leadId } },
      { type: 'sheets.upsert', payload: { leadId: change.leadId } },
    ]);
    return { kind: 'changed' };
  });
}
