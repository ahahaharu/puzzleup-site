import 'server-only';

import type { Availability } from '@/lib/availability';
import type { Db } from '@/server/db/client';
import { tutorAvailability } from '@/server/db/schema';

export type TutorAvailabilitySeed = { id: string; availability: Availability };

/**
 * Начальный статус занятости из `availability` в MDX – только для репетиторов, которых ещё нет
 * в таблице (docs/data-model.md, `tutor_availability`). Записанный через `/status` статус
 * не трогает, поэтому запускается при каждом `pnpm db:migrate`. Возвращает добавленные id.
 */
export async function seedAvailability(
  db: Db,
  tutors: readonly TutorAvailabilitySeed[],
): Promise<string[]> {
  if (tutors.length === 0) return [];
  const rows = await db
    .insert(tutorAvailability)
    .values(tutors.map((t) => ({ tutorId: t.id, status: t.availability, updatedBy: 'system' })))
    .onConflictDoNothing({ target: tutorAvailability.tutorId })
    .returning({ tutorId: tutorAvailability.tutorId });
  return rows.map((row) => row.tutorId);
}
