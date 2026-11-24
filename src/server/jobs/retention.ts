import 'server-only';

import { and, eq, inArray, lt, sql } from 'drizzle-orm';

import type { Clock } from '@/lib/time';
import type { Db } from '@/server/db/client';
import { leads, outbox } from '@/server/db/schema';

/** Срок хранения заявки после последней смены статуса (ADR-012, политика конфиденциальности). */
export const LEAD_RETENTION = '6 months';

/** Сколько хранятся выполненные задания outbox. */
export const OUTBOX_DONE_RETENTION = '30 days';

/**
 * Удаление по сроку (docs/data-model.md, «Удаление по сроку»): заявки, у которых статус не менялся
 * 6 месяцев, удаляются вместе с согласиями и журналом (каскад). Месяцы – календарные, как
 * `interval` в Postgres. Незавершённые задания outbox на эти заявки закрываются `done` с пометкой
 * `lead_deleted`; строки в Таблице остаются. Возвращает число удалённых заявок.
 */
export async function deleteExpiredLeads(db: Db, clock: Clock): Promise<number> {
  const now = new Date(clock.now());
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(leads)
      .where(lt(leads.statusChangedAt, sql`${now}::timestamptz - ${LEAD_RETENTION}::interval`))
      .returning({ id: leads.id });
    const ids = deleted.map((lead) => lead.id);
    if (ids.length > 0) {
      // `processing` не трогаем: обработчик не найдёт заявку и закроет задание сам.
      await tx
        .update(outbox)
        .set({ status: 'done', doneAt: now, lockedAt: null, lastError: 'lead_deleted' })
        .where(
          and(
            inArray(outbox.status, ['pending', 'dead']),
            inArray(sql`(${outbox.payload} ->> 'leadId')::bigint`, ids),
          ),
        );
    }
    return ids.length;
  });
}

/** Очистка outbox (docs/architecture.md, раздел 7): `done`-задания старше 30 дней. */
export async function deleteOldOutboxJobs(db: Db, clock: Clock): Promise<number> {
  const now = new Date(clock.now());
  const deleted = await db
    .delete(outbox)
    .where(
      and(
        eq(outbox.status, 'done'),
        lt(outbox.doneAt, sql`${now}::timestamptz - ${OUTBOX_DONE_RETENTION}::interval`),
      ),
    )
    .returning({ id: outbox.id });
  return deleted.length;
}
