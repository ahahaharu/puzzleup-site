import 'server-only';

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { availabilityEnum } from './enums';

/**
 * Текущий статус занятости репетитора (ADR-016): меняется командой `/status`.
 * Начальное значение – из `availability` в MDX, src/server/availability/seed.ts.
 */
export const tutorAvailability = pgTable('tutor_availability', {
  tutorId: text('tutor_id').primaryKey(),
  status: availabilityEnum('status').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // tutorId или `system` (начальное заполнение).
  updatedBy: text('updated_by').notNull(),
});
