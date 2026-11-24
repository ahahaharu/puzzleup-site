import 'server-only';

import type { Db } from '@/server/db/client';
import { outbox, type outboxTypeEnum } from '@/server/db/schema';

export type OutboxType = (typeof outboxTypeEnum.enumValues)[number];

/**
 * Только идентификаторы: заявка (`leadId`) или задание, которое ушло в `dead` (`outboxId` –
 * у `telegram.alert`). Обработчик сам читает данные из базы.
 */
export type OutboxPayload = { leadId: number } | { outboxId: number };

/** Транзакция Drizzle или сама база: задание ставится в той же транзакции, что и заявка. */
export type DbOrTx = Pick<Db, 'insert' | 'select' | 'update'>;

/**
 * Задания воркеру (docs/architecture.md, раздел 5). В payload – только идентификаторы:
 * обработчик сам читает заявку из базы, ПД в очереди не дублируются. Вставка будит воркер
 * триггером `pg_notify` (миграция 0001).
 */
export async function enqueue(
  db: DbOrTx,
  jobs: readonly { type: OutboxType; payload: OutboxPayload }[],
): Promise<void> {
  if (jobs.length === 0) return;
  await db.insert(outbox).values(jobs.map((job) => ({ type: job.type, payload: job.payload })));
}
