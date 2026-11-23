import 'server-only';

import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const outboxTypeEnum = pgEnum('outbox_type', [
  'telegram.lead_created',
  'telegram.lead_updated',
  'telegram.reminder',
  'telegram.alert',
  'sheets.upsert',
]);

export const outboxStatusEnum = pgEnum('outbox_status', ['pending', 'processing', 'done', 'dead']);

/**
 * Очередь заданий для воркера – docs/architecture.md, раздел 5. Вставка будит воркер через
 * `pg_notify('outbox', id)` – триггер в миграции 0001.
 */
export const outbox = pgTable(
  'outbox',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    type: outboxTypeEnum('type').notNull(),
    // Только идентификаторы (`{ leadId }`): тип не даёт положить сюда строку с ПД.
    payload: jsonb('payload').$type<Record<string, number>>().notNull(),
    status: outboxStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    runAt: timestamptz('run_at').notNull().defaultNow(),
    lockedAt: timestamptz('locked_at'),
    // Код ошибки без ПД.
    lastError: text('last_error'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    doneAt: timestamptz('done_at'),
  },
  (t) => [index('outbox_status_run_at_idx').on(t.status, t.runAt)],
);

export const OUTBOX_CHANNEL = 'outbox';
