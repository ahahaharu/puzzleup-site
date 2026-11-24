import 'server-only';

import { sql } from 'drizzle-orm';

import type { Availability, AvailabilityMap } from '@/lib/availability';
import type { Db } from '@/server/db/client';
import { tutorAvailability } from '@/server/db/schema';

export async function listAvailability(db: Db): Promise<AvailabilityMap> {
  const rows = await db
    .select({ tutorId: tutorAvailability.tutorId, status: tutorAvailability.status })
    .from(tutorAvailability);
  return Object.fromEntries(rows.map((row) => [row.tutorId, row.status]));
}

/**
 * Статус из `/status`. Строки нет (репетитор добавлен после `db:migrate`) – она создаётся.
 * Тот же статус не трогает строку: `updated_at` и `updated_by` – последней настоящей смены.
 */
export async function setAvailability(
  db: Db,
  input: { tutorId: string; status: Availability; by: string; at: Date },
): Promise<'changed' | 'unchanged'> {
  const values = { status: input.status, updatedAt: input.at, updatedBy: input.by };
  const rows = await db
    .insert(tutorAvailability)
    .values({ tutorId: input.tutorId, ...values })
    .onConflictDoUpdate({
      target: tutorAvailability.tutorId,
      set: values,
      setWhere: sql`${tutorAvailability.status} <> excluded.status`,
    })
    .returning({ tutorId: tutorAvailability.tutorId });
  return rows.length > 0 ? 'changed' : 'unchanged';
}
