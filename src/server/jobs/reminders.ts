import 'server-only';

import { and, eq, isNull, lte } from 'drizzle-orm';

import { isWithinHours, type Clock } from '@/lib/time';
import { REMINDER_AFTER_HOURS } from '@/server/bot/format';
import type { Db } from '@/server/db/client';
import { leads } from '@/server/db/schema';
import { enqueue } from '@/server/outbox/enqueue';

/**
 * Напоминания (docs/architecture.md, раздел 7): заявка 2 часа в статусе «новая» – задание
 * `telegram.reminder`, по одному на заявку. Только в часы ответа по Минску: ночью заявки ждут
 * и получают напоминание в начале дня (ТЗ главной, раздел 8). Возвращает число напоминаний.
 */
export async function enqueueReminders(
  db: Db,
  clock: Clock,
  hours: { from: string; to: string },
): Promise<number> {
  const now = clock.now();
  if (!isWithinHours(now, hours)) return 0;
  return db.transaction(async (tx) => {
    const due = await tx
      .update(leads)
      .set({ reminderSentAt: new Date(now) })
      .where(
        and(
          eq(leads.status, 'new'),
          lte(leads.createdAt, new Date(now - REMINDER_AFTER_HOURS * 3_600_000)),
          isNull(leads.reminderSentAt),
        ),
      )
      .returning({ id: leads.id });
    await enqueue(
      tx,
      due.map((lead) => ({ type: 'telegram.reminder' as const, payload: { leadId: lead.id } })),
    );
    return due.length;
  });
}
