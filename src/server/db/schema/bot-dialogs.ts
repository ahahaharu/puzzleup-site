import 'server-only';

import { bigint, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Состояние пошаговых диалогов бота (`/add`, причина отказа) – без in-memory сессий
 * (docs/architecture.md, раздел 6). У пользователя в чате один активный диалог (ADR-048).
 */
export const botDialogs = pgTable(
  'bot_dialogs',
  {
    chatId: bigint('chat_id', { mode: 'number' }).notNull(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    kind: text('kind').notNull(),
    step: text('step').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    // 30 минут от последнего шага.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.chatId, t.userId] })],
);
